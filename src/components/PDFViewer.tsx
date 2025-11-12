import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, ChevronLeft, ChevronRight, Box, Camera, FileText, Search as SearchIcon, FileDown } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import type { ExtractionEntry } from "@/pages/Index";
import { SearchPanel } from "./SearchPanel";
import { extractAnnotationsFromPDF, type PDFAnnotation } from "@/lib/annotationParser";
import { AnnotationImportDialog } from "./AnnotationImportDialog";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  onAnnotationsImport
}: PDFViewerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [regionMode, setRegionMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ page: number; text: string; index: number }>>([]);
  const [pdfText, setPdfText] = useState("");
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);

  // Load PDF when file changes
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        onTotalPagesChange(pdf.numPages);
        onPageChange(1);
        toast.success(`PDF loaded: ${pdf.numPages} pages`);
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast.error("Failed to load PDF");
      }
    };

    loadPDF();
  }, [file]);

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Render text layer for selection
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = "";
          const textContent = await page.getTextContent();
          
          // Store text for search
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          setPdfText(prev => prev + "\n" + pageText);
          
          // Create text layer div
          const textLayerDiv = textLayerRef.current;
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;

          // Render text items
          textContent.items.forEach((item: any) => {
            const tx = pdfjsLib.Util.transform(
              viewport.transform,
              item.transform
            );
            
            const span = document.createElement("span");
            span.textContent = item.str;
            span.style.position = "absolute";
            span.style.left = `${tx[4]}px`;
            span.style.top = `${tx[5]}px`;
            span.style.fontSize = `${Math.abs(tx[0])}px`;
            span.style.fontFamily = item.fontName;
            span.className = "pdf-text-item";
            
            textLayerDiv.appendChild(span);
          });
        }
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  // Handle text selection
  useEffect(() => {
    if (!textLayerRef.current || !activeField) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();

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
    };

    const textLayer = textLayerRef.current;
    textLayer.addEventListener("mouseup", handleSelection);

    return () => {
      textLayer.removeEventListener("mouseup", handleSelection);
    };
  }, [activeField, currentPage, onExtraction]);

  // Handle region selection
  const handleRegionMouseDown = (e: React.MouseEvent) => {
    if (!regionMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setIsSelecting(true);
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleRegionMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setSelectionBox({
      x: Math.min(selectionStart.x, currentX),
      y: Math.min(selectionStart.y, currentY),
      width: Math.abs(currentX - selectionStart.x),
      height: Math.abs(currentY - selectionStart.y),
    });
  };

  const handleRegionMouseUp = async () => {
    if (!isSelecting || !selectionBox || !activeField || !canvasRef.current) return;

    let extractedText = `[Region: ${selectionBox.width.toFixed(0)}x${selectionBox.height.toFixed(0)}px]`;
    let imageData: string | undefined = undefined;

    // If in image mode, capture the actual image
    if (imageMode) {
      try {
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Set canvas size to selection box size
          tempCanvas.width = selectionBox.width;
          tempCanvas.height = selectionBox.height;
          
          // Draw the selected region from the main canvas
          tempCtx.drawImage(
            canvas,
            selectionBox.x, // source x
            selectionBox.y, // source y
            selectionBox.width, // source width
            selectionBox.height, // source height
            0, // destination x
            0, // destination y
            selectionBox.width, // destination width
            selectionBox.height // destination height
          );
          
          // Convert to PNG base64
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
            variant={regionMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRegionMode(!regionMode);
              setImageMode(false);
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
              setRegionMode(false);
            }}
            disabled={!file}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Image
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
            {(regionMode || imageMode) && (
              <div className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 ${
                imageMode 
                  ? "bg-extraction-image/10 text-extraction-image border-extraction-image/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}>
                {imageMode ? (
                  <>
                    <Camera className="h-3 w-3" />
                    Image Mode
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
        <SearchPanel
          pdfText={pdfText}
          onSearchResult={setSearchResults}
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
        
        <AnnotationImportDialog
          open={annotationDialogOpen}
          onOpenChange={setAnnotationDialogOpen}
          importResult={importResult}
          onImport={handleAnnotationsSelected}
        />
        
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
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative inline-block shadow-lg rounded-lg overflow-hidden bg-white"
              onMouseDown={handleRegionMouseDown}
              onMouseMove={handleRegionMouseMove}
              onMouseUp={handleRegionMouseUp}
              style={{ cursor: regionMode || imageMode ? "crosshair" : "auto" }}
            >
              <canvas ref={canvasRef} className="block" />
              <div
                ref={textLayerRef}
                className="absolute top-0 left-0 overflow-hidden pointer-events-auto"
                style={{ userSelect: !regionMode && !imageMode ? "text" : "none" }}
              />
              
              {/* Selection box overlay */}
              {isSelecting && selectionBox && (
                <div
                  className={`absolute border-3 border-dashed ${
                    imageMode 
                      ? "border-extraction-image bg-extraction-image/10" 
                      : "border-info bg-info/10"
                  }`}
                  style={{
                    left: selectionBox.x,
                    top: selectionBox.y,
                    width: selectionBox.width,
                    height: selectionBox.height,
                    pointerEvents: "none",
                  }}
                >
                  {imageMode && (
                    <div className="absolute -top-7 left-0 bg-extraction-image text-white text-xs px-2 py-1 rounded">
                      📷 Image Capture
                    </div>
                  )}
                </div>
              )}

              {/* Extraction markers */}
              {extractions
                .filter((e) => e.page === currentPage && e.coordinates)
                .map((extraction) => (
                  <div
                    key={extraction.id}
                    className={`absolute border-2 pointer-events-auto cursor-pointer transition-all hover:shadow-lg group ${
                      extraction.method === "manual"
                        ? "border-extraction-manual bg-extraction-manual/10 hover:bg-extraction-manual/20"
                        : extraction.method === "ai"
                        ? "border-extraction-ai bg-extraction-ai/10 hover:bg-extraction-ai/20"
                        : extraction.method === "image"
                        ? "border-extraction-image bg-extraction-image/10 hover:bg-extraction-image/20"
                        : "border-extraction-search bg-extraction-search/10 hover:bg-extraction-search/20"
                    }`}
                    style={{
                      left: extraction.coordinates!.x,
                      top: extraction.coordinates!.y,
                      width: extraction.coordinates!.width,
                      height: extraction.coordinates!.height,
                    }}
                    title={`${extraction.fieldName} (${extraction.method})`}
                  >
                    <div className="absolute -top-7 left-0 bg-card border border-border rounded px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap z-10">
                      📋 {extraction.fieldName}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
