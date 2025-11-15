import * as pdfjsLib from 'pdfjs-dist';

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  // NEW: character offsets relative to the page text (page-local)
  charStart?: number;
  charEnd?: number;
}

export interface TextExtractionResult {
  items: TextItem[];
  pageWidth: number;
  pageHeight: number;
  pageText: string;
}

/**
 * Extract text with coordinates from an already-opened PDF page.
 * This returns normalized pageText (single-spaced), and each TextItem
 * contains charStart/charEnd corresponding to the normalized pageText.
 *
 * This function **does not** re-open the PDF document; it expects
 * a pdf document object (pdfjsLib getDocument() result).
 */
export async function extractTextWithCoordinatesFromPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.0
): Promise<TextExtractionResult> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const textContent = await page.getTextContent();

  // Build normalized item texts and compute pageText
  const normalizedItems: string[] = [];
  const itemsRaw: Array<{
    str: string;
    transform: number[];
    width: number;
    height: number;
    fontName: string;
  }> = [];

  for (const it of textContent.items) {
    if ('str' in it && it.str.trim().length > 0) {
      // Normalize internal whitespace for each item to a single space and trim
      const normText = it.str.replace(/\s+/g, ' ').trim();
      if (normText.length === 0) continue;
      normalizedItems.push(normText);
      itemsRaw.push(it);
    }
  }

  // Build pageText from normalized items joined by single space
  const pageText = normalizedItems.join(' ').trim();

  // Now create TextItem objects, assigning charStart/charEnd based on normalized items
  const items: TextItem[] = [];
  let cursor = 0;
  for (let i = 0; i < normalizedItems.length; i++) {
    const normText = normalizedItems[i];
    const raw = itemsRaw[i];

    const start = cursor;
    const end = start + normText.length - 1;

    const [, , , , x = 0, y = 0] = raw.transform || [];

    items.push({
      text: normText,
      x: x,
      y: y,
      width: raw.width || 0,
      height: raw.height || 0,
      fontName: raw.fontName || '',
      fontSize: raw.height || 12,
      charStart: start,
      charEnd: end
    });

    // Advance cursor by item length + 1 for the joining space (if not last)
    cursor = end + 2; // end + 1 would be last char index; +1 more to become start of next + 1 for space
    // We accept that we leave an extra slot for the joining space; the pageText length is established above
  }

  // Note: ensure final pageText length equals the last item charEnd + 1
  // (trim any off-by-one if necessary)
  return {
    items,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    pageText
  };
}

/**
 * Wrapper for consumers that only have a File object. For backward compatibility
 * we keep this function but it will open the PDF once and call the page-level extractor.
 */
export async function extractTextWithCoordinates(
  file: File,
  pageNumber: number,
  scale: number = 1.0
): Promise<TextExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  return extractTextWithCoordinatesFromPdf(pdf, pageNumber, scale);
}

/**
 * Find text items within a rectangular region (in screen coordinates)
 * and convert to PDF coordinates
 */
export function findTextInRegion(
  textItems: TextItem[],
  region: { x: number; y: number; width: number; height: number },
  pageHeight: number,
  scale: number = 1.0
): { text: string; pdfCoords: { x: number; y: number; width: number; height: number } } {
  // Convert screen coordinates to PDF coordinates
  const pdfRegion = {
    x: region.x / scale,
    y: (pageHeight - region.y - region.height) / scale, // Flip Y axis
    width: region.width / scale,
    height: region.height / scale,
  };

  const matchingItems: TextItem[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of textItems) {
    const itemRight = item.x + item.width;
    const itemTop = item.y + item.height;

    // Check if item intersects with region
    const intersects =
      item.x < pdfRegion.x + pdfRegion.width &&
      itemRight > pdfRegion.x &&
      item.y < pdfRegion.y + pdfRegion.height &&
      itemTop > pdfRegion.y;

    if (intersects) {
      matchingItems.push(item);
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, itemRight);
      maxY = Math.max(maxY, itemTop);
    }
  }

  const text = matchingItems
    .sort((a, b) => {
      // Sort by Y first (top to bottom), then X (left to right)
      const yDiff = b.y - a.y; // Reverse because PDF Y is bottom-up
      if (Math.abs(yDiff) > 2) return yDiff > 0 ? -1 : 1;
      return a.x - b.x;
    })
    .map(item => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Calculate bounding box in PDF coordinates
  const pdfCoords = matchingItems.length > 0
    ? {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    : pdfRegion;

  return { text, pdfCoords };
}

/**
 * Convert PDF coordinates to screen coordinates
 * (kept for consumers)
 */
export function pdfToScreenCoords(
  pdfX: number,
  pdfY: number,
  pdfWidth: number,
  pdfHeight: number,
  pageHeight: number,
  scale: number = 1.0
): { x: number; y: number; width: number; height: number } {
  return {
    x: pdfX * scale,
    y: (pageHeight - pdfY - pdfHeight) * scale, // Flip Y axis
    width: pdfWidth * scale,
    height: pdfHeight * scale,
  };
}

/**
 * Convert screen coordinates to PDF coordinates
 * (kept for consumers)
 */
export function screenToPdfCoords(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number,
  pageHeight: number,
  scale: number = 1.0
): { x: number; y: number; width: number; height: number } {
  return {
    x: screenX / scale,
    y: (pageHeight - screenY - screenHeight) / scale, // Flip Y axis
    width: screenWidth / scale,
    height: screenHeight / scale,
  };
}
