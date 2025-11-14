import * as pdfjsLib from 'pdfjs-dist';

export interface SearchResult {
  page: number;
  matchedText: string;
  context: string;
  position: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

interface TextItemWithCoords {
  text: string;
  startPos: number;
  endPos: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Normalize text for case-insensitive searching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Search across all pages of a PDF document for a query string
 * Returns array of matches with context and bounding box coordinates
 */
export async function searchAcrossAllPages(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  query: string,
  scale: number = 1
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const searchResults: SearchResult[] = [];
  const normalizedQuery = normalizeText(query);
  const totalPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale });

    let fullText = '';
    const itemsWithCoords: TextItemWithCoords[] = [];

    // Extract text with coordinate information
    textContent.items.forEach((item: any) => {
      if (item.str) {
        const startPos = fullText.length;
        fullText += item.str + ' ';

        // Calculate item coordinates in viewport space
        const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
        
        itemsWithCoords.push({
          text: item.str,
          startPos: startPos,
          endPos: startPos + item.str.length,
          x: transform[4],
          y: transform[5],
          width: item.width * transform[0],
          height: Math.sqrt((transform[0] * transform[0]) + (transform[1] * transform[1]))
        });
      }
    });

    const normalizedText = normalizeText(fullText);

    // Find all occurrences in this page
    let startIndex = 0;
    while ((startIndex = normalizedText.indexOf(normalizedQuery, startIndex)) !== -1) {
      const endIndex = startIndex + normalizedQuery.length;

      // Get context (50 chars before and after)
      const contextStart = Math.max(0, startIndex - 50);
      const contextEnd = Math.min(normalizedText.length, endIndex + 50);
      const context = fullText.substring(contextStart, contextEnd);

      // Find text items that overlap with this match
      const matchingItems = itemsWithCoords.filter(item => {
        return item.startPos < endIndex && item.endPos > startIndex;
      });

      // Calculate bounding box for the match
      let boundingBox = null;
      if (matchingItems.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        matchingItems.forEach(item => {
          minX = Math.min(minX, item.x);
          minY = Math.min(minY, item.y);
          maxX = Math.max(maxX, item.x + item.width);
          maxY = Math.max(maxY, item.y + item.height);
        });

        boundingBox = {
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.round(maxX - minX),
          height: Math.round(maxY - minY)
        };
      }

      searchResults.push({
        page: pageNum,
        context: context,
        position: startIndex,
        boundingBox: boundingBox,
        matchedText: fullText.substring(startIndex, endIndex)
      });

      startIndex += normalizedQuery.length;
    }
  }

  return searchResults;
}
