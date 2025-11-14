import * as pdfjsLib from 'pdfjs-dist';

export interface TextChunk {
  chunkIndex: number;
  text: string;
  pageNum: number;
  bbox: { x: number; y: number; width: number; height: number };
  fontName: string;
  fontSize: number;
  isHeading: boolean;
  isBold: boolean;
  confidence: number;
  charStart: number;
  charEnd: number;
  sectionName?: string;
}

export interface CitationMap {
  [chunkIndex: number]: {
    text: string;
    pageNum: number;
    bbox: { x: number; y: number; width: number; height: number };
    confidence: number;
  };
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

/**
 * Extract text with sentence-level coordinates from a PDF page
 * Each sentence becomes a chunk with precise bounding box
 */
export async function extractTextWithCoordinates(
  page: pdfjsLib.PDFPageProxy,
  pageNum: number,
  charOffset: number = 0
): Promise<TextChunk[]> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  // Group text items into sentences
  const chunks: TextChunk[] = [];
  let currentSentence: TextItem[] = [];
  let currentText = '';
  let currentCharStart = charOffset;
  
  textContent.items.forEach((item: any) => {
    if (!('str' in item) || !item.str.trim()) return;
    
    currentSentence.push(item as TextItem);
    currentText += item.str;
    
    // Detect sentence boundary
    const isSentenceEnd = /[.!?]\s*$/.test(item.str) || item.str.endsWith('\n');
    
    if (isSentenceEnd && currentText.trim()) {
      const chunk = createChunkFromItems(
        currentSentence,
        currentText.trim(),
        pageNum,
        viewport.height,
        currentCharStart
      );
      
      chunks.push(chunk);
      
      // Reset for next sentence
      currentCharStart += currentText.length;
      currentSentence = [];
      currentText = '';
    }
  });
  
  // Handle remaining text
  if (currentSentence.length > 0 && currentText.trim()) {
    const chunk = createChunkFromItems(
      currentSentence,
      currentText.trim(),
      pageNum,
      viewport.height,
      currentCharStart
    );
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Create a TextChunk from grouped text items
 */
function createChunkFromItems(
  items: TextItem[],
  text: string,
  pageNum: number,
  pageHeight: number,
  charStart: number
): TextChunk {
  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  items.forEach(item => {
    const x = item.transform[4];
    const y = pageHeight - item.transform[5]; // Flip Y axis
    const width = item.width;
    const height = item.height;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y - height);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y);
  });
  
  // Extract font properties from first item
  const firstItem = items[0];
  const fontSize = Math.sqrt(
    firstItem.transform[0] ** 2 + firstItem.transform[1] ** 2
  );
  const fontName = firstItem.fontName || '';
  
  // Determine if heading/bold
  const isHeading = fontSize > 14 || fontName.toLowerCase().includes('heading');
  const isBold = fontName.toLowerCase().includes('bold');
  
  return {
    chunkIndex: 0, // Will be set later
    text,
    pageNum,
    bbox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    fontName,
    fontSize,
    isHeading,
    isBold,
    confidence: 1.0,
    charStart,
    charEnd: charStart + text.length,
  };
}

/**
 * Build a citation map for quick lookup by chunk index
 */
export function buildCitationMap(chunks: TextChunk[]): CitationMap {
  const map: CitationMap = {};
  
  chunks.forEach(chunk => {
    map[chunk.chunkIndex] = {
      text: chunk.text,
      pageNum: chunk.pageNum,
      bbox: chunk.bbox,
      confidence: chunk.confidence,
    };
  });
  
  return map;
}

/**
 * Create a citable document format for AI consumption
 * Format: "[0] First sentence. [1] Second sentence."
 */
export function createCitableDocument(chunks: TextChunk[]): string {
  return chunks
    .map(chunk => `[${chunk.chunkIndex}] ${chunk.text}`)
    .join('\n');
}

/**
 * Highlight specific chunks by index on canvas
 */
export function highlightChunksByIndex(
  canvas: HTMLCanvasElement,
  chunkIndices: number[],
  citationMap: CitationMap,
  currentPage: number,
  scale: number = 2.0
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  chunkIndices.forEach(idx => {
    const citation = citationMap[idx];
    if (!citation || citation.pageNum !== currentPage) return;
    
    const { bbox } = citation;
    
    // Draw citation highlight (yellow with transparency)
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.fillRect(
      bbox.x * scale,
      bbox.y * scale,
      bbox.width * scale,
      bbox.height * scale
    );
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      bbox.x * scale,
      bbox.y * scale,
      bbox.width * scale,
      bbox.height * scale
    );
    
    // Add index label
    ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `[${idx}]`,
      bbox.x * scale + 2,
      bbox.y * scale - 3
    );
  });
}

/**
 * Filter chunks by section name
 */
export function getChunksForSection(
  chunks: TextChunk[],
  sectionName: string
): TextChunk[] {
  return chunks.filter(chunk => chunk.sectionName === sectionName);
}

/**
 * Get chunks within a character range
 */
export function getChunksInRange(
  chunks: TextChunk[],
  charStart: number,
  charEnd: number
): TextChunk[] {
  return chunks.filter(
    chunk =>
      (chunk.charStart >= charStart && chunk.charStart < charEnd) ||
      (chunk.charEnd > charStart && chunk.charEnd <= charEnd) ||
      (chunk.charStart <= charStart && chunk.charEnd >= charEnd)
  );
}
