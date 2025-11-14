/**
 * Automatic Table Extraction
 * 
 * This module provides automatic table detection and extraction when a PDF is uploaded.
 * It integrates with the existing pdfTableExtraction.ts functions and saves results to Supabase.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { extractTablesFromPage, type ExtractedTable } from './pdfTableExtraction';
import { supabase } from '@/integrations/supabase/client';

export interface AutoExtractedTable {
  study_id: string;
  page_number: number;
  table_number: number;
  headers: string[];
  rows: string[][];
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  extraction_method: string;
  caption?: string;
  confidence?: number;
}

/**
 * Automatically extract all tables from a PDF file
 * 
 * @param pdfFile - The PDF file to extract tables from
 * @param studyId - The study ID to associate tables with
 * @returns Array of extracted tables with metadata
 */
export async function autoExtractTablesFromPDF(
  pdfFile: File,
  studyId: string
): Promise<AutoExtractedTable[]> {
  try {
    console.log(`[AutoTableExtraction] Starting automatic table extraction for study ${studyId}`);
    
    // Load PDF document
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    
    const totalPages = pdfDoc.numPages;
    console.log(`[AutoTableExtraction] PDF has ${totalPages} pages`);
    
    const allTables: AutoExtractedTable[] = [];
    
    // Extract tables from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const extractedTables = await extractTablesFromPage(page, pageNum);
      
      if (extractedTables.length > 0) {
        console.log(`[AutoTableExtraction] Found ${extractedTables.length} table(s) on page ${pageNum}`);
        
        // Convert to AutoExtractedTable format
        extractedTables.forEach((table, idx) => {
          allTables.push({
            study_id: studyId,
            page_number: pageNum,
            table_number: idx + 1,
            headers: table.headers,
            rows: table.rows,
            bounding_box: table.boundingBox,
            extraction_method: table.extractionMethod,
            confidence: 0.7, // Default confidence for geometric detection
          });
        });
      }
    }
    
    console.log(`[AutoTableExtraction] Total tables extracted: ${allTables.length}`);
    
    // Enhance tables with caption matching (if available)
    if (allTables.length > 0) {
      await enhanceTablesWithCaptions(allTables, pdfDoc);
    }
    
    return allTables;
  } catch (error) {
    console.error('[AutoTableExtraction] Error extracting tables:', error);
    throw error;
  }
}

/**
 * Enhance extracted tables with caption matching
 * 
 * @param tables - Array of extracted tables
 * @param pdfDoc - PDF document object
 */
async function enhanceTablesWithCaptions(
  tables: AutoExtractedTable[],
  pdfDoc: pdfjsLib.PDFDocumentProxy
): Promise<void> {
  try {
    console.log('[AutoTableExtraction] Enhancing tables with caption matching');
    
    // Extract full text from PDF to find captions
    const fullText = await extractFullTextFromPDF(pdfDoc);
    
    // Find table captions using regex patterns
    const tableCaptionPattern = /Table\s+(\d+)[:\.\s]+([^\n]+)/gi;
    const matches = [...fullText.matchAll(tableCaptionPattern)];
    
    matches.forEach(match => {
      const tableNum = parseInt(match[1]);
      const caption = match[2].trim();
      
      // Find matching table by number
      const matchingTable = tables.find(t => t.table_number === tableNum);
      if (matchingTable) {
        matchingTable.caption = caption;
        matchingTable.confidence = 0.85; // Higher confidence with caption match
        console.log(`[AutoTableExtraction] Matched caption for Table ${tableNum}: ${caption}`);
      }
    });
  } catch (error) {
    console.error('[AutoTableExtraction] Error enhancing with captions:', error);
    // Non-critical error, continue without captions
  }
}

/**
 * Extract full text from PDF document
 * 
 * @param pdfDoc - PDF document object
 * @returns Full text content of the PDF
 */
async function extractFullTextFromPDF(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const textParts: string[] = [];
  
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n');
}

/**
 * Save extracted tables to Supabase database
 * 
 * @param tables - Array of extracted tables
 * @returns Success status
 */
export async function saveExtractedTablesToDatabase(
  tables: AutoExtractedTable[]
): Promise<boolean> {
  try {
    if (tables.length === 0) {
      console.log('[AutoTableExtraction] No tables to save');
      return true;
    }
    
    console.log(`[AutoTableExtraction] Saving ${tables.length} tables to database`);
    
    // Insert tables into pdf_tables table
    const { data, error } = await supabase
      .from('pdf_tables')
      .insert(
        tables.map(table => ({
          study_id: table.study_id,
          page_number: table.page_number,
          table_number: table.table_number,
          headers: table.headers,
          rows: table.rows,
          bounding_box: table.bounding_box,
          extraction_method: table.extraction_method,
          caption: table.caption,
          confidence: table.confidence,
        }))
      );
    
    if (error) {
      console.error('[AutoTableExtraction] Error saving tables to database:', error);
      return false;
    }
    
    console.log('[AutoTableExtraction] Successfully saved tables to database');
    return true;
  } catch (error) {
    console.error('[AutoTableExtraction] Error in saveExtractedTablesToDatabase:', error);
    return false;
  }
}

/**
 * Main function to automatically extract and save tables from PDF
 * 
 * @param pdfFile - The PDF file to process
 * @param studyId - The study ID to associate tables with
 * @returns Number of tables extracted and saved
 */
export async function autoExtractAndSaveTables(
  pdfFile: File,
  studyId: string
): Promise<number> {
  try {
    console.log(`[AutoTableExtraction] Starting auto-extract-and-save for study ${studyId}`);
    
    // Extract tables
    const tables = await autoExtractTablesFromPDF(pdfFile, studyId);
    
    if (tables.length === 0) {
      console.log('[AutoTableExtraction] No tables found in PDF');
      return 0;
    }
    
    // Save to database
    const success = await saveExtractedTablesToDatabase(tables);
    
    if (!success) {
      throw new Error('Failed to save tables to database');
    }
    
    console.log(`[AutoTableExtraction] Successfully extracted and saved ${tables.length} tables`);
    return tables.length;
  } catch (error) {
    console.error('[AutoTableExtraction] Error in autoExtractAndSaveTables:', error);
    throw error;
  }
}
