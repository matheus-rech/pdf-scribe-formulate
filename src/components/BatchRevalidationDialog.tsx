import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { 
  batchRevalidateCitations, 
  getRevalidationRecommendations, 
  type RevalidationProgress, 
  type RevalidationResult,
  type ExtractionEntry 
} from "@/lib/citationRevalidation";
import { toast } from "sonner";

interface BatchRevalidationDialogProps {
  extractions: ExtractionEntry[];
  onUpdateExtractions: (updated: ExtractionEntry[]) => void;
}

export const BatchRevalidationDialog = ({
  extractions,
  onUpdateExtractions
}: BatchRevalidationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<RevalidationProgress>({
    total: 0,
    current: 0,
    percentage: 0,
    currentField: '',
    status: 'idle',
    errors: []
  });
  const [result, setResult] = useState<RevalidationResult | null>(null);
  
  const recommendations = getRevalidationRecommendations(extractions);
  
  const handleStartRevalidation = async () => {
    setProgress({
      total: recommendations.targetedExtractions.length,
      current: 0,
      percentage: 0,
      currentField: '',
      status: 'running',
      errors: []
    });
    
    try {
      const revalidationResult = await batchRevalidateCitations(
        recommendations.targetedExtractions,
        setProgress
      );
      
      setResult(revalidationResult);
      
      onUpdateExtractions(revalidationResult.updatedExtractions);
      
      toast.success(
        `Revalidation complete: ${revalidationResult.updated} updated, ${revalidationResult.unchanged} unchanged`
      );
    } catch (error) {
      console.error('Batch revalidation error:', error);
      toast.error('Revalidation failed');
      setProgress(prev => ({ ...prev, status: 'error' }));
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Re-validate Citations
          {recommendations.shouldRevalidate && (
            <Badge variant="destructive" className="ml-2">
              {recommendations.targetedExtractions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Batch Citation Re-validation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {progress.status === 'idle' && (
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-2">Analysis Summary</div>
                  {recommendations.shouldRevalidate ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span>{recommendations.targetedExtractions.length} extractions need re-validation</span>
                      </div>
                      <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                        {recommendations.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>All citations are up to date</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {recommendations.shouldRevalidate && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-2">
                      Re-validation will:
                    </div>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>✓ Update confidence scores using AI validation</li>
                      <li>✓ Identify new potential issues</li>
                      <li>✓ Verify citation accuracy</li>
                      <li>✓ Take approximately {Math.ceil(recommendations.targetedExtractions.length * 0.5)} seconds</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {progress.status === 'running' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Validating citations...</span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Processing {progress.current} of {progress.total}: {progress.currentField}
              </div>
              {progress.errors.length > 0 && (
                <Card className="border-yellow-500">
                  <CardContent className="p-3">
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      {progress.errors.map((err, idx) => (
                        <div key={idx}>⚠ {err}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {result && progress.status === 'completed' && (
            <div className="space-y-3">
              <Card className="border-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Re-validation Complete</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{result.updated}</div>
                      <div className="text-xs text-muted-foreground">Updated</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{result.unchanged}</div>
                      <div className="text-xs text-muted-foreground">Unchanged</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </div>
                  </div>
                  
                  {result.avgConfidenceChange !== 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        Average confidence change: {result.avgConfidenceChange > 0 ? '+' : ''}
                        {(result.avgConfidenceChange * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {progress.status === 'idle' && recommendations.shouldRevalidate && (
            <Button onClick={handleStartRevalidation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Re-validation
            </Button>
          )}
          
          {progress.status === 'running' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </Button>
          )}
          
          {progress.status === 'completed' && (
            <Button onClick={() => setIsOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
