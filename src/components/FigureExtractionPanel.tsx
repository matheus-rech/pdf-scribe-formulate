import { useState, useMemo } from "react";
import { Download, Image as ImageIcon, Maximize2, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface Figure {
  id: string;
  page_number: number;
  figure_id: string;
  data_url: string;
  width: number;
  height: number;
  extraction_method: string;
  color_space?: number;
  has_alpha?: boolean;
  caption?: string;
  ai_enhanced?: boolean;
}

interface FigureExtractionPanelProps {
  figures: Figure[];
  onPageNavigate?: (pageNum: number) => void;
}

export const FigureExtractionPanel = ({
  figures,
  onPageNavigate,
}: FigureExtractionPanelProps) => {
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort figures by page number
  const sortedFigures = useMemo(() => {
    return [...figures].sort((a, b) => a.page_number - b.page_number);
  }, [figures]);

  const downloadFigure = (figure: Figure) => {
    const link = document.createElement("a");
    link.href = figure.data_url;
    link.download = `${figure.figure_id}.png`;
    link.click();
  };

  const downloadAllFigures = () => {
    sortedFigures.forEach((figure, index) => {
      setTimeout(() => {
        downloadFigure(figure);
      }, index * 200);
    });
  };

  const getColorSpaceName = (kind?: number) => {
    switch (kind) {
      case 1:
        return "Grayscale";
      case 2:
        return "RGB";
      default:
        return "Other";
    }
  };

  if (figures.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          No figures extracted yet. Upload a PDF to begin.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Extracted Figures</h3>
            <p className="text-xs text-muted-foreground">
              {figures.length} figure{figures.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
        {figures.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAllFigures}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download all figures as PNG files</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Figure Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {sortedFigures.map((figure) => (
            <Card
              key={figure.id}
              className="group relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
              onMouseEnter={() => setHoveredId(figure.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedFigure(figure)}
            >
              {/* Figure Image */}
              <div className="aspect-square bg-muted relative">
                <img
                  src={figure.data_url}
                  alt={figure.caption || figure.figure_id}
                  className="w-full h-full object-contain"
                />

                {/* Hover Overlay */}
                {hoveredId === figure.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFigure(figure);
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFigure(figure);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Figure Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageNavigate?.(figure.page_number);
                    }}
                  >
                    Page {figure.page_number}
                  </Badge>
                  {figure.ai_enhanced && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="text-xs">
                            AI
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enhanced with AI caption extraction</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {figure.width} × {figure.height}px
                </div>

                {figure.caption && (
                  <p className="text-xs line-clamp-2">{figure.caption}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedFigure}
        onOpenChange={(open) => !open && setSelectedFigure(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedFigure?.figure_id}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFigure(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedFigure && (
            <div className="space-y-4">
              {/* Full Resolution Image */}
              <div className="bg-muted rounded-lg p-4 flex items-center justify-center max-h-[60vh] overflow-auto">
                <img
                  src={selectedFigure.data_url}
                  alt={selectedFigure.caption || selectedFigure.figure_id}
                  className="max-w-full h-auto"
                />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Metadata
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>
                      <span className="font-medium">Page:</span>{" "}
                      {selectedFigure.page_number}
                    </div>
                    <div>
                      <span className="font-medium">Dimensions:</span>{" "}
                      {selectedFigure.width} × {selectedFigure.height}px
                    </div>
                    <div>
                      <span className="font-medium">Color Space:</span>{" "}
                      {getColorSpaceName(selectedFigure.color_space)}
                    </div>
                    <div>
                      <span className="font-medium">Alpha Channel:</span>{" "}
                      {selectedFigure.has_alpha ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedFigure.extraction_method}
                    </div>
                  </div>
                </div>

                {selectedFigure.caption && (
                  <div>
                    <div className="font-medium mb-2">Caption</div>
                    <p className="text-muted-foreground">
                      {selectedFigure.caption}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => downloadFigure(selectedFigure)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Figure
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onPageNavigate?.(selectedFigure.page_number);
                    setSelectedFigure(null);
                  }}
                  className="flex-1"
                >
                  Go to Page {selectedFigure.page_number}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
