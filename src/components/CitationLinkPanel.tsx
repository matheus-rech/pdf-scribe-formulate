import { Link2 } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";

interface CitationLinkPanelProps {
  extractions: ExtractionEntry[];
  currentPage: number;
  hoveredRegion?: { x: number; y: number; width: number; height: number };
  onJumpToExtraction: (extraction: ExtractionEntry) => void;
}

function regionsOverlap(
  region1: { x: number; y: number; width: number; height: number },
  region2: { x: number; y: number; width: number; height: number },
  threshold: number = 50
): boolean {
  // Simple overlap detection with threshold
  const xOverlap = Math.abs(region1.x - region2.x) < threshold;
  const yOverlap = Math.abs(region1.y - region2.y) < threshold;
  return xOverlap && yOverlap;
}

export const CitationLinkPanel = ({
  extractions,
  currentPage,
  hoveredRegion,
  onJumpToExtraction
}: CitationLinkPanelProps) => {
  if (!hoveredRegion) return null;

  // Find extractions that source from current region
  const linkedExtractions = extractions.filter(ext =>
    ext.sourceCitations?.some(cit =>
      cit.page === currentPage &&
      regionsOverlap(cit.coordinates, hoveredRegion)
    )
  );

  if (linkedExtractions.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 bg-card shadow-lg border border-border rounded-lg p-3 z-50 max-w-xs animate-in fade-in slide-in-from-right-2">
      <div className="text-xs font-semibold mb-2 flex items-center gap-2 text-primary">
        <Link2 className="h-3 w-3" />
        {linkedExtractions.length} Extraction{linkedExtractions.length > 1 ? 's' : ''} linked here
      </div>

      <div className="space-y-2">
        {linkedExtractions.map(ext => (
          <div
            key={ext.id}
            className="text-xs p-2 bg-muted rounded hover:bg-primary/10 cursor-pointer transition-colors"
            onClick={() => onJumpToExtraction(ext)}
          >
            <div className="font-medium text-foreground">{ext.fieldName}</div>
            <div className="text-muted-foreground line-clamp-1 mt-0.5">{ext.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
