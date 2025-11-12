import { extractTextWithCoordinates, type TextItem } from './textExtraction';
import * as pdfjsLib from 'pdfjs-dist';

export interface PageChunk {
  page: number;
  text: string;
  charStart: number;
  charEnd: number;
  textItems: TextItem[];
}

export interface PDFProcessingResult {
  version: string;
  processedAt: string;
  totalPages: number;
  pageChunks: PageChunk[];
}

/**
 * Process entire PDF and extract all text with coordinates
 * This runs once during upload and stores results in database
 */
export async function processFullPDF(
  pdfFile: File,
  onProgress?: (current: number, total: number) => void
): Promise<PDFProcessingResult> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const pageChunks: PageChunk[] = [];
  let charOffset = 0;
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages);
    
    const { items: textItems } = await extractTextWithCoordinates(pdfFile, pageNum);
    
    // Concatenate all text for this page
    const pageText = textItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const charStart = charOffset;
    const charEnd = charOffset + pageText.length;
    
    pageChunks.push({
      page: pageNum,
      text: pageText,
      charStart,
      charEnd,
      textItems
    });
    
    charOffset = charEnd + 1; // +1 for page break
  }
  
  return {
    version: '1.0',
    processedAt: new Date().toISOString(),
    totalPages,
    pageChunks
  };
}

/**
 * Search across all page chunks for text matches
 * Used by citation detector to search entire document quickly
 */
export function searchPageChunks(
  query: string,
  pageChunks: PageChunk[],
  options: {
    caseSensitive?: boolean;
    maxResults?: number;
    pageLimit?: number[];
  } = {}
): Array<{
  chunk: PageChunk;
  matchIndex: number;
  matchLength: number;
  confidence: number;
}> {
  const normalizedQuery = options.caseSensitive 
    ? query 
    : query.toLowerCase();
  
  const results = [];
  
  for (const chunk of pageChunks) {
    // Skip if page not in limit
    if (options.pageLimit && !options.pageLimit.includes(chunk.page)) {
      continue;
    }
    
    const searchText = options.caseSensitive 
      ? chunk.text 
      : chunk.text.toLowerCase();
    
    let index = searchText.indexOf(normalizedQuery);
    
    while (index !== -1) {
      results.push({
        chunk,
        matchIndex: index,
        matchLength: query.length,
        confidence: 1.0 // Exact match
      });
      
      if (options.maxResults && results.length >= options.maxResults) {
        return results;
      }
      
      index = searchText.indexOf(normalizedQuery, index + 1);
    }
  }
  
  return results;
}

/**
 * Get text items in a specific character range
 * Used to get coordinates for highlighting
 */
export function getTextItemsInRange(
  pageChunk: PageChunk,
  charStart: number,
  charEnd: number
): TextItem[] {
  // Convert global char positions to page-relative positions
  const pageCharStart = charStart - pageChunk.charStart;
  const pageCharEnd = charEnd - pageChunk.charStart;
  
  let currentPos = 0;
  const matchingItems: TextItem[] = [];
  
  for (const item of pageChunk.textItems) {
    const itemStart = currentPos;
    const itemEnd = currentPos + item.text.length;
    
    // Check if item overlaps with target range
    if (itemEnd >= pageCharStart && itemStart <= pageCharEnd) {
      matchingItems.push(item);
    }
    
    currentPos = itemEnd + 1; // +1 for space between items
  }
  
  return matchingItems;
}
