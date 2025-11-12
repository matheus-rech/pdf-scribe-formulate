import { extractTextWithCoordinates, type TextItem } from './textExtraction';
import { searchPageChunks, getTextItemsInRange, type PageChunk } from './pdfChunking';
import Fuse from 'fuse.js';

export interface SourceCitation {
  id: string;
  page: number;
  coordinates: { x: number; y: number; width: number; height: number };
  sourceText: string;
  context: string;
  confidence: number;
  validated?: boolean;
  validationResult?: {
    isValid: boolean;
    matchType: string;
    reasoning: string;
    issues?: string[];
  };
}

interface DetectionResult {
  sourceCitations: SourceCitation[];
  confidence: number;
  method: 'exact-match' | 'fuzzy-match' | 'not-found';
}

export async function detectSourceCitations(
  extractedText: string,
  pdfFile: File,
  pageNumber?: number,
  preProcessedChunks?: PageChunk[]
): Promise<DetectionResult> {
  if (!extractedText || extractedText.trim().length < 3) {
    return {
      sourceCitations: [],
      confidence: 0,
      method: 'not-found'
    };
  }

  try {
    // Use pre-processed chunks if available
    if (preProcessedChunks && preProcessedChunks.length > 0) {
      const matches = searchPageChunks(extractedText, preProcessedChunks, {
        maxResults: 10,
        pageLimit: pageNumber ? [pageNumber] : undefined
      });
      
      if (matches.length === 0) {
        return {
          sourceCitations: [],
          confidence: 0,
          method: 'not-found'
        };
      }
      
      const citations: SourceCitation[] = matches.map(match => {
        const textItems = getTextItemsInRange(
          match.chunk,
          match.chunk.charStart + match.matchIndex,
          match.chunk.charStart + match.matchIndex + match.matchLength
        );
        
        const bounds = calculateBoundingBox(textItems);
        
        return {
          id: `citation-${Date.now()}-${Math.random()}`,
          page: match.chunk.page,
          coordinates: bounds,
          sourceText: extractedText,
          context: extractContextFromChunk(match.chunk, match.matchIndex, match.matchLength),
          confidence: match.confidence
        };
      });
      
      return {
        sourceCitations: citations,
        confidence: citations[0]?.confidence || 0,
        method: 'exact-match'
      };
    }
    
    // Fallback: extract on-demand (old behavior)
    const pagesToSearch = pageNumber ? [pageNumber] : await getAllPageNumbers(pdfFile);
    const allMatches: SourceCitation[] = [];

    for (const page of pagesToSearch.slice(0, 5)) {
      const { items: textItems } = await extractTextWithCoordinates(pdfFile, page);

      const exactMatches = findExactMatches(extractedText, textItems, page);
      if (exactMatches.length > 0) {
        return {
          sourceCitations: exactMatches,
          confidence: 0.95,
          method: 'exact-match'
        };
      }

      const fuzzyMatches = findFuzzyMatches(extractedText, textItems, page);
      allMatches.push(...fuzzyMatches);
    }

    const topMatches = allMatches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return {
      sourceCitations: topMatches,
      confidence: topMatches[0]?.confidence || 0,
      method: topMatches.length > 0 ? 'fuzzy-match' : 'not-found'
    };
  } catch (error) {
    console.error('Error detecting source citations:', error);
    return {
      sourceCitations: [],
      confidence: 0,
      method: 'not-found'
    };
  }
}

async function getAllPageNumbers(pdfFile: File): Promise<number[]> {
  // For now, return first 10 pages to avoid performance issues
  // This can be optimized later by getting actual page count
  return Array.from({ length: 10 }, (_, i) => i + 1);
}

function findExactMatches(
  query: string,
  textItems: TextItem[],
  page: number
): SourceCitation[] {
  const matches: SourceCitation[] = [];
  const queryNormalized = normalizeText(query);

  // Build continuous text with position tracking
  let fullText = '';
  const positionMap: { index: number; item: TextItem }[] = [];

  textItems.forEach(item => {
    const startIndex = fullText.length;
    fullText += item.text + ' ';
    positionMap.push({ index: startIndex, item });
  });

  const fullTextNormalized = normalizeText(fullText);

  // Find all occurrences
  let startIdx = fullTextNormalized.indexOf(queryNormalized);

  while (startIdx !== -1) {
    const endIdx = startIdx + queryNormalized.length;

    // Find which text items span this range
    const spanningItems = positionMap.filter(
      p => p.index >= startIdx - 50 && p.index <= endIdx + 50
    );

    if (spanningItems.length > 0) {
      const bounds = calculateBoundingBox(spanningItems.map(p => p.item));
      const contextText = extractContext(fullText, startIdx, endIdx);

      matches.push({
        id: `citation-${Date.now()}-${Math.random()}`,
        page,
        coordinates: bounds,
        sourceText: query,
        context: contextText,
        confidence: 1.0
      });
    }

    startIdx = fullTextNormalized.indexOf(queryNormalized, endIdx);
  }

  return matches;
}

function findFuzzyMatches(
  query: string,
  textItems: TextItem[],
  page: number
): SourceCitation[] {
  if (textItems.length === 0) return [];

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(textItems, {
    keys: ['text'],
    threshold: 0.3, // 70% similarity
    includeScore: true,
    minMatchCharLength: Math.min(5, query.length)
  });

  const results = fuse.search(query);

  return results.slice(0, 5).map(result => ({
    id: `citation-${Date.now()}-${Math.random()}`,
    page,
    coordinates: {
      x: result.item.x,
      y: result.item.y,
      width: result.item.width,
      height: result.item.height
    },
    sourceText: result.item.text,
    context: extractContextFromItems(textItems, result.refIndex || 0),
    confidence: 1 - (result.score || 0.5)
  }));
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function calculateBoundingBox(items: TextItem[]): {
  x: number; y: number; width: number; height: number
} {
  if (items.length === 0) {
    return { x: 0, y: 0, width: 100, height: 20 };
  }

  const xs = items.map(i => i.x);
  const ys = items.map(i => i.y);
  const rights = items.map(i => i.x + i.width);
  const bottoms = items.map(i => i.y + i.height);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...rights) - Math.min(...xs),
    height: Math.max(...bottoms) - Math.min(...ys)
  };
}

function extractContext(
  fullText: string,
  startIdx: number,
  endIdx: number,
  contextChars: number = 100
): string {
  const contextStart = Math.max(0, startIdx - contextChars);
  const contextEnd = Math.min(fullText.length, endIdx + contextChars);

  let context = fullText.substring(contextStart, contextEnd).trim();

  if (contextStart > 0) context = '...' + context;
  if (contextEnd < fullText.length) context = context + '...';

  return context;
}

function extractContextFromItems(
  textItems: TextItem[],
  refIndex: number,
  contextRange: number = 5
): string {
  const start = Math.max(0, refIndex - contextRange);
  const end = Math.min(textItems.length, refIndex + contextRange + 1);

  const contextItems = textItems.slice(start, end);
  let context = contextItems.map(item => item.text).join(' ');

  if (start > 0) context = '...' + context;
  if (end < textItems.length) context = context + '...';

  return context;
}

function extractContextFromChunk(
  chunk: PageChunk,
  matchIndex: number,
  matchLength: number,
  contextChars: number = 100
): string {
  const start = Math.max(0, matchIndex - contextChars);
  const end = Math.min(chunk.text.length, matchIndex + matchLength + contextChars);
  
  let context = chunk.text.substring(start, end);
  
  if (start > 0) context = '...' + context;
  if (end < chunk.text.length) context = context + '...';
  
  return context;
}

