import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractionStats {
  figures: { found: number; saved: number; loading: boolean };
  tables: { found: number; saved: number; loading: boolean };
  chunks: { found: number; saved: number; loading: boolean };
  citations: { withCitations: number; total: number; loading: boolean };
}

interface ExtractionDebugPanelProps {
  studyId: string;
  onReextract?: (studyId: string, onProgress: (message: string) => void) => Promise<{ figures: number; tables: number; success: boolean }>;
}

export function ExtractionDebugPanel({ studyId, onReextract }: ExtractionDebugPanelProps) {
  const [stats, setStats] = useState<ExtractionStats>({
    figures: { found: 0, saved: 0, loading: true },
    tables: { found: 0, saved: 0, loading: true },
    chunks: { found: 0, saved: 0, loading: true },
    citations: { withCitations: 0, total: 0, loading: true },
  });
  const [isReextracting, setIsReextracting] = useState(false);
  const [reextractProgress, setReextractProgress] = useState<string>('');

  useEffect(() => {
    const loadStats = async () => {
      // Load figures
      const { data: figuresData } = await supabase
        .from('pdf_figures' as any)
        .select('id', { count: 'exact' })
        .eq('study_id', studyId);
      
      setStats(prev => ({
        ...prev,
        figures: { found: figuresData?.length || 0, saved: figuresData?.length || 0, loading: false }
      }));

      // Load tables
      const { data: tablesData } = await supabase
        .from('pdf_tables' as any)
        .select('id', { count: 'exact' })
        .eq('study_id', studyId);
      
      setStats(prev => ({
        ...prev,
        tables: { found: tablesData?.length || 0, saved: tablesData?.length || 0, loading: false }
      }));

      // Load text chunks
      const { data: chunksData } = await supabase
        .from('pdf_text_chunks' as any)
        .select('id', { count: 'exact' })
        .eq('study_id', studyId);
      
      setStats(prev => ({
        ...prev,
        chunks: { found: chunksData?.length || 0, saved: chunksData?.length || 0, loading: false }
      }));

      // Load extractions with citations
      const { data: extractionsData } = await supabase
        .from('extractions')
        .select('id, source_citations')
        .eq('study_id', studyId);
      
      const withCitations = extractionsData?.filter(e => e.source_citations && (e.source_citations as any).length > 0).length || 0;
      const total = extractionsData?.length || 0;
      
      setStats(prev => ({
        ...prev,
        citations: { withCitations, total, loading: false }
      }));
    };

    loadStats();
  }, [studyId]);

  const handleReextract = async () => {
    if (!onReextract) {
      toast.error('Re-extraction function not available');
      return;
    }

    setIsReextracting(true);
    setReextractProgress('Starting re-extraction...');

    try {
      const result = await onReextract(studyId, (message) => {
        setReextractProgress(message);
      });

      if (result.success) {
        // Reload stats after successful re-extraction
        const { data: figuresData } = await supabase
          .from('pdf_figures' as any)
          .select('id', { count: 'exact' })
          .eq('study_id', studyId);
        
        const { data: tablesData } = await supabase
          .from('pdf_tables' as any)
          .select('id', { count: 'exact' })
          .eq('study_id', studyId);

        setStats(prev => ({
          ...prev,
          figures: { found: result.figures, saved: result.figures, loading: false },
          tables: { found: result.tables, saved: result.tables, loading: false }
        }));

        setReextractProgress('');
      }
    } catch (error: any) {
      console.error('Re-extraction error:', error);
      setReextractProgress('');
    } finally {
      setIsReextracting(false);
    }
  };

  const getStatusIcon = (found: number, saved: number, loading: boolean) => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (saved === 0 && found === 0) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    if (saved < found) return <XCircle className="h-4 w-4 text-destructive" />;
    if (saved > 0) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusBadge = (found: number, saved: number, loading: boolean) => {
    if (loading) return <Badge variant="outline">Loading...</Badge>;
    if (saved === 0 && found === 0) return <Badge variant="outline">None</Badge>;
    if (saved < found) return <Badge variant="destructive">Incomplete</Badge>;
    if (saved > 0) return <Badge variant="default" className="bg-green-600">OK</Badge>;
    return <Badge variant="outline">Empty</Badge>;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Extraction Status
        </CardTitle>
        <CardDescription>
          Debug information for PDF processing and citation tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Figures */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.figures.found, stats.figures.saved, stats.figures.loading)}
              <div>
                <p className="font-medium text-sm">Figures</p>
                <p className="text-xs text-muted-foreground">
                  {stats.figures.saved} saved
                </p>
              </div>
            </div>
            {getStatusBadge(stats.figures.found, stats.figures.saved, stats.figures.loading)}
          </div>

          {/* Tables */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.tables.found, stats.tables.saved, stats.tables.loading)}
              <div>
                <p className="font-medium text-sm">Tables</p>
                <p className="text-xs text-muted-foreground">
                  {stats.tables.saved} saved
                </p>
              </div>
            </div>
            {getStatusBadge(stats.tables.found, stats.tables.saved, stats.tables.loading)}
          </div>

          {/* Text Chunks */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.chunks.found, stats.chunks.saved, stats.chunks.loading)}
              <div>
                <p className="font-medium text-sm">Text Chunks</p>
                <p className="text-xs text-muted-foreground">
                  {stats.chunks.saved} saved
                </p>
              </div>
            </div>
            {getStatusBadge(stats.chunks.found, stats.chunks.saved, stats.chunks.loading)}
          </div>

          {/* Citations */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {stats.citations.loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : stats.citations.withCitations > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <div>
                <p className="font-medium text-sm">Citations</p>
                <p className="text-xs text-muted-foreground">
                  {stats.citations.withCitations} of {stats.citations.total} extractions
                </p>
              </div>
            </div>
            {stats.citations.loading ? (
              <Badge variant="outline">Loading...</Badge>
            ) : stats.citations.withCitations > 0 ? (
              <Badge variant="default" className="bg-green-600">
                {Math.round((stats.citations.withCitations / Math.max(stats.citations.total, 1)) * 100)}%
              </Badge>
            ) : (
              <Badge variant="outline">None</Badge>
            )}
          </div>
        </div>

        {/* Summary and Actions */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <p className="text-sm text-muted-foreground">
            {stats.figures.saved === 0 && stats.tables.saved === 0 && stats.chunks.saved === 0 ? (
              <span className="text-destructive font-medium">⚠️ No data extracted. Check console for errors.</span>
            ) : stats.citations.withCitations === 0 && stats.citations.total > 0 ? (
              <span className="text-yellow-600 font-medium">⚠️ Citations not detected. Auto-detection will run on new extractions.</span>
            ) : (
              <span className="text-green-600 font-medium">✓ Extraction working correctly</span>
            )}
          </p>

          {/* Re-extraction Button */}
          {onReextract && (stats.figures.saved === 0 || stats.tables.saved === 0) && (
            <div className="space-y-2">
              <Button
                onClick={handleReextract}
                disabled={isReextracting}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isReextracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {reextractProgress || 'Re-extracting...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-extract Figures & Tables
                  </>
                )}
              </Button>
              {isReextracting && reextractProgress && (
                <p className="text-xs text-muted-foreground text-center">
                  {reextractProgress}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
