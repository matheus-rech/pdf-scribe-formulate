import { CitationBadge } from "./CitationBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface Citation {
  index: number;
  pageNum: number;
  sentence: string;
}

interface CitationPanelProps {
  citationIndices: number[];
  citationMap: Record<number, Citation>;
  activeCitationIndex: number | null;
  onCitationClick: (index: number) => void;
  sourceQuote?: string;
  primaryPage?: number;
}

export const CitationPanel = ({
  citationIndices,
  citationMap,
  activeCitationIndex,
  onCitationClick,
  sourceQuote,
  primaryPage,
}: CitationPanelProps) => {
  if (citationIndices.length === 0) return null;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>Supporting Citations ({citationIndices.length})</span>
          </div>
          <span className="text-xs text-muted-foreground font-normal italic">
            Click to view source
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {citationIndices.map((idx) => {
            const citation = citationMap[idx];
            return (
              <CitationBadge
                key={idx}
                citationIndex={idx}
                pageNumber={citation?.pageNum}
                sentencePreview={citation?.sentence}
                isActive={activeCitationIndex === idx}
                onClick={onCitationClick}
              />
            );
          })}
        </div>

        {/* Active citation preview */}
        {activeCitationIndex !== null && citationMap[activeCitationIndex] && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-semibold text-primary">
                Citation [{activeCitationIndex}] • Page{" "}
                {citationMap[activeCitationIndex].pageNum}
              </span>
            </div>
            <p className="text-sm text-foreground/80 italic">
              "{citationMap[activeCitationIndex].sentence}"
            </p>
          </div>
        )}

        {/* Primary source quote */}
        {sourceQuote && (
          <div className="p-3 bg-secondary/30 rounded-lg border-l-4 border-primary">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> Primary Source
              {primaryPage && ` (Page ${primaryPage})`}
            </p>
            <p className="text-sm text-foreground/90 italic">"{sourceQuote}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
