import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, BookOpen, FlaskConical, BarChart3, MessageSquare, CheckCircle, Quote, Paperclip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractionEntry } from "@/pages/Index";
import type { DetectedSection } from "@/lib/sectionDetection";
import { calculateSectionCompletion } from "@/lib/sectionProgress";


interface SectionNavigatorProps {
  sections: DetectedSection[];
  currentPage: number;
  onPageChange: (page: number) => void;
  extractions?: ExtractionEntry[];
  onBatchExtract?: (section: DetectedSection) => void;
  isBatchExtracting?: boolean;
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

const getSectionColor = (type: string, isActive: boolean) => {
  const base = 'transition-all duration-200';
  
  if (isActive) {
    switch (type.toLowerCase()) {
      case 'abstract': return `${base} bg-blue-500 text-white hover:bg-blue-600`;
      case 'introduction': return `${base} bg-green-500 text-white hover:bg-green-600`;
      case 'methods': return `${base} bg-purple-500 text-white hover:bg-purple-600`;
      case 'results': return `${base} bg-yellow-500 text-white hover:bg-yellow-600`;
      case 'discussion': return `${base} bg-orange-500 text-white hover:bg-orange-600`;
      case 'conclusion': return `${base} bg-red-500 text-white hover:bg-red-600`;
      case 'references': return `${base} bg-gray-500 text-white hover:bg-gray-600`;
      default: return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
    }
  }
  
  return `${base} bg-muted text-muted-foreground hover:bg-muted/80`;
};

export const SectionNavigator = ({ 
  sections, 
  currentPage, 
  onPageChange,
  extractions = [],
  onBatchExtract,
  isBatchExtracting = false
}: SectionNavigatorProps) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Find active section based on current page
  const activeSection = sections.find(
    section => currentPage >= section.pageStart && currentPage <= section.pageEnd
  );

  return (
    <div className="w-full border-b border-border bg-card/50 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 p-2 px-4">
          <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Sections:
          </div>
          <div className="flex gap-1.5 flex-nowrap">
            {sections.map((section, idx) => {
              const Icon = getSectionIcon(section.type);
              const isActive = activeSection?.name === section.name;
              const colorClass = getSectionColor(section.type, isActive);
              const completion = calculateSectionCompletion(section, extractions);
              const hasData = completion > 0;
              
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(section.pageStart)}
                      className={cn(
                        "gap-1.5 text-xs h-8 whitespace-nowrap",
                        colorClass,
                        isActive && "ring-2 ring-offset-1"
                      )}
                      title={`${section.name} (Pages ${section.pageStart}-${section.pageEnd}) - ${completion}% complete`}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{section.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[10px] h-4 px-1 ml-1",
                          isActive ? "bg-white/20 text-white" : ""
                        )}
                      >
                        {section.pageStart}-{section.pageEnd}
                      </Badge>
                    </Button>
                    
                    {onBatchExtract && section.type !== 'unknown' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBatchExtract(section);
                        }}
                        disabled={isBatchExtracting}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                        title={`AI Extract all fields from ${section.name}`}
                      >
                        <Sparkles className={cn(
                          "h-3.5 w-3.5",
                          isBatchExtracting ? "animate-pulse" : "",
                          hasData ? "text-primary" : "text-muted-foreground"
                        )} />
                      </Button>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  {completion > 0 && (
                    <div className="flex items-center gap-1 px-1">
                      <Progress 
                        value={completion} 
                        className="h-1 w-20"
                      />
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {completion}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
