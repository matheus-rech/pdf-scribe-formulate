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
      const { items: textItems, pageText } = await extractTextWithCoordinates(pdfFile, page);

      const exactMatches = findExactMatches(extractedText, textItems, page, pageText);
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

/**
 * Normalize the query text using the same approach as pageText
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Create a normalized string for the fullText and keep a mapping from normalized index -> original index.
 * This allows translating normalized match positions back to original positions reliably.
 */
function normalizeWithIndexMap(text: string) {
  const normChars: string[] = [];
  const normToOriginal: number[] = [];
  let lastWasSpace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isWord = /[A-Za-z0-9]/.test(ch);
    if (!isWord) {
      if (!lastWasSpace) {
        normChars.push(' ');
        normToOriginal.push(i);
        lastWasSpace = true;
      } else {
        // multiple non-word chars collapsed: we do not append but we still advance
        // do not push a mapping because normalized string doesn't add a char
      }
    } else {
      normChars.push(ch.toLowerCase());
      normToOriginal.push(i);
      lastWasSpace = false;
    }
  }

  return { normalized: normChars.join(''), normToOriginal };
}

/**
 * Find exact matches by searching the normalized page text, mapping matches back to original
 * page indices using normalizeWithIndexMap, and selecting TextItems by their charStart/charEnd.
 */
export function findExactMatches(
  query: string,
  textItems: TextItem[],
  page: number,
  pageText: string
): SourceCitation[] {
  const matches: SourceCitation[] = [];
  if (!pageText || pageText.length === 0) return matches;

  const queryNormalized = normalizeText(query);
  // Build normalized map for the full pageText
  const { normalized: fullTextNormalized, normToOriginal } = normalizeWithIndexMap(pageText);

  let startIdxNorm = fullTextNormalized.indexOf(queryNormalized);
  while (startIdxNorm !== -1) {
    const endIdxNorm = startIdxNorm + queryNormalized.length;
    // Translate normalized indices to original char indices (approx)
    const origStart = normToOriginal[startIdxNorm] ?? 0;
    const origEnd = normToOriginal[endIdxNorm - 1] ?? (pageText.length - 1);

    // Find which text items span this original range using item's charStart/charEnd
    const spanningItems = textItems.filter(item => {
      const itemStart = item.charStart ?? 0;
      const itemEnd = item.charEnd ?? (itemStart + (item.text?.length || 0));
      return itemEnd >= origStart && itemStart <= origEnd;
    });

    if (spanningItems.length > 0) {
      const bounds = calculateBoundingBox(spanningItems);
      const contextText = extractContext(pageText, origStart, origEnd);

      matches.push({
        id: `citation-${Date.now()}-${Math.random()}`,
        page,
        coordinates: bounds,
        sourceText: query,
        context: contextText,
        confidence: 1.0
      });
    }

    startIdxNorm = fullTextNormalized.indexOf(queryNormalized, endIdxNorm);
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

  return results.slice(0, 5).map(result => {
    const item = result.item;
    return {
      id: `citation-${Date.now()}-${Math.random()}`,
      page,
      coordinates: {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height
      },
      sourceText: item.text,
      context: extractContextFromItems(textItems, result.refIndex || 0),
      confidence: 1 - (result.score || 0.5)
    };
  });
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
