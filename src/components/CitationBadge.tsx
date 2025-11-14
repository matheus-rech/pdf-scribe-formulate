import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CitationBadgeProps {
  citationIndex: number;
  pageNumber?: number;
  sentencePreview?: string;
  isActive: boolean;
  onClick: (index: number) => void;
}

export const CitationBadge = ({
  citationIndex,
  pageNumber,
  sentencePreview,
  isActive,
  onClick,
}: CitationBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => onClick(citationIndex)}
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={`
              inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200 cursor-pointer
              ${isActive 
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/50 animate-pulse' 
                : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
              }
            `}
          >
            <span>[{citationIndex}]</span>
            {isActive && <span className="text-xs">📍</span>}
          </Button>
        </TooltipTrigger>
        {sentencePreview && (
          <TooltipContent className="max-w-md">
            <div className="space-y-1">
              {pageNumber && (
                <p className="text-xs text-muted-foreground">Page {pageNumber}</p>
              )}
              <p className="text-sm">
                "{sentencePreview.substring(0, 150)}
                {sentencePreview.length > 150 ? "..." : ""}"
              </p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
