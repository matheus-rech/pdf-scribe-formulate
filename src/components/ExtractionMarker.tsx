import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ExtractionMarkerProps {
  extraction: ExtractionEntry;
  onClick?: () => void;
}

export const ExtractionMarker = ({ extraction, onClick }: ExtractionMarkerProps) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!extraction.coordinates) return null;

  // Determine color based on extraction method
  const getMarkerColor = () => {
    switch (extraction.method) {
      case "manual":
        return "hsl(var(--extraction-manual))";
      case "ai":
        return "hsl(var(--extraction-ai))";
      case "image":
        return "hsl(var(--extraction-image))";
      case "region":
        return "hsl(var(--accent))";
      case "annotation":
        return "hsl(var(--extraction-search))";
      default:
        return "hsl(var(--primary))";
    }
  };

  // Determine validation icon
  const getValidationIcon = () => {
    if (extraction.validation_status === "validated") {
      return <CheckCircle2 className="h-3 w-3" />;
    } else if (extraction.validation_status === "questionable") {
      return <AlertCircle className="h-3 w-3" />;
    } else if (extraction.validation_status === "pending") {
      return <Clock className="h-3 w-3" />;
    }
    return null;
  };

  const markerStyle: React.CSSProperties = {
    position: "absolute",
    left: extraction.coordinates.x,
    top: extraction.coordinates.y,
    width: extraction.coordinates.width,
    height: extraction.coordinates.height,
    border: `2px ${isHovered ? "solid" : "dashed"} ${getMarkerColor()}`,
    backgroundColor: isHovered ? `${getMarkerColor()}20` : `${getMarkerColor()}10`,
    borderRadius: "4px",
    pointerEvents: "auto",
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease-in-out",
    zIndex: isHovered ? 10 : 5,
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div
            style={markerStyle}
            className={isHovered ? "extraction-marker-pulse" : ""}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Field name label */}
            <div
              className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium rounded shadow-sm flex items-center gap-1"
              style={{
                backgroundColor: getMarkerColor(),
                color: "white",
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              {getValidationIcon()}
              {extraction.fieldName}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 text-xs">
            <p className="font-semibold">{extraction.fieldName}</p>
            <p className="text-muted-foreground">Method: {extraction.method}</p>
            <p className="text-muted-foreground">Page: {extraction.page}</p>
            {extraction.validation_status && (
              <p className="text-muted-foreground">Status: {extraction.validation_status}</p>
            )}
            {extraction.confidence_score && (
              <p className="text-muted-foreground">
                Confidence: {(extraction.confidence_score * 100).toFixed(0)}%
              </p>
            )}
            <p className="max-w-xs line-clamp-2">{extraction.text}</p>
            
            {/* Citation Preview */}
            {extraction.sourceCitations && extraction.sourceCitations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs font-medium mb-1">Sources:</p>
                <div className="flex gap-1 flex-wrap">
                  {extraction.sourceCitations.map((citation: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-mono">
                      [{citation.chunkIndex || idx}]
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
