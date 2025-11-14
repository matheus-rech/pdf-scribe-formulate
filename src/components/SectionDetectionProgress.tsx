import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, BookOpen, FlaskConical, BarChart3, MessageSquare, CheckCircle, Quote, Paperclip, Sparkles, Check } from "lucide-react";
import type { DetectedSection } from "@/lib/sectionDetection";

interface SectionDetectionProgressProps {
  sections: DetectedSection[];
  currentPage?: number;
  totalPages?: number;
  isProcessing?: boolean;
}

const getSectionIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'abstract': return FileText;
    case 'introduction': return BookOpen;
    case 'methods': return FlaskConical;
    case 'results': return BarChart3;
    case 'discussion': return MessageSquare;
    case 'conclusion': return CheckCircle;
    case 'references': return Quote;
    case 'appendix': return Paperclip;
    default: return FileText;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500/10 text-green-700 border-green-500/20';
  if (confidence >= 0.6) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
  return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
};

export const SectionDetectionProgress = ({ 
  sections, 
  currentPage = 0, 
  totalPages = 0,
  isProcessing = false 
}: SectionDetectionProgressProps) => {
  if (sections.length === 0 && !isProcessing) {
    return null;
  }

  const processingProgress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {isProcessing ? 'Detecting Sections...' : 'Detected Sections'}
          </h3>
        </div>
        {isProcessing && totalPages > 0 && (
          <Badge variant="outline" className="text-xs">
            Page {currentPage}/{totalPages}
          </Badge>
        )}
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={processingProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Analyzing document structure and identifying key sections...
          </p>
        </div>
      )}

      {sections.length > 0 && (
        <div className="space-y-2">
          <div className="grid gap-2">
            {sections.map((section, idx) => {
              const Icon = getSectionIcon(section.type);
              const confidenceColor = getConfidenceColor(section.confidence);
              
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {section.name}
                        </span>
                        {section.headingText && (
                          <span className="text-xs text-muted-foreground truncate">
                            "{section.headingText}"
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Pages {section.pageStart}-{section.pageEnd}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${confidenceColor}`}
                    >
                      {Math.round(section.confidence * 100)}% confident
                    </Badge>
                    {section.confidence >= 0.8 && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isProcessing && (
            <p className="text-xs text-muted-foreground mt-3">
              ✨ Section detection complete. {sections.length} sections identified with an average confidence of{' '}
              {Math.round((sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length) * 100)}%
            </p>
          )}
        </div>
      )}
    </Card>
  );
};