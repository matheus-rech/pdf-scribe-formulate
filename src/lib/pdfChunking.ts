import { extractTextWithCoordinates, type TextItem } from './textExtraction';
import * as pdfjsLib from 'pdfjs-dist';

export interface SubChunk {
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  textItems: TextItem[];
}

export interface PageChunk {
  page: number;
  text: string;
  charStart: number;
  charEnd: number;
  textItems: TextItem[];
  subChunks?: SubChunk[];
}

export interface PDFProcessingResult {
  version: string;
  processedAt: string;
  totalPages: number;
  pageChunks: PageChunk[];
  chunkingConfig: {
    maxChunkSize: number;
    overlapSize: number;
    useSubChunking: boolean;
  };
}

/**
 * Create sub-chunks from text items with overlap for better context
 */
function createSubChunks(
  textItems: TextItem[],
  pageText: string,
  maxChunkSize: number,
  overlapSize: number,
  pageCharStart: number
): SubChunk[] {
  if (pageText.length <= maxChunkSize) {
    // Page is small enough, no need to sub-chunk
    return [];
  }

  const subChunks: SubChunk[] = [];
  let currentChunkStart = 0;
  let subChunkIndex = 0;

  while (currentChunkStart < pageText.length) {
    const chunkEnd = Math.min(currentChunkStart + maxChunkSize, pageText.length);
    
    // Find sentence boundary for cleaner splits
    let actualEnd = chunkEnd;
    if (chunkEnd < pageText.length) {
      const sentenceEnd = pageText.lastIndexOf('. ', chunkEnd);
      if (sentenceEnd > currentChunkStart + maxChunkSize / 2) {
        actualEnd = sentenceEnd + 1;
      }
    }

    const chunkText = pageText.slice(currentChunkStart, actualEnd).trim();
    
    // Find text items that belong to this chunk
    let currentPos = 0;
    const chunkTextItems: TextItem[] = [];
    
    for (const item of textItems) {
      const itemStart = currentPos;
      const itemEnd = currentPos + item.text.length;
      
      if (itemEnd >= currentChunkStart && itemStart <= actualEnd) {
        chunkTextItems.push(item);
      }
      
      currentPos = itemEnd + 1; // +1 for space
    }

    subChunks.push({
      index: subChunkIndex,
      text: chunkText,
      charStart: pageCharStart + currentChunkStart,
      charEnd: pageCharStart + actualEnd,
      textItems: chunkTextItems
    });

    // Move to next chunk with overlap
    currentChunkStart = actualEnd - overlapSize;
    if (currentChunkStart >= pageText.length) break;
    subChunkIndex++;
  }

  return subChunks;
}

/**
 * Process entire PDF and extract all text with coordinates
 * This runs once during upload and stores results in database
 * Now supports sub-page chunking for better AI processing
 */
export async function processFullPDF(
  pdfFile: File,
  onProgress?: (current: number, total: number) => void,
  options: {
    maxChunkSize?: number;
    overlapSize?: number;
    useSubChunking?: boolean;
  } = {}
): Promise<PDFProcessingResult> {
  const maxChunkSize = options.maxChunkSize || 3000;
  const overlapSize = options.overlapSize || 300;
  const useSubChunking = options.useSubChunking !== false; // Default true

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
    
    // Create sub-chunks if enabled and page is large
    const subChunks = useSubChunking 
      ? createSubChunks(textItems, pageText, maxChunkSize, overlapSize, charStart)
      : [];
    
    pageChunks.push({
      page: pageNum,
      text: pageText,
      charStart,
      charEnd,
      textItems,
      subChunks: subChunks.length > 0 ? subChunks : undefined
    });
    
    charOffset = charEnd + 1; // +1 for page break
  }
  
  return {
    version: '2.0', // Increment version for sub-chunking support
    processedAt: new Date().toISOString(),
    totalPages,
    pageChunks,
    chunkingConfig: {
      maxChunkSize,
      overlapSize,
      useSubChunking
    }
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
