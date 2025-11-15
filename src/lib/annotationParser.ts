import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

export interface PDFAnnotation {
  id: string;
  type: "Highlight" | "Text" | "FreeText" | "Ink" | "Square" | "Circle" | "StrikeOut" | "Underline";
  page: number;
  content: string;
  author?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color?: { r: number; g: number; b: number };
  timestamp?: Date;
  selectedText?: string;
}

export interface AnnotationImportResult {
  annotations: PDFAnnotation[];
  summary: {
    total: number;
    byType: Record<string, number>;
    byPage: Record<number, number>;
  };
}

/**
 * Extract annotations from a PDF file using pdf-lib and pdfjs
 */
export async function extractAnnotationsFromPDF(file: File): Promise<AnnotationImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const annotations: PDFAnnotation[] = [];

  try {
    // Use pdfjs to load the document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    // Also load with pdf-lib for annotation extraction
    const pdfLibDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfLibDoc.getPages();

    // Iterate through all pages
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      
      // Get annotations from the page
      const pageAnnotations = await page.getAnnotations();
      const viewport = page.getViewport({ scale: 1.0 });

      for (const annotation of pageAnnotations) {
        if (!annotation.rect) continue;

        const [x1, y1, x2, y2] = annotation.rect;
        
        // Convert PDF coordinates to canvas coordinates
        const coordinates = {
          x: x1,
          y: viewport.height - y2,
          width: x2 - x1,
          height: y2 - y1,
        };

        let content = "";
        let selectedText = "";

        // Extract content based on annotation type
        if (annotation.subtype === "Highlight") {
          // For highlights, try to extract the highlighted text
          const textContent = await page.getTextContent();
          selectedText = extractTextFromRegion(textContent, annotation.rect, viewport);
          content = annotation.contents || selectedText;
        } else if (annotation.subtype === "Text" || annotation.subtype === "FreeText") {
          // For text annotations (sticky notes and free text)
          content = annotation.contents || "";
        } else if (annotation.subtype === "Ink") {
          content = annotation.contents || "[Hand-drawn annotation]";
        }

        // Parse color if available
        let color;
        if (annotation.color && Array.isArray(annotation.color)) {
          color = {
            r: annotation.color[0] * 255,
            g: annotation.color[1] * 255,
            b: annotation.color[2] * 255,
          };
        }

        annotations.push({
          id: `annotation-${pageNum}-${annotations.length}`,
          type: annotation.subtype as any,
          page: pageNum,
          content,
          author: annotation.title || undefined,
          coordinates,
          color,
          timestamp: annotation.modificationDate ? new Date(annotation.modificationDate) : undefined,
          selectedText,
        });
      }
    }

    // Generate summary
    const summary = {
      total: annotations.length,
      byType: annotations.reduce((acc, ann) => {
        acc[ann.type] = (acc[ann.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPage: annotations.reduce((acc, ann) => {
        acc[ann.page] = (acc[ann.page] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
    };

    return { annotations, summary };
  } catch (error) {
    console.error("Error extracting annotations:", error);
    throw new Error("Failed to extract PDF annotations");
  }
}

/**
 * Extract text from a specific region of the page
 */
function extractTextFromRegion(
  textContent: any,
  rect: number[],
  viewport: any
): string {
  const [x1, y1, x2, y2] = rect;
  const texts: string[] = [];

  textContent.items.forEach((item: any) => {
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const itemX = tx[4];
    const itemY = tx[5];

    // Check if text item intersects with annotation rectangle
    const x1Val = x1 ?? 0;
    const x2Val = x2 ?? 0;
    const y1Val = y1 ?? 0;
    const y2Val = y2 ?? 0;
    
    if (
      itemX >= x1Val &&
      itemX <= x2Val &&
      viewport.height - itemY >= y1Val &&
      viewport.height - itemY <= y2Val
    ) {
      texts.push(item.str);
    }
  });

  return texts.join(" ").trim();
}

/**
 * Attempt to match annotation content to form fields
 */
export function matchAnnotationsToFields(
  annotations: PDFAnnotation[],
  fieldNames: string[]
): Record<string, PDFAnnotation[]> {
  const matches: Record<string, PDFAnnotation[]> = {};

  // Initialize with empty arrays
  fieldNames.forEach(field => {
    matches[field] = [];
  });

  // Simple keyword matching for now
  const fieldKeywords: Record<string, string[]> = {
    citation: ["citation", "reference", "author", "title"],
    doi: ["doi", "10."],
    pmid: ["pmid", "pubmed"],
    population: ["population", "patients", "participants", "subjects"],
    intervention: ["intervention", "treatment", "therapy"],
    outcomes: ["outcome", "result", "endpoint"],
    sampleSize: ["sample size", "n =", "participants"],
    age: ["age", "years old", "mean age"],
    gender: ["gender", "male", "female", "sex"],
  };

  annotations.forEach(annotation => {
    const annotationText = (annotation.content + " " + (annotation.selectedText || "")).toLowerCase();
    
    if (!annotationText) return;
    
    for (const [field, keywords] of Object.entries(fieldKeywords)) {
      if (keywords.some(keyword => annotationText.includes(keyword.toLowerCase()))) {
        matches[field].push(annotation);
      }
    }
  });

  return matches;
}

/**
 * Get annotation type color for UI display
 */
export function getAnnotationColor(type: PDFAnnotation["type"]): string {
  const colors: Record<string, string> = {
    Highlight: "hsl(var(--chart-2))",
    Text: "hsl(var(--chart-3))",
    FreeText: "hsl(var(--chart-4))",
    Ink: "hsl(var(--chart-5))",
    Square: "hsl(var(--info))",
    Circle: "hsl(var(--info))",
    StrikeOut: "hsl(var(--destructive))",
    Underline: "hsl(var(--chart-1))",
  };
  return colors[type] || "hsl(var(--muted))";
}
