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

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
        toast.error(`Upload failed: ${uploadError.message}`);
        throw uploadError;
      }
      
      console.log(`✅ PDF uploaded successfully: ${fileName}`);

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

      if (error) {
        console.error('Study creation error:', error);
        toast.error(`Failed to create study: ${error.message}`);
        throw error;
      }
      
      console.log(`✅ Study created successfully: ${data.id}`);

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
            console.error('❌ Error saving figures to database:', figureError);
            toast.error(`Failed to save figures: ${figureError.message || 'Unknown error'}`);
            // Check if it's an auth/RLS issue
            if (figureError.message?.includes('policy') || figureError.message?.includes('permission')) {
              toast.error('Authentication issue: Please ensure you are logged in');
            }
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
              console.error('❌ Error saving tables to database:', tableError);
              toast.error(`Failed to save tables: ${tableError.message || 'Unknown error'}`);
              // Check if it's an auth/RLS issue
              if (tableError.message?.includes('policy') || tableError.message?.includes('permission')) {
                toast.error('Authentication issue: Please ensure you are logged in');
              }
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
                        .from('pdf_tables' as any)
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
      } catch (tableError: any) {
        console.error('❌ Error extracting tables:', tableError);
        toast.error(`Table extraction failed: ${tableError?.message || 'Unknown error'}`);
      }

      // ========= Phase 3: Text Chunk Extraction with Coordinates =========
      try {
        onProgress?.({
          stage: 'complete',
          progress: 96,
          message: 'Extracting text chunks with coordinates...'
        });

        console.log('📑 Starting text chunk extraction with coordinates...');
        
        // Reload PDF for text chunk extraction
        const chunkPdfDoc = await pdfjsLib.getDocument({
          data: await pdfFile.arrayBuffer()
        }).promise;

        const { extractTextWithCoordinates } = await import('@/lib/textChunkIndexing');
        
        const allTextChunks: any[] = [];
        let globalChunkIndex = 0;

        for (let pageNum = 1; pageNum <= chunkPdfDoc.numPages; pageNum++) {
          const page = await chunkPdfDoc.getPage(pageNum);
          
          // Calculate character offset for this page
          const charOffset = processingResult.pageChunks
            .slice(0, pageNum - 1)
            .reduce((sum, chunk) => sum + chunk.text.length, 0);
          
          const pageChunks = await extractTextWithCoordinates(page, pageNum, charOffset);
          
          // Assign global indices and map to sections
          pageChunks.forEach(chunk => {
            chunk.chunkIndex = globalChunkIndex++;
            
            // Find section for this chunk
            if (sections && chunk.charStart !== undefined) {
              const section = sections.find(
                (s: any) => chunk.charStart >= s.charStart && chunk.charEnd <= s.charEnd
              );
              if (section) {
                chunk.sectionName = section.type;
              }
            }
            
            allTextChunks.push(chunk);
          });
        }

        console.log(`📊 Text chunk extraction complete: Found ${allTextChunks.length} chunks`);

        // Save chunks to database
        if (allTextChunks.length > 0) {
          const chunkRecords = allTextChunks.map(chunk => ({
            study_id: data.id,
            user_id: userId,
            chunk_index: chunk.chunkIndex,
            page_number: chunk.pageNum,
            text: chunk.text,
            sentence_count: 1,
            x: chunk.bbox.x,
            y: chunk.bbox.y,
            width: chunk.bbox.width,
            height: chunk.bbox.height,
            char_start: chunk.charStart,
            char_end: chunk.charEnd,
            section_name: chunk.sectionName || null,
            font_name: chunk.fontName,
            font_size: chunk.fontSize,
            is_heading: chunk.isHeading,
            is_bold: chunk.isBold
          }));

          const { error: chunksError } = await supabase
            .from('pdf_text_chunks' as any)
            .insert(chunkRecords as any);

          if (chunksError) {
            console.error('❌ Error saving text chunks to database:', chunksError);
            toast.error(`Failed to save text chunks: ${chunksError.message || 'Unknown error'}`);
            // Check if it's an auth/RLS issue
            if (chunksError.message?.includes('policy') || chunksError.message?.includes('permission')) {
              toast.error('Authentication issue: Please ensure you are logged in');
            }
          } else {
            console.log(`✅ Saved ${allTextChunks.length} text chunks with citation provenance`);
          }
        }
      } catch (chunkError: any) {
        console.error('❌ Error extracting text chunks:', chunkError);
        toast.error(`Text chunk extraction failed: ${chunkError?.message || 'Unknown error'}`);
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

  // Save extraction with automatic citation detection
  const saveExtraction = async (studyId: string, extraction: ExtractionEntry) => {
    if (!userId) {
      toast.error("User ID required - please log in");
      return;
    }

    try {
      // Auto-detect source citations if not already provided
      let sourceCitations = extraction.sourceCitations;
      
      if (!sourceCitations && extraction.text && currentStudy?.pdf_chunks) {
        console.log('🔍 Auto-detecting citations for extraction:', extraction.fieldName);
        const { detectSourceCitations } = await import('@/lib/citationDetector');
        
        // Use pre-processed chunks from the study
        const preProcessedChunks = (currentStudy.pdf_chunks as any)?.pageChunks || [];
        
        if (preProcessedChunks.length > 0) {
          const detectionResult = await detectSourceCitations(
            extraction.text,
            null as any, // We don't need the PDF file since we have pre-processed chunks
            extraction.page,
            preProcessedChunks
          );
          
          if (detectionResult.sourceCitations.length > 0) {
            sourceCitations = detectionResult.sourceCitations;
            console.log(`✅ Auto-detected ${sourceCitations.length} citations with confidence ${detectionResult.confidence}`);
          }
        }
      }

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
        source_citations: sourceCitations || null,
      } as any);

      if (error) {
        console.error('❌ Error saving extraction to database:', error);
        toast.error(`Failed to save extraction: ${error.message || 'Unknown error'}`);
        throw error;
      }
      
      console.log(`✅ Saved extraction: ${extraction.fieldName}`);
    } catch (error: any) {
      console.error("Error saving extraction:", error);
      toast.error(`Failed to save extraction: ${error?.message || 'Unknown error'}`);
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

  // Re-extract figures and tables for a study
  const reextractVisuals = async (
    studyId: string,
    onProgress?: (message: string) => void
  ): Promise<{ figures: number; tables: number; success: boolean }> => {
    if (!userId) {
      toast.error("User ID required - please log in");
      return { figures: 0, tables: 0, success: false };
    }

    try {
      onProgress?.('Loading study PDF...');
      
      // Get study
      const { data: study, error: studyError } = await supabase
        .from("studies")
        .select("*")
        .eq("id", studyId)
        .single();

      if (studyError || !study) {
        toast.error("Study not found");
        return { figures: 0, tables: 0, success: false };
      }

      // Load PDF
      const pdfFile = await loadStudyPdf(study);
      if (!pdfFile) {
        toast.error("Failed to load PDF file");
        return { figures: 0, tables: 0, success: false };
      }

      let figuresCount = 0;
      let tablesCount = 0;

      // ===== Re-extract Figures =====
      onProgress?.('Re-extracting figures...');
      try {
        const pdfDoc = await pdfjsLib.getDocument({
          data: await pdfFile.arrayBuffer()
        }).promise;

        const { allFigures } = await extractAllFigures(
          pdfDoc,
          (current, total) => {
            onProgress?.(`Extracting figures: page ${current}/${total}...`);
          }
        );

        if (allFigures.length > 0) {
          // Delete old figures first
          await supabase
            .from('pdf_figures' as any)
            .delete()
            .eq('study_id', studyId);

          const figureRecords = allFigures.map(fig => ({
            study_id: studyId,
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
            console.error('Error saving re-extracted figures:', figureError);
            toast.error(`Failed to save figures: ${figureError.message}`);
          } else {
            figuresCount = allFigures.length;
            console.log(`✅ Re-extracted ${figuresCount} figures`);
          }
        }
      } catch (figError: any) {
        console.error('Error re-extracting figures:', figError);
        toast.error(`Figure re-extraction failed: ${figError?.message}`);
      }

      // ===== Re-extract Tables =====
      onProgress?.('Re-extracting tables...');
      try {
        const tablePdfDoc = await pdfjsLib.getDocument({
          data: await pdfFile.arrayBuffer()
        }).promise;

        const { extractTablesFromPage } = await import('@/lib/pdfTableExtraction');
        const allTables: any[] = [];

        for (let pageNum = 1; pageNum <= tablePdfDoc.numPages; pageNum++) {
          onProgress?.(`Extracting tables: page ${pageNum}/${tablePdfDoc.numPages}...`);
          
          const page = await tablePdfDoc.getPage(pageNum);
          const tables = await extractTablesFromPage(page, pageNum);
          allTables.push(...tables);
        }

        if (allTables.length > 0) {
          // Delete old tables first
          await supabase
            .from('pdf_tables' as any)
            .delete()
            .eq('study_id', studyId);

          const tableRecords = allTables.map((table: any) => ({
            study_id: studyId,
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
            caption: table.caption || null,
            ai_enhanced: false,
            confidence_score: null
          }));

          const { error: tableError } = await supabase
            .from('pdf_tables' as any)
            .insert(tableRecords as any);

          if (tableError) {
            console.error('Error saving re-extracted tables:', tableError);
            toast.error(`Failed to save tables: ${tableError.message}`);
          } else {
            tablesCount = allTables.length;
            console.log(`✅ Re-extracted ${tablesCount} tables`);
          }
        }
      } catch (tableError: any) {
        console.error('Error re-extracting tables:', tableError);
        toast.error(`Table re-extraction failed: ${tableError?.message}`);
      }

      onProgress?.('Re-extraction complete!');
      
      if (figuresCount > 0 || tablesCount > 0) {
        toast.success(`Re-extracted ${figuresCount} figures and ${tablesCount} tables`);
        return { figures: figuresCount, tables: tablesCount, success: true };
      } else {
        toast.info('No figures or tables found in this PDF');
        return { figures: 0, tables: 0, success: true };
      }
    } catch (error: any) {
      console.error('Error during re-extraction:', error);
      toast.error(`Re-extraction failed: ${error?.message || 'Unknown error'}`);
      return { figures: 0, tables: 0, success: false };
    }
  };

  // Re-extract text chunks for a study
  const reextractTextChunks = async (
    studyId: string,
    onProgress?: (message: string) => void
  ): Promise<{ chunks: number; success: boolean }> => {
    if (!userId) {
      toast.error("User ID required - please log in");
      return { chunks: 0, success: false };
    }

    try {
      onProgress?.('Loading study PDF...');
      
      // Get study
      const { data: study, error: studyError } = await supabase
        .from("studies")
        .select("*")
        .eq("id", studyId)
        .single();

      if (studyError || !study) {
        toast.error("Study not found");
        return { chunks: 0, success: false };
      }

      // Load PDF
      const pdfFile = await loadStudyPdf(study);
      if (!pdfFile) {
        toast.error("Failed to load PDF file");
        return { chunks: 0, success: false };
      }

      let chunksCount = 0;

      // ===== Re-extract Text Chunks =====
      onProgress?.('Re-extracting text chunks with coordinates...');
      try {
        const chunkPdfDoc = await pdfjsLib.getDocument({
          data: await pdfFile.arrayBuffer()
        }).promise;

        const { extractTextWithCoordinates } = await import('@/lib/textChunkIndexing');
        
        const allTextChunks: any[] = [];
        let globalChunkIndex = 0;

        // Get sections from study if available
        const sections = (study.pdf_chunks as any)?.sections || [];

        for (let pageNum = 1; pageNum <= chunkPdfDoc.numPages; pageNum++) {
          onProgress?.(`Extracting text chunks: page ${pageNum}/${chunkPdfDoc.numPages}...`);
          
          const page = await chunkPdfDoc.getPage(pageNum);
          const pageChunks = await extractTextWithCoordinates(page, pageNum, 0);

          // Assign global indices and map to sections
          pageChunks.forEach(chunk => {
            chunk.chunkIndex = globalChunkIndex++;
            
            // Find section for this chunk
            if (sections && chunk.charStart !== undefined) {
              const section = sections.find(
                (s: any) => chunk.charStart >= s.charStart && chunk.charEnd <= s.charEnd
              );
              if (section) {
                chunk.sectionName = section.type;
              }
            }
            
            allTextChunks.push(chunk);
          });
        }

        console.log(`📊 Text chunk re-extraction complete: Found ${allTextChunks.length} chunks`);

        if (allTextChunks.length > 0) {
          // Delete old chunks first
          await supabase
            .from('pdf_text_chunks' as any)
            .delete()
            .eq('study_id', studyId);

          const chunkRecords = allTextChunks.map(chunk => ({
            study_id: studyId,
            user_id: userId,
            chunk_index: chunk.chunkIndex,
            page_number: chunk.pageNum,
            text: chunk.text,
            sentence_count: 1,
            x: chunk.bbox.x,
            y: chunk.bbox.y,
            width: chunk.bbox.width,
            height: chunk.bbox.height,
            char_start: chunk.charStart,
            char_end: chunk.charEnd,
            section_name: chunk.sectionName || null,
            font_name: chunk.fontName,
            font_size: chunk.fontSize,
            is_heading: chunk.isHeading,
            is_bold: chunk.isBold
          }));

          const { error: chunksError } = await supabase
            .from('pdf_text_chunks' as any)
            .insert(chunkRecords as any);

          if (chunksError) {
            console.error('❌ Error saving re-extracted text chunks:', chunksError);
            toast.error(`Failed to save text chunks: ${chunksError.message}`);
          } else {
            chunksCount = allTextChunks.length;
            console.log(`✅ Re-extracted ${chunksCount} text chunks`);
          }
        }
      } catch (chunkError: any) {
        console.error('Error re-extracting text chunks:', chunkError);
        toast.error(`Text chunk re-extraction failed: ${chunkError?.message}`);
      }

      onProgress?.('Re-extraction complete!');
      
      if (chunksCount > 0) {
        toast.success(`Re-extracted ${chunksCount} text chunks`);
        return { chunks: chunksCount, success: true };
      } else {
        toast.info('No text chunks found in this PDF');
        return { chunks: 0, success: true };
      }
    } catch (error: any) {
      console.error('Error during text chunk re-extraction:', error);
      toast.error(`Re-extraction failed: ${error?.message || 'Unknown error'}`);
      return { chunks: 0, success: false };
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

  // Re-extract all (figures, tables, and text chunks) in one operation
  const reextractAll = async (studyId: string, onProgress: (message: string) => void) => {
    try {
      onProgress('Starting comprehensive re-extraction...');
      
      // Run visual extraction first
      onProgress('Re-extracting figures and tables...');
      const visualResult = await reextractVisuals(studyId, onProgress);
      
      if (!visualResult.success) {
        return { success: false, figures: 0, tables: 0, chunks: 0 };
      }
      
      // Then extract text chunks
      onProgress('Re-extracting text chunks...');
      const chunksResult = await reextractTextChunks(studyId, onProgress);
      
      if (!chunksResult.success) {
        return { 
          success: false, 
          figures: visualResult.figures, 
          tables: visualResult.tables, 
          chunks: 0 
        };
      }
      
      onProgress('Complete! All data re-extracted successfully');
      toast.success(`Re-extracted ${visualResult.figures} figures, ${visualResult.tables} tables, and ${chunksResult.chunks} text chunks`);
      
      return {
        success: true,
        figures: visualResult.figures,
        tables: visualResult.tables,
        chunks: chunksResult.chunks
      };
    } catch (error: any) {
      console.error('Error in comprehensive re-extraction:', error);
      toast.error(`Re-extraction failed: ${error.message}`);
      return { success: false, figures: 0, tables: 0, chunks: 0 };
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
    reextractVisuals,
    reextractTextChunks,
    reextractAll,
    bulkReprocessStudies,
    savePageAnnotations,
    loadPageAnnotations,
    matchFigureCaptions,
    loadStudyFigures,
  };
};
