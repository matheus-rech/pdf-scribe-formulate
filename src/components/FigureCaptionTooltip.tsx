import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FigureCaptionTooltipProps {
  figure: any;
  x: number;
  y: number;
}

export const FigureCaptionTooltip = ({ figure, x, y }: FigureCaptionTooltipProps) => {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust tooltip position to stay within viewport
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const padding = 20;
    
    let adjustedX = x + 15;
    let adjustedY = y + 15;

    // Keep tooltip within right edge
    if (adjustedX + tooltipWidth > window.innerWidth - padding) {
      adjustedX = x - tooltipWidth - 15;
    }

    // Keep tooltip within bottom edge
    if (adjustedY + tooltipHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - tooltipHeight - padding;
    }

    // Keep tooltip within top edge
    if (adjustedY < padding) {
      adjustedY = padding;
    }

    // Keep tooltip within left edge
    if (adjustedX < padding) {
      adjustedX = padding;
    }

    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  const hasCaption = figure.caption && figure.caption.trim().length > 0;

  return (
    <Card
      className="fixed z-50 max-w-md shadow-lg border-2 border-primary/20 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {figure.figure_id || 'Unknown'}
            </Badge>
            {figure.ai_enhanced && (
              <Badge variant="secondary" className="text-xs">
                AI Enhanced
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Page {figure.page_number}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium">
            Caption:
          </div>
          {hasCaption ? (
            <p className="text-sm leading-relaxed">
              {figure.caption}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No caption available
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span>Size: {figure.width}×{figure.height}px</span>
          <span>Position: ({Math.round(figure.x)}, {Math.round(figure.y)})</span>
        </div>
      </div>
    </Card>
  );
};
