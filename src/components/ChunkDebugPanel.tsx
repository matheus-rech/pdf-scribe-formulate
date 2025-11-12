import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, FileText, BookOpen, FlaskConical, BarChart3, MessageSquare, CheckCircle, Quote, Paperclip } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Study {
  id: string;
  name: string;
  pdf_chunks?: {
    version: string;
    processedAt: string;
    totalPages: number;
    pageChunks: any[];
    semanticChunks: any[];
    sections: Array<{
      name: string;
      type: string;
      startPage: number;
      endPage: number;
      confidence: number;
      charStart: number;
      charEnd: number;
    }>;
  };
}

interface ChunkDebugPanelProps {
  currentStudy: Study | null;
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

const getSectionColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'abstract': return 'bg-blue-500/10 text-blue-600 border-blue-500';
    case 'introduction': return 'bg-green-500/10 text-green-600 border-green-500';
    case 'methods': return 'bg-purple-500/10 text-purple-600 border-purple-500';
    case 'results': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500';
    case 'discussion': return 'bg-orange-500/10 text-orange-600 border-orange-500';
    case 'conclusion': return 'bg-red-500/10 text-red-600 border-red-500';
    case 'references': return 'bg-gray-500/10 text-gray-600 border-gray-500';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const ChunkDebugPanel = ({ currentStudy }: ChunkDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentStudy?.pdf_chunks) {
    return null;
  }

  const chunks = currentStudy.pdf_chunks;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">PDF Processing Debug</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {chunks.sections?.length || 0} sections
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <CardDescription className="text-xs text-left">
              View chunk statistics and detected sections
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-md bg-muted/50">
                <div className="text-muted-foreground">Total Pages</div>
                <div className="font-semibold">{chunks.totalPages}</div>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <div className="text-muted-foreground">Page Chunks</div>
                <div className="font-semibold">{chunks.pageChunks?.length || 0}</div>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <div className="text-muted-foreground">Semantic Chunks</div>
                <div className="font-semibold">{chunks.semanticChunks?.length || 0}</div>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <div className="text-muted-foreground">Version</div>
                <div className="font-semibold">{chunks.version}</div>
              </div>
            </div>

            {/* Processing Timestamp */}
            <div className="text-xs text-muted-foreground">
              Processed: {format(new Date(chunks.processedAt), "MMM d, yyyy 'at' h:mm a")}
            </div>

            {/* Detected Sections */}
            {chunks.sections && chunks.sections.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium">Detected Sections</div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {chunks.sections.map((section, idx) => {
                    const Icon = getSectionIcon(section.type);
                    const colorClass = getSectionColor(section.type);
                    
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-md border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Icon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">{section.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Pages {section.startPage}-{section.endPage} • {Math.round(section.confidence * 100)}% confidence
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${colorClass}`}>
                            {section.type}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Chars: {section.charStart.toLocaleString()}-{section.charEnd.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
