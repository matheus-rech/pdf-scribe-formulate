import { useEffect, useCallback, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { BoundingBoxVisibility } from "@/components/BoundingBoxControls";
import { supabase } from "@/integrations/supabase/client";

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
  studyId?: string;
}

export const useBoundingBoxVisualization = ({
  pdfDoc,
  currentPage,
  scale,
  visibility,
  canvasRef,
  extractedFigures = [],
  studyId,
}: BoundingBoxVisualizationProps) => {
  const animationFrameRef = useRef<number | null>(null);
  const [hoveredFigure, setHoveredFigure] = useState<{
    figure: any;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredTable, setHoveredTable] = useState<{
    table: any;
    x: number;
    y: number;
  } | null>(null);
  const [extractedTables, setExtractedTables] = useState<any[]>([]);

  // Fetch tables from database when studyId changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!studyId) {
        setExtractedTables([]);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('pdf_tables')
          .select('*')
          .eq('study_id', studyId);

        if (error) {
          console.error('Error fetching tables:', error);
          setExtractedTables([]);
        } else {
          setExtractedTables(data || []);
        }
      } catch (err) {
        console.error('Error fetching tables:', err);
        setExtractedTables([]);
      }
    };

    fetchTables();
  }, [studyId]);

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
        // Use actual coordinates if available, otherwise skip
        if (!figure.x && figure.x !== 0) return;
        if (!figure.bbox_width || !figure.bbox_height) return;

        ctx.strokeStyle = "rgba(147, 51, 234, 0.8)"; // Purple
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Dashed line

        // Use actual stored coordinates from PDF extraction
        ctx.strokeRect(
          figure.x * scale,
          figure.y * scale,
          figure.bbox_width * scale,
          figure.bbox_height * scale
        );

        ctx.setLineDash([]); // Reset dash

        // Add figure label with background for better visibility
        const label = figure.figure_id || `Figure ${idx + 1}`;
        ctx.font = "bold 14px sans-serif";
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        
        // Draw background rectangle
        ctx.fillStyle = "rgba(147, 51, 234, 0.9)";
        ctx.fillRect(
          figure.x * scale,
          figure.y * scale - 22,
          textWidth + 10,
          20
        );
        
        // Draw text
        ctx.fillStyle = "white";
        ctx.fillText(
          label,
          figure.x * scale + 5,
          figure.y * scale - 6
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

  /**
   * Handle mouse move to detect hover over figures
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!canvasRef.current || !visibility.figures || extractedFigures.length === 0) {
        if (hoveredFigure) setHoveredFigure(null);
        return;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Check if mouse is over any figure bounding box
      const pageFigures = extractedFigures.filter((f) => f.page_number === currentPage);
      
      for (const figure of pageFigures) {
        if (!figure.x && figure.x !== 0) continue;
        if (!figure.bbox_width || !figure.bbox_height) continue;

        const figX = figure.x * scale;
        const figY = figure.y * scale;
        const figW = figure.bbox_width * scale;
        const figH = figure.bbox_height * scale;

        // Check if mouse is within figure bounds
        if (
          mouseX >= figX &&
          mouseX <= figX + figW &&
          mouseY >= figY &&
          mouseY <= figY + figH
        ) {
          setHoveredFigure({
            figure,
            x: event.clientX,
            y: event.clientY,
          });
          return;
        }
      }

      // No figure under mouse
      if (hoveredFigure) setHoveredFigure(null);
    },
    [canvasRef, visibility.figures, extractedFigures, currentPage, scale, hoveredFigure]
  );

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

  // Add mouse move listener to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => {
      setHoveredFigure(null);
      setHoveredTable(null);
    });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', () => {
        setHoveredFigure(null);
        setHoveredTable(null);
      });
    };
  }, [canvasRef, handleMouseMove]);

  return {
    renderBoundingBoxes,
    hoveredFigure,
    hoveredTable,
  };
};
