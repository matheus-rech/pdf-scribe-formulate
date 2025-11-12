import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, ChevronLeft, ChevronRight, Box, Camera, FileText, Search as SearchIcon, FileDown, Paintbrush } from "lucide-react";
import { toast } from "sonner";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { RenderHighlightContentProps, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import type { ExtractionEntry } from "@/pages/Index";
import { extractAnnotationsFromPDF, type PDFAnnotation } from "@/lib/annotationParser";
import { AnnotationImportDialog } from "./AnnotationImportDialog";
import { DrawingToolbar, type DrawingTool } from "./DrawingToolbar";
import { useAnnotationCanvas } from "@/hooks/useAnnotationCanvas";
import { usePageAnnotations } from "@/hooks/usePageAnnotations";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import * as pdfjsLib from "pdfjs-dist";

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
  onPdfTextExtracted
}: PDFViewerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [regionMode, setRegionMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [textSelectionMode, setTextSelectionMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Drawing mode states
  const [drawingMode, setDrawingMode] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 800, height: 1000 });

  // Use custom hooks
  const { 
    savePageAnnotation, 
    getPageAnnotation, 
    clearPageAnnotation, 
    hasAnnotation 
  } = usePageAnnotations();

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
  } = useAnnotationCanvas(drawingCanvasRef, pageDimensions.width, pageDimensions.height, drawingMode);

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
      setDrawingMode(false);
      setRegionMode(false);
      setImageMode(false);
      setTextSelectionMode(false);
    },
  }, drawingMode);

  // Save annotations when switching pages
  const saveCurrentPageAnnotations = useCallback(() => {
    if (!fabricCanvas || !drawingMode) return;
    
    const json = fabricCanvas.toJSON();
    const thumbnail = fabricCanvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 1 });
    savePageAnnotation(currentPage, json, thumbnail);
  }, [fabricCanvas, drawingMode, currentPage, savePageAnnotation]);

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

    return (
      <div>
        {pageExtractions.map((extraction) => {
          const coords = extraction.coordinates;
          if (!coords) return null;

          // Use absolute positioning with pixels
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
    } else {
      toast.success(`Region extracted to ${activeField}`);
    }

    onExtraction({
      id: `extraction-${Date.now()}`,
      fieldName: activeField,
      text: extractedText,
      page: currentPage,
      coordinates: selectionBox,
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

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4 relative">
        {searchOpen && (
          <div className="absolute top-4 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-2">
            <ShowSearchPopover />
          </div>
        )}
        
        <AnnotationImportDialog
          open={annotationDialogOpen}
          onOpenChange={setAnnotationDialogOpen}
          importResult={importResult}
          onImport={handleAnnotationsSelected}
        />

        {/* Drawing Toolbar */}
        {drawingMode && (
          <div className="mb-4">
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
              canUndo={canUndo}
              canRedo={canRedo}
              selectedObject={selectedObject}
              onBringToFront={bringToFront}
              onSendToBack={sendToBack}
              onDeleteSelected={deleteSelected}
            />
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
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
              <div style={{ height: '750px' }}>
                <Viewer
                  fileUrl={fileUrl}
                  plugins={[highlightPluginInstance, searchPluginInstance]}
                  onDocumentLoad={handleDocumentLoad}
                  onPageChange={handlePageChange}
                  initialPage={currentPage - 1}
                  defaultScale={scale}
                />
              </div>
            </Worker>

            {/* Drawing Canvas Overlay */}
            {drawingMode && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-auto z-10">
                <canvas
                  ref={drawingCanvasRef}
                  className="absolute top-0 left-0"
                  style={{ 
                    border: '2px dashed hsl(var(--primary))',
                    borderRadius: '0.5rem',
                    backgroundColor: 'transparent',
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
      </div>
    </div>
  );
};
