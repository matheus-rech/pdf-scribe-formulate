import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CitationHighlighter } from './CitationHighlighter';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExtractionEntry {
  id: string;
  field_name: string;
  text: string;
  source_citations?: any;
  validation_status?: string;
  page?: number;
}

interface SourceProvenancePanelProps {
  studyId: string;
  extractions: ExtractionEntry[];
  onNavigateToChunk?: (pageNum: number, chunkIndex: number) => void;
}

export function SourceProvenancePanel({
  studyId,
  extractions,
  onNavigateToChunk,
}: SourceProvenancePanelProps) {
  const [selectedExtraction, setSelectedExtraction] = useState<string | null>(null);

  const extractionsWithCitations = extractions.filter(
    (ext) => ext.source_citations && 
    typeof ext.source_citations === 'object' &&
    ext.source_citations.chunk_indices?.length > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Source Provenance
        </CardTitle>
        <CardDescription>
          Verify extracted data with precise source citations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            {extractionsWithCitations.length} of {extractions.length} extractions
            have citation provenance
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {extractions.map((extraction) => {
              const citations =
                extraction.source_citations &&
                typeof extraction.source_citations === 'object'
                  ? extraction.source_citations
                  : null;

              const hasCitations =
                citations && citations.chunk_indices?.length > 0;

              return (
                <div
                  key={extraction.id}
                  className="p-3 border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {extraction.field_name}
                        </Badge>
                        
                        {extraction.validation_status === 'validated' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {extraction.validation_status === 'pending' && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>

                      <p className="text-sm font-medium">{extraction.text || 'No value'}</p>

                      {citations && citations.source_quote && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                          "{citations.source_quote}"
                        </p>
                      )}

                      {hasCitations && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {citations.chunk_indices.length} citation
                            {citations.chunk_indices.length !== 1 ? 's' : ''}
                          </span>
                          {citations.confidence > 0 && (
                            <Badge
                              variant={
                                citations.confidence >= 80
                                  ? 'default'
                                  : citations.confidence >= 60
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {citations.confidence}% confidence
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {hasCitations && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedExtraction(
                            selectedExtraction === extraction.id
                              ? null
                              : extraction.id
                          )
                        }
                      >
                        {selectedExtraction === extraction.id
                          ? 'Hide Sources'
                          : 'View Sources'}
                      </Button>
                    )}
                  </div>

                  {selectedExtraction === extraction.id && hasCitations && (
                    <div className="mt-3">
                      <CitationHighlighter
                        studyId={studyId}
                        chunkIndices={citations.chunk_indices}
                        onClose={() => setSelectedExtraction(null)}
                        onNavigateToChunk={onNavigateToChunk}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {extractions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No extractions available
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
