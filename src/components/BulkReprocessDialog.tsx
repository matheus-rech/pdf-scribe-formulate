import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface BulkReprocessProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  results: {
    studyId: string;
    studyName: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
  }[];
}

interface BulkReprocessDialogProps {
  open: boolean;
  progress: BulkReprocessProgress;
  onClose: () => void;
  isComplete: boolean;
}

export function BulkReprocessDialog({ open, progress, onClose, isComplete }: BulkReprocessDialogProps) {
  const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const successCount = progress.completed - progress.failed;

  return (
    <Dialog open={open} onOpenChange={isComplete ? onClose : undefined}>
      <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => !isComplete && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!isComplete ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Bulk Reprocessing Studies
              </>
            ) : (
              <>
                {progress.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                Reprocessing Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {!isComplete ? (
              `Processing ${progress.completed} of ${progress.total} studies...`
            ) : (
              `Successfully processed ${successCount} of ${progress.total} studies${progress.failed > 0 ? `, ${progress.failed} failed` : ''}`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Current Processing */}
          {progress.current && !isComplete && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">Currently Processing:</p>
              <p className="text-sm text-muted-foreground mt-1">{progress.current}</p>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Processing Results:</p>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {progress.results.map((result) => (
                  <div
                    key={result.studyId}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {result.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {result.status === 'error' && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      {result.status === 'processing' && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {result.status === 'pending' && (
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.studyName}</p>
                      {result.error && (
                        <p className="text-xs text-destructive mt-1">{result.error}</p>
                      )}
                      {result.status === 'success' && (
                        <p className="text-xs text-green-600 mt-1">Successfully reprocessed</p>
                      )}
                      {result.status === 'processing' && (
                        <p className="text-xs text-muted-foreground mt-1">Processing...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Summary Stats */}
          {isComplete && (
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">{successCount} Successful</span>
              </div>
              {progress.failed > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">{progress.failed} Failed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isComplete && (
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
