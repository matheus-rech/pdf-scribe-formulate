import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, ChevronLeft, ChevronRight, Box, Camera, FileText, Search as SearchIcon, FileDown, Paintbrush, Eye } from "lucide-react";
import { toast } from "sonner";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { RenderHighlightContentProps, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import type { ExtractionEntry } from "@/pages/Index";
import { extractAnnotationsFromPDF, type PDFAnnotation } from "@/lib/annotationParser";
import { AnnotationImportDialog } from "./AnnotationImportDialog";
import { AnnotationExportDialog } from "./AnnotationExportDialog";
import { DrawingToolbar, type DrawingTool } from "./DrawingToolbar";
import { HighlightToolbar } from "./HighlightToolbar";
import { SearchPanel } from "./SearchPanel";
import { CitationLinkPanel } from "./CitationLinkPanel";
import { SectionNavigator } from "./SectionNavigator";
import { BoundingBoxControls, type BoundingBoxVisibility } from "./BoundingBoxControls";
import { FigureCaptionTooltip } from "./FigureCaptionTooltip";
import { TableDetailTooltip } from "./TableDetailTooltip";
import { useAnnotationCanvas } from "@/hooks/useAnnotationCanvas";
import { usePageAnnotations } from "@/hooks/usePageAnnotations";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTextHighlights } from "@/hooks/useTextHighlights";
import { useBoundingBoxVisualization } from "@/hooks/useBoundingBoxVisualization";
import { navigateToPosition } from "@/lib/pdfNavigation";
import type { SourceCitation } from "@/lib/citationDetector";
import type { SearchResult } from "@/lib/pdfSearch";
import * as pdfjsLib from "pdfjs-dist";
import { extractTextWithCoordinates, findTextInRegion, pdfToScreenCoords } from "@/lib/textExtraction";

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

interface PDFViewerProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  onTotalPagesChange: (total: number) => void;
  activeField: string | null;
  onExtraction: (entry: ExtractionEntry) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  extractions: ExtractionEntry[];
  onAnnotationsImport?: (annotations: PDFAnnotation[]) => void;
  onPdfTextExtracted?: (text: string) => void;
  highlightedSources?: SourceCitation[];
  onJumpToExtraction?: (extraction: ExtractionEntry) => void;
  studySections?: any[];
  onBatchExtract?: (section: any) => void;
  isBatchExtracting?: boolean;
  onAnnotationsChange?: (annotations: any[]) => void;
  initialAnnotations?: any[];
  searchResults?: SearchResult[];
  activeSearchIndex?: number;
  pdfDocRef?: React.MutableRefObject<pdfjsLib.PDFDocumentProxy | null>;
  extractedFigures?: any[];
  studyId?: string;
  onNavigateToChunk?: (pageNum: number, chunkIndex: number) => void;
  activeCitationIndices?: number[];
}

export const PDFViewer = ({
  file,
  onFileChange,
  currentPage,
  onPageChange,
  totalPages,
  onTotalPagesChange,
  activeField,
  onExtraction,
  scale,
  onScaleChange,
  extractions,
  onAnnotationsImport,
  onPdfTextExtracted,
  highlightedSources = [],
  onJumpToExtraction,
  studySections,
  onBatchExtract,
  isBatchExtracting = false,
  onAnnotationsChange,
  initialAnnotations = [],
  searchResults = [],
  pdfDocRef,
  extractedFigures = [],
  studyId,
}: PDFViewerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [regionMode, setRegionMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [textSelectionMode, setTextSelectionMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [pageTextCache, setPageTextCache] = useState<Map<number, any>>(new Map());
  const [searchOpen, setSearchOpen] = useState(false);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  const [pdfFullText, setPdfFullText] = useState("");
  const [flashCoords, setFlashCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Drawing mode states
  const [drawingMode, setDrawingMode] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 800, height: 1000 });
  
  // Bounding box visualization states
  const boundingBoxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showBoundingBoxControls, setShowBoundingBoxControls] = useState(false);
  const [boundingBoxVisibility, setBoundingBoxVisibility] = useState<BoundingBoxVisibility>({
    textItems: false,
    semanticChunks: false,
    tables: false,
    figures: false,
  });

  // Use custom hooks
  const { 
    savePageAnnotation, 
    getPageAnnotation, 
    clearPageAnnotation, 
    hasAnnotation,
    getAllAnnotations,
    pageAnnotations,
    restoreAnnotations,
    clearAllAnnotations
  } = usePageAnnotations();

  const {
    highlights,
    activeHighlightColor,
    setActiveHighlightColor,
    addHighlight,
    removeHighlight,
    getHighlightsForPage,
    clearHighlightsOfType,
    clearAllHighlights,
  } = useTextHighlights();

  const {
    fabricCanvas,
    activeTool,
    setActiveTool,
    drawingColor,
    setDrawingColor,
    strokeWidth,
    setStrokeWidth,
    selectedObject,
    addShape,
    deleteSelected,
    bringToFront,
    sendToBack,
    clearCanvas,
    finishPolygon,
    polygonPointCount,
  } = useAnnotationCanvas(drawingCanvasRef, pageDimensions.width, pageDimensions.height, drawingMode);

  // Bounding box visualization
  const { hoveredFigure, hoveredTable } = useBoundingBoxVisualization({
    pdfDoc: pdfDocRef?.current || null,
    currentPage,
    scale,
    visibility: boundingBoxVisibility,
    canvasRef: boundingBoxCanvasRef,
    extractedFigures,
    studyId,
  });

  const {
    saveState,
    undo,
    redo,
    clearHistory,
    initializeHistory,
    canUndo,
    canRedo
  } = useCanvasHistory(fabricCanvas);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: deleteSelected,
    onUndo: undo,
    onRedo: redo,
    onEscape: () => {
      if (activeTool === 'polygon' && polygonPointCount > 0) {
        finishPolygon();
      } else {
        setDrawingMode(false);
        setRegionMode(false);
        setImageMode(false);
        setTextSelectionMode(false);
      }
    },
  }, drawingMode);

  // Highlight keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+H for highlighting
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        handleHighlightSelection();
      }
      // F3 for next search result
      if (e.key === 'F3' && !e.shiftKey && searchResults.length > 0) {
        e.preventDefault();
        // This will be handled by SearchPanel
      }
      // Shift+F3 for previous search result
      if (e.key === 'F3' && e.shiftKey && searchResults.length > 0) {
        e.preventDefault();
        // This will be handled by SearchPanel
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults]);

  // Handle highlight flash animation
  useEffect(() => {
    if (flashCoords) {
      const timer = setTimeout(() => setFlashCoords(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [flashCoords]);

  // Handle Enter key for polygon completion
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeTool === 'polygon' && polygonPointCount >= 3) {
        finishPolygon();
      }
    };

    if (drawingMode) {
      window.addEventListener('keypress', handleKeyPress);
      return () => window.removeEventListener('keypress', handleKeyPress);
    }
  }, [drawingMode, activeTool, polygonPointCount, finishPolygon]);

  // Save annotations when switching pages
  const saveCurrentPageAnnotations = useCallback(() => {
    if (!fabricCanvas || !drawingMode) return;
    
    const json = fabricCanvas.toJSON();
    const thumbnail = fabricCanvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 1 });
    savePageAnnotation(currentPage, json, thumbnail);
  }, [fabricCanvas, drawingMode, currentPage, savePageAnnotation]);

  // Notify parent component when annotations change
  useEffect(() => {
    if (onAnnotationsChange) {
      onAnnotationsChange(getAllAnnotations());
    }
  }, [pageAnnotations, onAnnotationsChange, getAllAnnotations]);

  // Restore initial annotations when study changes
  useEffect(() => {
    if (initialAnnotations && initialAnnotations.length > 0) {
      console.log(`Restoring ${initialAnnotations.length} annotations`);
      restoreAnnotations(initialAnnotations);
      toast.success(`Loaded ${initialAnnotations.length} annotated pages`);
    } else {
      // Clear annotations when switching to a study with no annotations
      if (pageAnnotations.size > 0) {
        clearAllAnnotations();
      }
    }
  }, [initialAnnotations]);

  // Load annotations for current page
  useEffect(() => {
    if (!fabricCanvas || !drawingMode) return;

    const annotation = getPageAnnotation(currentPage);
    if (annotation && annotation.canvasJSON) {
      fabricCanvas.loadFromJSON(annotation.canvasJSON, () => {
        fabricCanvas.renderAll();
        initializeHistory();
      });
    } else {
      clearCanvas();
      initializeHistory();
    }
  }, [currentPage, fabricCanvas, drawingMode, getPageAnnotation, initializeHistory, clearCanvas]);

  // Auto-save on canvas changes (debounced through history)
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleObjectEvent = () => {
      saveState();
      // Auto-save to page annotations
      if (drawingMode) {
        const json = fabricCanvas.toJSON();
        const thumbnail = fabricCanvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 1 });
        savePageAnnotation(currentPage, json, thumbnail);
      }
    };

    fabricCanvas.on('object:added', handleObjectEvent);
    fabricCanvas.on('object:modified', handleObjectEvent);
    fabricCanvas.on('object:removed', handleObjectEvent);

    return () => {
      fabricCanvas.off('object:added', handleObjectEvent);
      fabricCanvas.off('object:modified', handleObjectEvent);
      fabricCanvas.off('object:removed', handleObjectEvent);
    };
  }, [fabricCanvas, saveState, drawingMode, currentPage, savePageAnnotation]);

  // Get PDF page dimensions and extract text with coordinates
  useEffect(() => {
    if (!file) return;

    const getPDFData = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        setPageDimensions({
          width: viewport.width,
          height: viewport.height,
        });

        // Extract text with precise coordinates
        if (!pageTextCache.has(currentPage)) {
          const textData = await extractTextWithCoordinates(file, currentPage, scale);
          setPageTextCache(prev => new Map(prev).set(currentPage, textData));
        }
      } catch (error) {
        console.error("Error getting PDF data:", error);
      }
    };

    getPDFData();
  }, [file, currentPage, scale]);

  // Extract text from PDF when file loads
  useEffect(() => {
    if (!file) return;

    const extractText = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += `\n\n[Page ${i}]\n${pageText}`;
        }
        
        setPdfFullText(fullText);
        if (onPdfTextExtracted) {
          onPdfTextExtracted(fullText);
        }
      } catch (error) {
        console.error("Error extracting text:", error);
      }
    };

    extractText();
  }, [file, onPdfTextExtracted]);

  // Create object URL for the PDF file
  useEffect(() => {
    if (!file) {
      setFileUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Highlight plugin configuration
  const renderHighlightContent = (props: RenderHighlightContentProps) => {
    return <></>;
  };

  const renderHighlights = (props: RenderHighlightsProps) => {
    const pageExtractions = extractions.filter(
      ext => ext.page === props.pageIndex + 1 && ext.coordinates
    );

    const pageHighlights = getHighlightsForPage(props.pageIndex + 1);
    const pageSearchResults = searchResults.filter(r => r.page === props.pageIndex + 1 && r.boundingBox);
    const pageSourceHighlights = highlightedSources.filter(s => s.page === props.pageIndex + 1);

    return (
      <div>
        {/* Source Citation Highlights (highest priority) */}
        {pageSourceHighlights.map((source) => {
          const coords = source.coordinates;
          
          return (
            <div
              key={source.id}
              className="animate-pulse"
              style={{
                position: 'absolute',
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                width: `${coords.width}px`,
                height: `${coords.height}px`,
                border: '3px solid hsl(var(--chart-3))',
                backgroundColor: 'hsl(var(--chart-3) / 0.2)',
                pointerEvents: 'auto',
                zIndex: 100,
              }}
              onMouseEnter={() => setHoveredRegion(coords)}
              onMouseLeave={() => setHoveredRegion(null)}
              title={`Source: ${source.context}`}
            />
          );
        })}

        {/* Text Highlights */}
        {pageHighlights.map((highlight) => {
          const coords = highlight.coordinates;
          
          return (
            <div
              key={highlight.id}
              className={`text-highlight ${flashCoords && 
                flashCoords.x === coords.x && 
                flashCoords.y === coords.y ? 'flash-highlight' : ''
              }`}
              style={{
                position: 'absolute',
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                width: `${coords.width}px`,
                height: `${coords.height}px`,
                backgroundColor: highlight.color,
                opacity: 0.4,
                pointerEvents: 'auto',
              }}
              onClick={() => {
                toast.info(`Highlight (${highlight.type})`, {
                  description: highlight.text.substring(0, 100),
                });
              }}
              title={`${highlight.text}${highlight.note ? `\n\nNote: ${highlight.note}` : ''}`}
            />
          );
        })}

        {/* Search Result Highlights */}
        {pageSearchResults.map((result, idx) => {
          const coords = result.boundingBox;
          
          return (
            <div
              key={`search-${idx}`}
              className="text-highlight"
              style={{
                position: 'absolute',
                left: `${coords?.x || 0}px`,
                top: `${coords?.y || 0}px`,
                width: `${coords?.width || 0}px`,
                height: `${coords?.height || 0}px`,
                backgroundColor: 'hsl(var(--extraction-search))',
                opacity: 0.5,
                border: '2px solid hsl(var(--extraction-search))',
                pointerEvents: 'auto',
              }}
              title={`Search result: ${result.matchedText}`}
            />
          );
        })}

        {/* Extraction Highlights */}
        {pageExtractions.map((extraction) => {
          const coords = extraction.coordinates;
          if (!coords) return null;

          const left = coords.x;
          const top = coords.y;
          const width = coords.width;
          const height = coords.height;

          let borderColor = "hsl(var(--extraction-manual))";
          let bgColor = "hsl(var(--extraction-manual) / 0.1)";

          if (extraction.method === "ai") {
            borderColor = "hsl(var(--extraction-ai))";
            bgColor = "hsl(var(--extraction-ai) / 0.1)";
          } else if (extraction.method === "image") {
            borderColor = "hsl(var(--extraction-image))";
            bgColor = "hsl(var(--extraction-image) / 0.1)";
          }

          return (
            <div
              key={extraction.id}
              className="extraction-highlight"
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                border: `2px solid ${borderColor}`,
                backgroundColor: bgColor,
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              onClick={() => {
                toast.info(`Extraction: ${extraction.fieldName}`, {
                  description: extraction.text
                });
              }}
              title={`${extraction.fieldName}: ${extraction.text}`}
            />
          );
        })}
      </div>
    );
  };

  // Handle text selection highlighting
  const handleHighlightSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText || selectedText.length === 0) {
      toast.error("Please select text to highlight");
      return;
    }

    const range = selection!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      addHighlight({
        pageNumber: currentPage,
        text: selectedText,
        coordinates: {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        },
        type: 'selection',
      });

      toast.success("Text highlighted");
      selection!.removeAllRanges();
    }
  }, [currentPage, addHighlight]);

  // Handle search result navigation
  const handleSearchResultNavigation = useCallback((result: any) => {
    navigateToPosition(
      {
        page: result.page,
        coordinates: result.coordinates,
        highlight: true,
      },
      containerRef,
      onPageChange,
      setFlashCoords
    );
  }, [onPageChange]);

  // Handle search results with highlight creation
  const handleInternalSearchResults = useCallback((results: any[]) => {
    
    // Clear previous search highlights
    clearHighlightsOfType('search');
    
    // Add new search highlights
    results.forEach(result => {
      if (result.coordinates) {
        addHighlight({
          pageNumber: result.page,
          text: result.text,
          coordinates: result.coordinates,
          type: 'search',
        });
      }
    });
  }, [addHighlight, clearHighlightsOfType]);

  const highlightPluginInstance = highlightPlugin({
    renderHighlightContent,
    renderHighlights,
    trigger: Trigger.None,
  });

  const searchPluginInstance = searchPlugin();
  const { ShowSearchPopover } = searchPluginInstance;

  // Drawing tool handlers
  const handleDrawingToolChange = (tool: DrawingTool) => {
    setActiveTool(tool);
    
    // Add shapes immediately for shape tools
    if (['rectangle', 'circle', 'text', 'highlight', 'polygon'].includes(tool)) {
      addShape(tool);
    }
  };

  const handleSaveAnnotations = async () => {
    if (!fabricCanvas || !activeField) {
      toast.error("Please select a field before saving annotations");
      return;
    }

    try {
      // Convert canvas to image
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      onExtraction({
        id: `extraction-${Date.now()}`,
        fieldName: activeField,
        text: "[Annotated region]",
        page: currentPage,
        coordinates: {
          x: 0,
          y: 0,
          width: fabricCanvas.width || 800,
          height: fabricCanvas.height || 1000,
        },
        method: "manual",
        timestamp: new Date(),
        imageData: dataUrl,
      });

      toast.success(`Annotations saved to ${activeField}`);
      clearCanvas();
      clearHistory();
    } catch (error) {
      console.error("Error saving annotations:", error);
      toast.error("Failed to save annotations");
    }
  };

  // Handle text selection from the PDF (only when not in other modes)
  const handleTextSelection = () => {
    if (!activeField || regionMode || imageMode || drawingMode) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        onExtraction({
          id: `extraction-${Date.now()}`,
          fieldName: activeField,
          text: selectedText,
          page: currentPage,
          coordinates: {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          },
          method: "manual",
          timestamp: new Date(),
        });

        toast.success(`Extracted to ${activeField}`);
        selection!.removeAllRanges();
      }
    }
  };

  // Handle region/image selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!regionMode && !imageMode) return;
    if (!activeField) {
      toast.error("Please select a field first");
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsSelecting(true);
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setSelectionBox(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setSelectionBox({
      x: Math.min(selectionStart.x, currentX),
      y: Math.min(selectionStart.y, currentY),
      width: Math.abs(currentX - selectionStart.x),
      height: Math.abs(currentY - selectionStart.y),
    });
  };

  const handleMouseUp = async () => {
    if (!isSelecting || !selectionBox || !activeField) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionBox(null);
      return;
    }

    let extractedText = `[Region: ${selectionBox.width.toFixed(0)}x${selectionBox.height.toFixed(0)}px]`;
    let imageData: string | undefined = undefined;
    let pdfCoordinates = selectionBox;

    // Extract text with precise coordinates if in text selection mode or region mode
    if ((textSelectionMode || regionMode) && pageTextCache.has(currentPage)) {
      try {
        const textData = pageTextCache.get(currentPage);
        if (textData) {
          const result = findTextInRegion(
            textData.items,
            selectionBox,
            textData.pageHeight,
            scale
          );
          
          if (result.text) {
            extractedText = result.text;
            // Convert PDF coordinates back to screen coordinates for display
            const screenCoords = pdfToScreenCoords(
              result.pdfCoords.x,
              result.pdfCoords.y,
              result.pdfCoords.width,
              result.pdfCoords.height,
              textData.pageHeight,
              scale
            );
            pdfCoordinates = screenCoords;
            toast.success(`Extracted "${extractedText.substring(0, 50)}${extractedText.length > 50 ? '...' : ''}" to ${activeField}`);
          }
        }
      } catch (error) {
        console.error('Error extracting text with coordinates:', error);
        toast.error('Failed to extract text, using region coordinates');
      }
    }

    // Capture image if in image mode
    if (imageMode && pageCanvasRef.current) {
      try {
        const canvas = pageCanvasRef.current;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx && canvas) {
          tempCanvas.width = selectionBox.width;
          tempCanvas.height = selectionBox.height;
          
          tempCtx.drawImage(
            canvas,
            selectionBox.x,
            selectionBox.y,
            selectionBox.width,
            selectionBox.height,
            0,
            0,
            selectionBox.width,
            selectionBox.height
          );
          
          imageData = tempCanvas.toDataURL('image/png');
          extractedText = `[Image: ${selectionBox.width.toFixed(0)}x${selectionBox.height.toFixed(0)}px]`;
          
          toast.success(`Image captured to ${activeField}`);
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        toast.error('Failed to capture image');
      }
    }

    onExtraction({
      id: `extraction-${Date.now()}`,
      fieldName: activeField,
      text: extractedText,
      page: currentPage,
      coordinates: {
        x: pdfCoordinates.x,
        y: pdfCoordinates.y,
        width: pdfCoordinates.width,
        height: pdfCoordinates.height,
      },
      method: imageMode ? "image" : "region",
      timestamp: new Date(),
      imageData,
    });

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionBox(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      onFileChange(selectedFile);
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleImportAnnotations = async () => {
    if (!file) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsLoadingAnnotations(true);
    try {
      const result = await extractAnnotationsFromPDF(file);
      
      if (result.annotations.length === 0) {
        toast.info("No annotations found in this PDF");
        return;
      }

      setImportResult(result);
      setAnnotationDialogOpen(true);
    } catch (error) {
      console.error("Error importing annotations:", error);
      toast.error("Failed to import annotations from PDF");
    } finally {
      setIsLoadingAnnotations(false);
    }
  };

  const handleAnnotationsSelected = (selectedAnnotations: PDFAnnotation[]) => {
    if (onAnnotationsImport) {
      onAnnotationsImport(selectedAnnotations);
    }
  };

  const handleJSONImport = (annotations: any[]) => {
    // Restore annotations to pageAnnotations state
    annotations.forEach((ann) => {
      savePageAnnotation(ann.pageNumber, ann.canvasJSON, ann.thumbnail);
    });
    
    // If we're on one of the imported pages, load it to canvas
    const currentPageAnnotation = annotations.find(a => a.pageNumber === currentPage);
    if (currentPageAnnotation && fabricCanvas) {
      fabricCanvas.loadFromJSON(currentPageAnnotation.canvasJSON, () => {
        fabricCanvas.renderAll();
        initializeHistory();
      });
    }
  };

  const handleDocumentLoad = (e: any) => {
    onTotalPagesChange(e.doc.numPages);
    toast.success(`PDF loaded: ${e.doc.numPages} pages`);
  };

  const handlePageChange = (e: any) => {
    onPageChange(e.currentPage + 1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-card border-b border-border flex-wrap">
        <Button
          variant="default"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Load PDF
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex items-center gap-1 border-l border-border pl-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || !file}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <Input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page);
                }
              }}
              className="w-16 h-8 text-center"
              disabled={!file}
            />
            <span className="text-muted-foreground">/ {totalPages}</span>
            {hasAnnotation(currentPage) && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded" title="This page has annotations">
                ✓
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || !file}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={scale.toString()} onValueChange={(v) => onScaleChange(parseFloat(v))}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.75">75%</SelectItem>
            <SelectItem value="1">100%</SelectItem>
            <SelectItem value="1.25">125%</SelectItem>
            <SelectItem value="1.5">150%</SelectItem>
            <SelectItem value="2">200%</SelectItem>
          </SelectContent>
        </Select>

        {/* Highlight Toolbar */}
        {file && (
          <HighlightToolbar
            activeColor={activeHighlightColor}
            onColorChange={setActiveHighlightColor}
            onClearHighlights={() => {
              clearAllHighlights();
              toast.success("All highlights cleared");
            }}
            highlightCount={Array.from(highlights.values()).reduce((sum, arr) => sum + arr.length, 0)}
            onHighlightSelection={handleHighlightSelection}
          />
        )}

        <div className="flex gap-1 border-l border-border pl-2">
          <Button
            variant={textSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTextSelectionMode(!textSelectionMode);
              setRegionMode(false);
              setImageMode(false);
              setDrawingMode(false);
            }}
            disabled={!file}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Text
          </Button>
          <Button
            variant={regionMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRegionMode(!regionMode);
              setTextSelectionMode(false);
              setImageMode(false);
              setDrawingMode(false);
            }}
            disabled={!file}
            className="gap-2"
          >
            <Box className="h-4 w-4" />
            Region
          </Button>
          <Button
            variant={imageMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setImageMode(!imageMode);
              setTextSelectionMode(false);
              setRegionMode(false);
              setDrawingMode(false);
            }}
            disabled={!file}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Image
          </Button>
          <Button
            variant={drawingMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setDrawingMode(!drawingMode);
              setTextSelectionMode(false);
              setRegionMode(false);
              setImageMode(false);
            }}
            disabled={!file}
            className="gap-2"
          >
            <Paintbrush className="h-4 w-4" />
            Annotate
          </Button>
          <Button
            variant={searchOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchOpen(!searchOpen)}
            disabled={!file}
            className="gap-2"
          >
            <SearchIcon className="h-4 w-4" />
            Search
          </Button>
          <Button
            variant={showBoundingBoxControls ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBoundingBoxControls(!showBoundingBoxControls)}
            disabled={!file}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportAnnotations}
            disabled={!file || isLoadingAnnotations}
            className="gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20"
          >
            <FileDown className="h-4 w-4" />
            {isLoadingAnnotations ? "Reading..." : "Import Annotations"}
          </Button>
        </div>

        {activeField && (
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-md border border-primary/20 flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Active: {activeField}
            </div>
            {(regionMode || imageMode || drawingMode) && (
              <div className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 ${
                imageMode 
                  ? "bg-extraction-image/10 text-extraction-image border-extraction-image/20"
                  : drawingMode
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}>
                {imageMode ? (
                  <>
                    <Camera className="h-3 w-3" />
                    Image Mode
                  </>
                ) : drawingMode ? (
                  <>
                    <Paintbrush className="h-3 w-3" />
                    Annotation Mode
                  </>
                ) : (
                  <>
                    <Box className="h-3 w-3" />
                    Region Mode
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Navigator */}
      {studySections && studySections.length > 0 && (
        <SectionNavigator
          sections={studySections}
          currentPage={currentPage}
          onPageChange={onPageChange}
          extractions={extractions}
          onBatchExtract={onBatchExtract}
          isBatchExtracting={isBatchExtracting}
        />
      )}

      {/* Bounding Box Controls */}
      {showBoundingBoxControls && file && (
        <div className="p-4 border-t border-border">
          <BoundingBoxControls
            visibility={boundingBoxVisibility}
            onVisibilityChange={setBoundingBoxVisibility}
          />
        </div>
      )}

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4 relative">
        {searchOpen && (
          <SearchPanel
            pdfText={pdfFullText}
            onSearchResult={handleInternalSearchResults}
            onNavigateToResult={handleSearchResultNavigation}
            isOpen={searchOpen}
            onClose={() => {
              setSearchOpen(false);
              
              clearHighlightsOfType('search');
            }}
            pageTextCache={pageTextCache}
            scale={scale}
          />
        )}
        
        <AnnotationImportDialog
          open={annotationDialogOpen}
          onOpenChange={setAnnotationDialogOpen}
          importResult={importResult}
          onImport={handleAnnotationsSelected}
          onImportJSON={handleJSONImport}
        />

        <AnnotationExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          pageAnnotations={getAllAnnotations()}
          pdfFileName={file?.name || "document"}
        />

        {/* Drawing Toolbar */}
        {drawingMode && (
          <div className="mb-4 space-y-2">
            <DrawingToolbar
              activeTool={activeTool}
              onToolChange={handleDrawingToolChange}
              activeColor={drawingColor}
              onColorChange={setDrawingColor}
              strokeWidth={strokeWidth}
              onStrokeWidthChange={setStrokeWidth}
              onClear={() => {
                clearCanvas();
                clearHistory();
                toast.success("Annotations cleared");
              }}
              onUndo={undo}
              onRedo={redo}
              onSave={handleSaveAnnotations}
              onExport={() => setExportDialogOpen(true)}
              canUndo={canUndo}
              canRedo={canRedo}
              selectedObject={selectedObject}
              onBringToFront={bringToFront}
              onSendToBack={sendToBack}
              onDeleteSelected={deleteSelected}
            />
            
            {/* Polygon helper text */}
            {activeTool === 'polygon' && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                <span className="text-primary font-medium">
                  Polygon Mode: Click to add points ({polygonPointCount} points)
                </span>
                {polygonPointCount >= 3 && (
                  <span className="text-muted-foreground">
                    • Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to finish
                  </span>
                )}
              </div>
            )}

            {/* Interactive drawing hints */}
            {(activeTool === 'line' || activeTool === 'arrow') && (
              <div className="flex items-center gap-2 p-2 bg-accent/10 border border-accent/20 rounded-lg text-sm">
                <span className="text-accent-foreground">
                  {activeTool === 'line' ? 'Line' : 'Arrow'} Mode: Click and drag to draw
                </span>
              </div>
            )}
          </div>
        )}
        
        {!file ? (
          <div
            className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-card/50 cursor-pointer hover:bg-card/70 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Drop PDF file here</h3>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="pdf-viewer-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseUpCapture={handleTextSelection}
            style={{ cursor: regionMode || imageMode ? "crosshair" : "auto" }}
          >
            {/* Citation Link Panel */}
            {hoveredRegion && onJumpToExtraction && (
              <CitationLinkPanel
                extractions={extractions}
                currentPage={currentPage}
                hoveredRegion={hoveredRegion}
                onJumpToExtraction={onJumpToExtraction}
              />
            )}

            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
              <div style={{ height: '750px' }}>
                {fileUrl ? (
                  <Viewer
                    fileUrl={fileUrl}
                    plugins={[highlightPluginInstance, searchPluginInstance]}
                    onDocumentLoad={handleDocumentLoad}
                    onPageChange={handlePageChange}
                    initialPage={currentPage - 1}
                    defaultScale={scale}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No PDF loaded. Please upload a PDF file to begin.
                  </div>
                )}
              </div>
            </Worker>

            {/* Bounding Box Visualization Overlay */}
            {Object.values(boundingBoxVisibility).some(Boolean) && file && (
              <div className="absolute top-0 left-0 pointer-events-none z-5" style={{ width: '100%', height: '100%' }}>
                <canvas
                  ref={boundingBoxCanvasRef}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    mixBlendMode: 'multiply',
                  }}
                />
              </div>
            )}

            {/* Drawing Canvas Overlay */}
            {drawingMode && (
              <div className="absolute top-0 left-0 pointer-events-auto z-10 canvas-overlay" style={{ width: '100%', height: '100%' }}>
                <canvas
                  ref={drawingCanvasRef}
                  data-tool={activeTool}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    border: '2px dashed hsl(var(--primary))',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    maxWidth: '100%',
                  }}
                />
              </div>
            )}

            {/* Selection box overlay */}
            {isSelecting && selectionBox && (
              <div
                className={`absolute border-3 border-dashed pointer-events-none ${
                  imageMode 
                    ? "border-extraction-image bg-extraction-image/10" 
                    : "border-info bg-info/10"
                }`}
                style={{
                  left: selectionBox.x,
                  top: selectionBox.y,
                  width: selectionBox.width,
                  height: selectionBox.height,
                }}
              >
                {imageMode && (
                  <div className="absolute -top-7 left-0 bg-extraction-image text-white text-xs px-2 py-1 rounded">
                    📷 Image Capture
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Figure Caption Tooltip */}
        {hoveredFigure && (
          <FigureCaptionTooltip
            figure={hoveredFigure.figure}
            x={hoveredFigure.x}
            y={hoveredFigure.y}
          />
        )}

        {/* Table Detail Tooltip */}
        {hoveredTable && (
          <TableDetailTooltip
            table={hoveredTable.table}
            mouseX={hoveredTable.x}
            mouseY={hoveredTable.y}
          />
        )}
      </div>
    </div>
  );
};
