import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ExtractionEntry } from "@/pages/Index";
import { processFullPDF } from "@/lib/pdfChunking";
import { createSemanticChunks } from "@/lib/semanticChunking";
import { detectSections } from "@/lib/sectionDetection";
import type { PageAnnotation } from "@/hooks/usePageAnnotations";
import { extractAllFigures } from "@/lib/figureExtraction";
import * as pdfjsLib from 'pdfjs-dist';

export interface ProcessingProgress {
  stage: 'uploading' | 'analyzing' | 'chunking' | 'sections' | 'complete';
  progress: number;
  currentPage?: number;
  totalPages?: number;
  message: string;
}

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
    onProgress?: (progress: ProcessingProgress) => void,
    onSectionDetection?: (sections: any[]) => void
  ) => {
    if (!userId) {
      toast.error("User ID required - please log in");
      return null;
    }

    setIsLoading(true);
    try {
      onProgress?.({
        stage: 'uploading',
        progress: 5,
        message: 'Uploading PDF to storage...'
      });

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

      onProgress?.({
        stage: 'analyzing',
        progress: 25,
        message: 'Analyzing PDF structure...',
        totalPages
      });
      
      // Pre-process PDF with progress updates
      const processingResult = await processFullPDF(pdfFile, (current, total) => {
        const pageProgress = 25 + (current / total) * 35; // 25-60%
        onProgress?.({
          stage: 'analyzing',
          progress: pageProgress,
          currentPage: current,
          totalPages: total,
          message: `Processing page ${current} of ${total}...`
        });
      });
      
      onProgress?.({
        stage: 'chunking',
        progress: 60,
        message: 'Creating semantic chunks for AI processing...'
      });
      const semanticChunks = createSemanticChunks(processingResult.pageChunks);
      
      onProgress?.({
        stage: 'sections',
        progress: 75,
        message: 'Detecting document sections...'
      });
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

      // Extract figures from PDF
      onProgress?.({
        stage: 'complete',
        progress: 85,
        message: 'Extracting figures from PDF...'
      });

      try {
        // Load PDF.js for figure extraction
        const pdfDoc = await pdfjsLib.getDocument({
          data: await pdfFile.arrayBuffer()
        }).promise;

        const { allFigures, allDiagnostics } = await extractAllFigures(
          pdfDoc,
          (current, total) => {
            const figProgress = 85 + (current / total) * 10; // 85-95%
            onProgress?.({
              stage: 'complete',
              progress: figProgress,
              message: `Extracting figures: page ${current}/${total}...`
            });
          }
        );

        console.log(`📊 Figure extraction complete: Found ${allFigures.length} figures`);

        // Save figures to database
        if (allFigures.length > 0) {
          const figureRecords = allFigures.map(fig => ({
            study_id: data.id,
            user_id: userId,
            page_number: fig.pageNum,
            figure_id: fig.id,
            data_url: fig.dataUrl,
            width: fig.width,
            height: fig.height,
            x: fig.x,
            y: fig.y,
            bbox_width: fig.width,
            bbox_height: fig.height,
            extraction_method: fig.extractionMethod,
            color_space: fig.metadata.colorSpace,
            has_alpha: fig.metadata.hasAlpha,
            data_length: fig.metadata.dataLength,
            caption: fig.caption || null,
            ai_enhanced: fig.aiEnhanced || false
          }));

          const { error: figureError } = await supabase
            .from('pdf_figures' as any)
            .insert(figureRecords as any);

          if (figureError) {
            console.error('Error saving figures:', figureError);
            toast.error('Figures extracted but failed to save to database');
          } else {
            console.log(`✅ Saved ${allFigures.length} figures to database`);
            
            // Enhance captions with AI for figures on pages with text content
            onProgress?.({
              stage: 'complete',
              progress: 95,
              message: 'Enhancing figure captions with AI...'
            });

            try {
              // Get page text context for each figure
              const pageTexts = new Map<number, string>();
              for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                pageTexts.set(pageNum, pageText);
              }

              // Match captions for each figure using AI (rate-limited batches)
              const matchedCount = await matchFigureCaptions(
                data.id,
                allFigures,
                pageTexts
              );

              if (matchedCount > 0) {
                console.log(`🤖 AI-matched ${matchedCount}/${allFigures.length} figure captions`);
              }
            } catch (aiError) {
              console.error('Error enhancing captions:', aiError);
              // Don't fail the entire process if caption enhancement fails
            }
          }
        }
      } catch (figError) {
        console.error('Error extracting figures:', figError);
        // Don't fail the entire study creation if figure extraction fails
        toast.error('Failed to extract figures, but study was created');
      }

      // Extract tables from PDF
      onProgress?.({
        stage: 'complete',
        progress: 95,
        message: 'Extracting tables from PDF...'
      });

      try {
        // Reload PDF for table extraction
        const tablePdfDoc = await pdfjsLib.getDocument({
          data: await pdfFile.arrayBuffer()
        }).promise;

        const { extractTablesFromPage } = await import('@/lib/pdfTableExtraction');
        
        const allTables: any[] = [];
        for (let pageNum = 1; pageNum <= tablePdfDoc.numPages; pageNum++) {
          const page = await tablePdfDoc.getPage(pageNum);
          const pageTables = await extractTablesFromPage(page, pageNum);
          allTables.push(...pageTables);
        }

        console.log(`📊 Table extraction complete: Found ${allTables.length} tables`);

        // Save tables to database
        if (allTables.length > 0) {
          const tableRecords = allTables.map(table => ({
            study_id: data.id,
            user_id: userId,
            table_id: table.id,
            page_number: table.pageNum,
            x: table.boundingBox.x,
            y: table.boundingBox.y,
            bbox_width: table.boundingBox.width,
            bbox_height: table.boundingBox.height,
            headers: table.headers,
            rows: table.rows,
            column_count: table.headers.length,
            row_count: table.rows.length,
            column_positions: table.columnPositions,
            extraction_method: table.extractionMethod,
            caption: null,
            ai_enhanced: false,
            confidence_score: null
          }));

          const { error: tableError } = await supabase
            .from('pdf_tables' as any)
            .insert(tableRecords as any);

          if (tableError) {
            console.error('Error saving tables:', tableError);
            toast.error('Tables extracted but failed to save to database');
          } else {
            console.log(`✅ Saved ${allTables.length} tables to database`);
            
            // Enhance captions with AI
            try {
              // Get page text context for each table
              const pageTexts = new Map<number, string>();
              for (let pageNum = 1; pageNum <= tablePdfDoc.numPages; pageNum++) {
                const page = await tablePdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                pageTexts.set(pageNum, pageText);
              }

              // Group tables by page
              const tablesByPage = new Map<number, any[]>();
              allTables.forEach(table => {
                if (!tablesByPage.has(table.pageNum)) {
                  tablesByPage.set(table.pageNum, []);
                }
                tablesByPage.get(table.pageNum)!.push(table);
              });

              // Match captions for each page's tables
              let matchedCount = 0;
              for (const [pageNum, pageTables] of tablesByPage.entries()) {
                const pageText = pageTexts.get(pageNum) || '';
                
                const { data: matchData, error: matchError } = await supabase.functions.invoke(
                  'match-table-captions',
                  {
                    body: {
                      tables: pageTables.map(t => ({
                        tableId: t.id,
                        x: t.boundingBox.x,
                        y: t.boundingBox.y,
                        columnCount: t.headers.length,
                        rowCount: t.rows.length,
                        headers: t.headers
                      })),
                      pageText,
                      pageNumber: pageNum
                    }
                  }
                );

                if (matchError) {
                  console.error(`Error matching table captions for page ${pageNum}:`, matchError);
                  continue;
                }

                // Update tables with matched captions
                if (matchData?.results) {
                  for (const result of matchData.results) {
                    if (result.caption && !result.error) {
                      await supabase
                        .from('pdf_tables')
                        .update({
                          caption: result.caption,
                          confidence_score: result.confidence,
                          ai_enhanced: true
                        })
                        .eq('study_id', data.id)
                        .eq('table_id', result.tableId);
                      
                      matchedCount++;
                    }
                  }
                }
              }

              if (matchedCount > 0) {
                console.log(`🤖 AI-matched ${matchedCount}/${allTables.length} table captions`);
              }
            } catch (aiError) {
              console.error('Error enhancing table captions:', aiError);
              // Don't fail the entire process
            }
          }
        }
      } catch (tableError) {
        console.error('Error extracting tables:', tableError);
        // Don't fail the entire study creation
        toast.error('Failed to extract tables, but study was created');
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Study created successfully!'
      });

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

  // Bulk reprocess all studies with missing chunks
  const bulkReprocessStudies = async (
    onProgress?: (progress: {
      total: number;
      completed: number;
      failed: number;
      current?: string;
      results: {
        studyId: string;
        studyName: string;
        status: 'pending' | 'processing' | 'success' | 'error';
        error?: string;
      }[];
    }) => void
  ): Promise<{ success: number; failed: number }> => {
    if (!userId) {
      toast.error("User ID required");
      return { success: 0, failed: 0 };
    }

    // Get all studies
    const allStudies = await getAllStudies();
    
    // Filter studies with missing chunks
    const studiesNeedingReprocess = allStudies.filter(
      study => !study.pdf_chunks || 
        typeof study.pdf_chunks !== 'object' ||
        !('pageChunks' in study.pdf_chunks) || 
        !(study.pdf_chunks as any).pageChunks || 
        (study.pdf_chunks as any).pageChunks.length === 0
    );

    if (studiesNeedingReprocess.length === 0) {
      toast.info("All studies already have chunks!");
      return { success: 0, failed: 0 };
    }

    toast.info(`Found ${studiesNeedingReprocess.length} studies needing reprocessing`);

    let completed = 0;
    let failed = 0;
    const results: {
      studyId: string;
      studyName: string;
      status: 'pending' | 'processing' | 'success' | 'error';
      error?: string;
    }[] = studiesNeedingReprocess.map(study => ({
      studyId: study.id,
      studyName: study.name,
      status: 'pending' as const
    }));

    // Report initial progress
    onProgress?.({
      total: studiesNeedingReprocess.length,
      completed: 0,
      failed: 0,
      results: [...results]
    });

    // Process each study sequentially
    for (let i = 0; i < studiesNeedingReprocess.length; i++) {
      const study = studiesNeedingReprocess[i];
      
      // Update status to processing
      results[i].status = 'processing';
      onProgress?.({
        total: studiesNeedingReprocess.length,
        completed,
        failed,
        current: study.name,
        results: [...results]
      });

      try {
        // Load PDF from storage
        const pdfFile = await loadStudyPdf(study);
        if (!pdfFile) {
          throw new Error("Failed to load PDF");
        }

        // Process PDF
        const processingResult = await processFullPDF(pdfFile, () => {});
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
          .eq("id", study.id);

        if (error) throw error;

        // Mark as success
        results[i].status = 'success';
        completed++;
        
        console.log(`✅ Successfully reprocessed: ${study.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to reprocess ${study.name}:`, error);
        results[i].status = 'error';
        results[i].error = error.message || 'Unknown error';
        failed++;
      }

      // Report progress
      onProgress?.({
        total: studiesNeedingReprocess.length,
        completed,
        failed,
        current: undefined,
        results: [...results]
      });
    }

    if (failed === 0) {
      toast.success(`Successfully reprocessed all ${completed} studies!`);
    } else {
      toast.warning(`Completed: ${completed} successful, ${failed} failed`);
    }

    return { success: completed, failed };
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

  // Match figure captions with AI based on proximity and references
  const matchFigureCaptions = async (
    studyId: string,
    figures: any[],
    pageTexts: Map<number, string>
  ): Promise<number> => {
    let matchedCount = 0;

    // Group figures by page for batch processing
    const figuresByPage = new Map<number, any[]>();
    figures.forEach(figure => {
      const pageNum = figure.pageNum;
      if (!figuresByPage.has(pageNum)) {
        figuresByPage.set(pageNum, []);
      }
      figuresByPage.get(pageNum)!.push(figure);
    });

    // Process each page with figures
    for (const [pageNum, pageFigures] of figuresByPage.entries()) {
      try {
        const pageText = pageTexts.get(pageNum);
        if (!pageText || pageText.length < 50) {
          console.log(`Skipping page ${pageNum} - insufficient text`);
          continue;
        }

        console.log(`Matching captions for ${pageFigures.length} figures on page ${pageNum}`);

        const { data, error } = await supabase.functions.invoke('match-figure-captions', {
          body: {
            figures: pageFigures.map(fig => ({
              id: fig.id,
              page_number: pageNum,
              x: fig.x || 0,
              y: fig.y || 0,
              width: fig.width,
              height: fig.height,
              figure_id: fig.id
            })),
            pageText: pageText,
            pageNumber: pageNum
          }
        });

        if (error) {
          console.error(`Caption matching error for page ${pageNum}:`, error);
          continue;
        }

        const matches = data?.matches || [];
        console.log(`Found ${matches.length} caption matches on page ${pageNum}`);

        // Update figures with matched captions
        for (const match of matches) {
          if (match.confidence > 0.5 && match.caption) {
            const { error: updateError } = await supabase
              .from('pdf_figures' as any)
              .update({
                caption: match.caption,
                ai_enhanced: true
              })
              .eq('study_id', studyId)
              .eq('figure_id', match.figure_id);

            if (!updateError) {
              matchedCount++;
              console.log(`  ✓ Matched: ${match.figure_id} -> "${match.caption.substring(0, 60)}..." (${match.confidence.toFixed(2)})`);
            }
          }
        }

        // Rate limiting: small delay between page API calls
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error(`Error matching captions for page ${pageNum}:`, error);
        continue;
      }
    }

    return matchedCount;
  };

  // Load extracted figures for a study
  const loadStudyFigures = async (studyId: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_figures' as any)
        .select('*')
        .eq('study_id', studyId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error loading figures:', error);
      toast.error('Failed to load extracted figures');
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
    bulkReprocessStudies,
    savePageAnnotations,
    loadPageAnnotations,
    loadStudyFigures,
  };
};
