import * as pdfjsLib from 'pdfjs-dist';

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
}

export interface TextExtractionResult {
  items: TextItem[];
  pageWidth: number;
  pageHeight: number;
}

/**
 * Extract text with precise coordinates from a PDF page using pdfjs-dist
 * Coordinates are in PDF space (bottom-up)
 */
export async function extractTextWithCoordinates(
  file: File,
  pageNumber: number,
  scale: number = 1.0
): Promise<TextExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const textContent = await page.getTextContent();

  const items: TextItem[] = [];

  for (const item of textContent.items) {
    if ('str' in item && item.str.trim().length > 0) {
      // Extract position from transform matrix
      // transform = [a, b, c, d, e, f] where e=x, f=y
      const [, , , , x, y] = item.transform;
      
      // Get dimensions
      const width = item.width;
      const height = item.height;

      items.push({
        text: item.str,
        x: x,
        y: y,
        width: width,
        height: height,
        fontName: item.fontName || '',
        fontSize: item.height || 12,
      });
    }
  }

  return {
    items,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
  };
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
