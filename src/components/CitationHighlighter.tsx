import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ExternalLink } from 'lucide-react';

interface TextChunk {
  chunk_index: number;
  page_number: number;
  text: string;
  section_name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CitationHighlighterProps {
  studyId: string;
  chunkIndices: number[];
  onClose: () => void;
  onNavigateToChunk?: (pageNum: number, chunkIndex: number) => void;
}

export function CitationHighlighter({
  studyId,
  chunkIndices,
  onClose,
  onNavigateToChunk,
}: CitationHighlighterProps) {
  const [citationData, setCitationData] = useState<TextChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCitations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('pdf_text_chunks')
          .select('*')
          .eq('study_id', studyId)
          .in('chunk_index', chunkIndices)
          .order('chunk_index');

        if (error) {
          console.error('Error fetching citations:', error);
          setCitationData([]);
        } else {
          setCitationData(data || []);
        }
      } catch (err) {
        console.error('Error fetching citations:', err);
        setCitationData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (studyId && chunkIndices.length > 0) {
      fetchCitations();
    }
  }, [studyId, chunkIndices]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Source Citations ({chunkIndices.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading citations...</div>
        ) : citationData.length === 0 ? (
          <div className="text-sm text-muted-foreground">No citations found</div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {citationData.map((chunk) => (
                <div
                  key={chunk.chunk_index}
                  className="p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="font-mono">
                      [{chunk.chunk_index}]
                    </Badge>
                    {onNavigateToChunk && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onNavigateToChunk(chunk.page_number, chunk.chunk_index)
                        }
                        className="h-7 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View in PDF
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm leading-relaxed mb-2">{chunk.text}</p>
                  
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <span className="font-medium mr-1">Page:</span>
                      {chunk.page_number}
                    </span>
                    {chunk.section_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <span className="font-medium mr-1">Section:</span>
                          {chunk.section_name}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center">
                      <span className="font-medium mr-1">Position:</span>
                      ({Math.round(chunk.x)}, {Math.round(chunk.y)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
