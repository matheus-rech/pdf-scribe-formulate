import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ExtractionEntry } from "@/pages/Index";
import { processFullPDF } from "@/lib/pdfChunking";
import { createSemanticChunks } from "@/lib/semanticChunking";
import { detectSections } from "@/lib/sectionDetection";
import type { PageAnnotation } from "@/hooks/usePageAnnotations";

interface Study {
  id: string;
  user_id: string;
  email: string;
  name: string;
  pdf_name: string | null;
  pdf_url: string | null;
  total_pages: number;
  created_at: string;
  updated_at: string;
  pdf_chunks?: any;
  page_annotations?: any;
}

export const useStudyStorage = (userId: string | null) => {
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Upload PDF to storage and create study record
  const createStudy = async (
    name: string, 
    pdfFile: File, 
    totalPages: number,
    onSectionDetection?: (sections: any[]) => void
  ) => {
    if (!userId) {
      toast.error("User ID required - please log in");
      return null;
    }

    setIsLoading(true);
    try {
      // Get user email for backwards compatibility with storage paths
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      
      // Upload PDF to storage using user_id for path
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-pdfs')
        .upload(fileName, pdfFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('study-pdfs')
        .getPublicUrl(fileName);

      // Pre-process PDF with progress updates
      toast.info("Analyzing PDF structure...");
      
      const processingResult = await processFullPDF(pdfFile, (current, total) => {
        console.log(`Processing page ${current}/${total}`);
        // Could add progress callback here if needed
      });
      
      toast.info("Creating semantic chunks...");
      const semanticChunks = createSemanticChunks(processingResult.pageChunks);
      
      toast.info("Detecting document sections...");
      const sections = detectSections(processingResult.pageChunks);
      
      // Notify callback about detected sections
      if (onSectionDetection) {
        onSectionDetection(sections);
      }
      
      console.log(`✨ Section detection complete: Found ${sections.length} sections`, sections);
      
      const pdfChunks = {
        ...processingResult,
        semanticChunks,
        sections
      };

      // Create study record with chunks
      const { data, error } = await supabase
        .from("studies")
        .insert({
          user_id: userId,
          email: userEmail,
          name,
          pdf_name: pdfFile.name,
          pdf_url: publicUrl,
          total_pages: totalPages,
          pdf_chunks: pdfChunks as any
        } as any)
        .select()
        .single();

      if (error) throw error;

      setCurrentStudy(data);
      
      const avgConfidence = Math.round(
        (sections.reduce((sum: number, s: any) => sum + s.confidence, 0) / sections.length) * 100
      );
      
      toast.success(
        `Study created! Detected ${sections.length} sections with ${avgConfidence}% confidence`,
        { duration: 4000 }
      );
      
      return data;
    } catch (error: any) {
      console.error("Error creating study:", error);
      toast.error("Failed to create study");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Save extraction
  const saveExtraction = async (studyId: string, extraction: ExtractionEntry) => {
    if (!userId) {
      toast.error("User ID required");
      return;
    }

    try {
      const { error } = await supabase.from("extractions").insert({
        study_id: studyId,
        user_id: userId,
        extraction_id: extraction.id,
        field_name: extraction.fieldName,
        text: extraction.text,
        page: extraction.page,
        coordinates: extraction.coordinates || null,
        method: extraction.method,
        timestamp: extraction.timestamp.toISOString(),
        image_data: extraction.imageData || null,
        source_citations: extraction.sourceCitations || null,
      } as any);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving extraction:", error);
      toast.error("Failed to save extraction");
    }
  };

  // Load extractions for study
  const loadExtractions = async (studyId: string): Promise<ExtractionEntry[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("extractions")
        .select("*")
        .eq("study_id", studyId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((e) => ({
        id: e.extraction_id,
        fieldName: e.field_name,
        text: e.text || "",
        page: e.page || 1,
        coordinates: e.coordinates as any,
        method: e.method as any,
        timestamp: new Date(e.timestamp || e.created_at),
        imageData: e.image_data || undefined,
        sourceCitations: e.source_citations as any,
      }));
    } catch (error: any) {
      console.error("Error loading extractions:", error);
      toast.error("Failed to load extractions");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get all studies for this user
  const getAllStudies = async () => {
    if (!userId) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("studies")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error loading studies:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load a study's PDF from storage
  const loadStudyPdf = async (study: Study): Promise<File | null> => {
    if (!study.pdf_url) return null;

    try {
      const response = await fetch(study.pdf_url);
      const blob = await response.blob();
      const file = new File([blob], study.pdf_name || 'study.pdf', { type: 'application/pdf' });
      return file;
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load study PDF");
      return null;
    }
  };

  // Re-process PDF to regenerate chunks
  const reprocessStudy = async (studyId: string): Promise<boolean> => {
    const study = await supabase
      .from("studies")
      .select("*")
      .eq("id", studyId)
      .single();

    if (!study.data || !study.data.pdf_url) {
      toast.error("Study not found or missing PDF");
      return false;
    }

    setIsLoading(true);
    try {
      // Load PDF from storage
      toast.info("Loading PDF from storage...");
      const pdfFile = await loadStudyPdf(study.data);
      if (!pdfFile) {
        throw new Error("Failed to load PDF");
      }

      // Re-process PDF
      toast.info("Re-processing PDF text...");
      const processingResult = await processFullPDF(pdfFile, (current, total) => {
        console.log(`Re-processing page ${current}/${total}`);
      });
      
      const semanticChunks = createSemanticChunks(processingResult.pageChunks);
      const sections = detectSections(processingResult.pageChunks);
      
      const pdfChunks = {
        ...processingResult,
        semanticChunks,
        sections
      };

      // Update study with new chunks
      const { error } = await supabase
        .from("studies")
        .update({ pdf_chunks: pdfChunks as any })
        .eq("id", studyId);

      if (error) throw error;

      // Update current study if it matches
      if (currentStudy?.id === studyId) {
        setCurrentStudy({ ...study.data, pdf_chunks: pdfChunks });
      }

      toast.success("PDF re-processed successfully");
      return true;
    } catch (error: any) {
      console.error("Error re-processing study:", error);
      toast.error("Failed to re-process PDF");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Save page annotations to database
  const savePageAnnotations = async (studyId: string, annotations: PageAnnotation[]) => {
    if (!userId) {
      console.error("User ID required to save annotations");
      return;
    }

    try {
      const { error } = await supabase
        .from("studies")
        .update({ 
          page_annotations: annotations
        } as any)
        .eq("id", studyId)
        .eq("user_id", userId);

      if (error) throw error;
      
      console.log(`✅ Saved ${annotations.length} annotations for study ${studyId}`);
    } catch (error: any) {
      console.error("Error saving annotations:", error);
      toast.error("Failed to save annotations");
    }
  };

  // Load page annotations from database
  const loadPageAnnotations = async (studyId: string): Promise<PageAnnotation[]> => {
    if (!userId) {
      console.error("User ID required to load annotations");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("studies")
        .select("page_annotations")
        .eq("id", studyId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      
      const annotations = ((data as any)?.page_annotations || []) as PageAnnotation[];
      console.log(`✅ Loaded ${annotations.length} annotations for study ${studyId}`);
      return annotations;
    } catch (error: any) {
      console.error("Error loading annotations:", error);
      return [];
    }
  };

  return {
    currentStudy,
    setCurrentStudy,
    isLoading,
    createStudy,
    saveExtraction,
    loadExtractions,
    getAllStudies,
    loadStudyPdf,
    reprocessStudy,
    savePageAnnotations,
    loadPageAnnotations,
  };
};
