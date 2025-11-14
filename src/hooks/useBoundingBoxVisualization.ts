import { useEffect, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { BoundingBoxVisibility } from "@/components/BoundingBoxControls";

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

interface BoundingBoxVisualizationProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  visibility: BoundingBoxVisibility;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  extractedFigures?: any[];
  extractedTables?: any[];
}

export const useBoundingBoxVisualization = ({
  pdfDoc,
  currentPage,
  scale,
  visibility,
  canvasRef,
  extractedFigures = [],
  extractedTables = [],
}: BoundingBoxVisualizationProps) => {
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Extract text items with coordinates from PDF page
   */
  const extractTextItems = useCallback(
    async (page: any): Promise<TextItem[]> => {
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      return textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: viewport.height - item.transform[5],
        width: item.width,
        height: item.height,
        fontName: item.fontName,
      }));
    },
    []
  );

  /**
   * Group text items into semantic chunks (sentences)
   */
  const createSemanticChunks = useCallback(
    (textItems: TextItem[]): Array<{ text: string; bbox: any; isHeading: boolean }> => {
      const chunks: Array<{ text: string; bbox: any; isHeading: boolean }> = [];
      let currentSentence = "";
      let sentenceItems: TextItem[] = [];

      textItems.forEach((item, idx) => {
        currentSentence += item.text;
        sentenceItems.push(item);

        // Detect sentence boundary
        const isSentenceEnd =
          item.text.match(/[.!?]\s*$/) || idx === textItems.length - 1;

        if (isSentenceEnd && currentSentence.trim()) {
          // Calculate bounding box for entire sentence
          const xs = sentenceItems.map((i) => i.x);
          const ys = sentenceItems.map((i) => i.y);
          const rights = sentenceItems.map((i) => i.x + i.width);
          const bottoms = sentenceItems.map((i) => i.y + i.height);

          const firstItem = sentenceItems[0];
          const fontSize = Math.sqrt(
            firstItem.fontName?.toLowerCase().includes("bold") ? 16 : 12
          );

          chunks.push({
            text: currentSentence.trim(),
            bbox: {
              x: Math.min(...xs),
              y: Math.min(...ys),
              width: Math.max(...rights) - Math.min(...xs),
              height: Math.max(...bottoms) - Math.min(...ys),
            },
            isHeading:
              fontSize > 14 ||
              firstItem.fontName?.toLowerCase().includes("heading"),
          });

          currentSentence = "";
          sentenceItems = [];
        }
      });

      return chunks;
    },
    []
  );

  /**
   * Render text item bounding boxes (red)
   */
  const renderTextItemBoxes = useCallback(
    (ctx: CanvasRenderingContext2D, textItems: TextItem[], scale: number) => {
      textItems.forEach((item, idx) => {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          item.x * scale,
          item.y * scale - item.height * scale,
          item.width * scale,
          item.height * scale
        );

        // Add index label
        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        ctx.font = "10px monospace";
        ctx.fillText(
          `[${idx}]`,
          item.x * scale,
          item.y * scale - item.height * scale - 2
        );
      });
    },
    []
  );

  /**
   * Render semantic chunk bounding boxes (green/orange)
   */
  const renderSemanticChunkBoxes = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      chunks: Array<{ text: string; bbox: any; isHeading: boolean }>,
      scale: number
    ) => {
      chunks.forEach((chunk, idx) => {
        if (chunk.isHeading) {
          ctx.strokeStyle = "rgba(255, 165, 0, 0.8)"; // Orange for headings
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = "rgba(0, 255, 0, 0.4)"; // Green for normal
          ctx.lineWidth = 1;
        }

        ctx.strokeRect(
          chunk.bbox.x * scale,
          chunk.bbox.y * scale,
          chunk.bbox.width * scale,
          chunk.bbox.height * scale
        );

        // Add chunk index
        ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
        ctx.font = "bold 12px monospace";
        ctx.fillText(
          `[${idx}]`,
          chunk.bbox.x * scale,
          chunk.bbox.y * scale - 5
        );
      });
    },
    []
  );

  /**
   * Render table region bounding boxes (blue)
   */
  const renderTableBoxes = useCallback(
    (ctx: CanvasRenderingContext2D, tables: any[], pageNum: number, scale: number) => {
      const pageTables = tables.filter((t) => t.pageNum === pageNum);

      pageTables.forEach((table, idx) => {
        if (!table.boundingBox) return;

        const bbox = table.boundingBox;

        // Draw table outline
        ctx.strokeStyle = "rgba(0, 100, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          bbox.x * scale,
          bbox.y * scale,
          bbox.width * scale,
          bbox.height * scale
        );

        // Draw column dividers
        ctx.strokeStyle = "rgba(0, 100, 255, 0.4)";
        ctx.lineWidth = 1;
        if (table.columnPositions) {
          table.columnPositions.forEach((colX: number) => {
            ctx.beginPath();
            ctx.moveTo(colX * scale, bbox.y * scale);
            ctx.lineTo(colX * scale, (bbox.y + bbox.height) * scale);
            ctx.stroke();
          });
        }

        // Add table label
        ctx.fillStyle = "rgba(0, 100, 255, 0.9)";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(
          `Table ${idx + 1}`,
          bbox.x * scale + 5,
          bbox.y * scale + 20
        );
      });
    },
    []
  );

  /**
   * Render figure bounding boxes (purple)
   */
  const renderFigureBoxes = useCallback(
    (ctx: CanvasRenderingContext2D, figures: any[], pageNum: number, scale: number) => {
      const pageFigures = figures.filter((f) => f.page_number === pageNum);

      pageFigures.forEach((figure, idx) => {
        if (!figure.width || !figure.height) return;

        // For now, we don't have exact coordinates, so we'll render a placeholder
        // In a real implementation, you'd need to store figure coordinates during extraction
        ctx.strokeStyle = "rgba(147, 51, 234, 0.8)"; // Purple
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Dashed line

        // Estimate position (this is a placeholder - you'd need actual coordinates)
        const estimatedX = 50;
        const estimatedY = 50 + idx * 200;

        ctx.strokeRect(
          estimatedX * scale,
          estimatedY * scale,
          figure.width * (scale / 2),
          figure.height * (scale / 2)
        );

        ctx.setLineDash([]); // Reset dash

        // Add figure label
        ctx.fillStyle = "rgba(147, 51, 234, 0.9)";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(
          figure.figure_id || `Figure ${idx + 1}`,
          estimatedX * scale + 5,
          estimatedY * scale + 20
        );
      });
    },
    []
  );

  /**
   * Main rendering function
   */
  const renderBoundingBoxes = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous overlays
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If nothing is visible, return early
    if (!Object.values(visibility).some(Boolean)) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      // Ensure canvas matches PDF dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Extract text items if needed
      let textItems: TextItem[] = [];
      if (visibility.textItems || visibility.semanticChunks) {
        textItems = await extractTextItems(page);
      }

      // Render text item boxes
      if (visibility.textItems && textItems.length > 0) {
        renderTextItemBoxes(ctx, textItems, scale);
      }

      // Render semantic chunk boxes
      if (visibility.semanticChunks && textItems.length > 0) {
        const chunks = createSemanticChunks(textItems);
        renderSemanticChunkBoxes(ctx, chunks, scale);
      }

      // Render table boxes
      if (visibility.tables && extractedTables.length > 0) {
        renderTableBoxes(ctx, extractedTables, currentPage, scale);
      }

      // Render figure boxes
      if (visibility.figures && extractedFigures.length > 0) {
        renderFigureBoxes(ctx, extractedFigures, currentPage, scale);
      }
    } catch (error) {
      console.error("Error rendering bounding boxes:", error);
    }
  }, [
    pdfDoc,
    currentPage,
    scale,
    visibility,
    canvasRef,
    extractedFigures,
    extractedTables,
    extractTextItems,
    createSemanticChunks,
    renderTextItemBoxes,
    renderSemanticChunkBoxes,
    renderTableBoxes,
    renderFigureBoxes,
  ]);

  // Trigger re-render when dependencies change
  useEffect(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      renderBoundingBoxes();
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderBoundingBoxes]);

  return {
    renderBoundingBoxes,
  };
};
