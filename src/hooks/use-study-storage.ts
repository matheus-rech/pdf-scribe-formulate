import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ExtractionEntry } from "@/pages/Index";
import { processFullPDF } from "@/lib/pdfChunking";
import { createSemanticChunks } from "@/lib/semanticChunking";
import { detectSections } from "@/lib/sectionDetection";

interface Study {
  id: string;
  email: string;
  name: string;
  pdf_name: string | null;
  pdf_url: string | null;
  total_pages: number;
  created_at: string;
  updated_at: string;
  pdf_chunks?: any;
}

export const useStudyStorage = (email: string | null) => {
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Upload PDF to storage and create study record
  const createStudy = async (name: string, pdfFile: File, totalPages: number) => {
    if (!email) {
      toast.error("Email required");
      return null;
    }

    setIsLoading(true);
    try {
      // Upload PDF to storage
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${email}/${Date.now()}.${fileExt}`;
      
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

      // Pre-process PDF
      toast.info("Processing PDF text...");
      
      const processingResult = await processFullPDF(pdfFile, (current, total) => {
        console.log(`Processing page ${current}/${total}`);
      });
      
      const semanticChunks = createSemanticChunks(processingResult.pageChunks);
      const sections = detectSections(processingResult.pageChunks);
      
      const pdfChunks = {
        ...processingResult,
        semanticChunks,
        sections
      };

      // Create study record with chunks
      const { data, error } = await supabase
        .from("studies")
        .insert({
          email,
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
      toast.success("Study created and PDF processed");
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
    try {
      const { error } = await supabase.from("extractions").insert({
        study_id: studyId,
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

  // Get all studies for this meta-analysis
  const getAllStudies = async () => {
    if (!email) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("studies")
        .select("*")
        .eq("email", email)
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

  return {
    currentStudy,
    setCurrentStudy,
    isLoading,
    createStudy,
    saveExtraction,
    loadExtractions,
    getAllStudies,
    loadStudyPdf,
  };
};
