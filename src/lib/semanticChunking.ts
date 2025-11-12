import type { PageChunk } from './pdfChunking';

export interface SemanticChunk {
  id: string;
  text: string;
  pageStart: number;
  pageEnd: number;
  charStart: number;
  charEnd: number;
  overlap: { prev: number; next: number };
  containsSections: string[];
  sentenceCount: number;
}

/**
 * Create semantic chunks from page chunks
 * - Respects sentence boundaries
 * - Adds overlap for context continuity
 * - Optimal for AI processing
 */
export function createSemanticChunks(
  pageChunks: PageChunk[],
  options: {
    maxChunkSize?: number;
    overlapSize?: number;
    minSentenceLength?: number;
  } = {}
): SemanticChunk[] {
  const maxSize = options.maxChunkSize || 3000;
  const overlapSize = options.overlapSize || 200;
  const minSentenceLength = options.minSentenceLength || 10;
  
  // Combine all page text
  const fullText = pageChunks.map(c => c.text).join('\n\n');
  
  // Split into sentences
  const sentences = splitIntoSentences(fullText, minSentenceLength);
  
  const chunks: SemanticChunk[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;
  let chunkStartChar = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceSize = sentence.length;
    
    // Check if adding this sentence exceeds max size
    if (currentSize + sentenceSize > maxSize && currentChunk.length > 0) {
      // Create chunk
      const chunkText = currentChunk.join(' ');
      const chunkEndChar = chunkStartChar + chunkText.length;
      
      chunks.push({
        id: `semantic-chunk-${chunks.length + 1}`,
        text: chunkText,
        pageStart: getPageForCharPosition(chunkStartChar, pageChunks),
        pageEnd: getPageForCharPosition(chunkEndChar, pageChunks),
        charStart: chunkStartChar,
        charEnd: chunkEndChar,
        overlap: {
          prev: chunks.length > 0 ? overlapSize : 0,
          next: i < sentences.length - 1 ? overlapSize : 0
        },
        containsSections: [],
        sentenceCount: currentChunk.length
      });
      
      // Start new chunk with overlap
      const overlapSentences = getOverlapSentences(currentChunk, overlapSize);
      currentChunk = [...overlapSentences, sentence];
      currentSize = currentChunk.join(' ').length;
      chunkStartChar = chunkEndChar - overlapSentences.join(' ').length;
    } else {
      currentChunk.push(sentence);
      currentSize += sentenceSize + 1; // +1 for space
    }
  }
  
  // Add final chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ');
    chunks.push({
      id: `semantic-chunk-${chunks.length + 1}`,
      text: chunkText,
      pageStart: getPageForCharPosition(chunkStartChar, pageChunks),
      pageEnd: getPageForCharPosition(chunkStartChar + chunkText.length, pageChunks),
      charStart: chunkStartChar,
      charEnd: chunkStartChar + chunkText.length,
      overlap: {
        prev: chunks.length > 0 ? overlapSize : 0,
        next: 0
      },
      containsSections: [],
      sentenceCount: currentChunk.length
    });
  }
  
  return chunks;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string, minLength: number): string[] {
  const rawSentences = text.split(/(?<=[.!?])\s+/);
  
  return rawSentences
    .map(s => s.trim())
    .filter(s => s.length >= minLength);
}

/**
 * Get sentences that fit within overlap size
 */
function getOverlapSentences(sentences: string[], overlapSize: number): string[] {
  const overlap: string[] = [];
  let size = 0;
  
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i];
    if (size + sentence.length > overlapSize) break;
    overlap.unshift(sentence);
    size += sentence.length + 1;
  }
  
  return overlap;
}

/**
 * Find which page a character position falls on
 */
function getPageForCharPosition(charPos: number, pageChunks: PageChunk[]): number {
  for (const chunk of pageChunks) {
    if (charPos >= chunk.charStart && charPos <= chunk.charEnd) {
      return chunk.page;
    }
  }
  return pageChunks[pageChunks.length - 1]?.page || 1;
}

/**
 * Find semantic chunks that overlap with a specific section
 */
export function getChunksForSection(
  chunks: SemanticChunk[],
  sectionCharStart: number,
  sectionCharEnd: number
): SemanticChunk[] {
  return chunks.filter(chunk =>
    chunk.charEnd >= sectionCharStart && chunk.charStart <= sectionCharEnd
  );
}
