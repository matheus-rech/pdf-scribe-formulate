import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ValidationSummary {
  total: number;
  valid: number;
  questionable: number;
  invalid: number;
  avgConfidence: number;
}

interface ValidationResult {
  extraction_id: string;
  field_name: string;
  isValid: boolean;
  confidence: number;
  matchType: string;
  reasoning: string;
}

interface BatchCitationValidationDialogProps {
  studyId?: string;
  extractionIds?: string[];
  onValidationComplete?: () => void;
}

export function BatchCitationValidationDialog({
  studyId,
  extractionIds,
  onValidationComplete,
}: BatchCitationValidationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [results, setResults] = useState<ValidationResult[]>([]);

  const handleValidate = async () => {
    if (!studyId && (!extractionIds || extractionIds.length === 0)) {
      toast.error("No extractions to validate");
      return;
    }

    setIsValidating(true);
    setProgress(0);
    setSummary(null);
    setResults([]);

    try {
      toast.info("Starting citation validation...");

      const { data, error } = await supabase.functions.invoke(
        "validate-citations-batch",
        {
          body: { studyId, extractionIds },
        }
      );

      if (error) throw error;

      if (data.success) {
        setSummary(data.summary);
        setResults(data.results);
        setProgress(100);

        toast.success(
          `Validated ${data.validated} citations! Average confidence: ${data.summary.avgConfidence.toFixed(1)}%`
        );

        if (onValidationComplete) {
          onValidationComplete();
        }
      } else {
        throw new Error(data.error || "Validation failed");
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      toast.error(`Validation failed: ${error.message}`);
      setProgress(0);
    } finally {
      setIsValidating(false);
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case "exact":
        return "text-green-600";
      case "paraphrase":
        return "text-blue-600";
      case "semantic":
        return "text-purple-600";
      case "weak":
        return "text-orange-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Validate Citations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Batch Citation Validation
          </DialogTitle>
          <DialogDescription>
            AI-powered validation of extraction citations against source text
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!summary && !isValidating && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                This will validate all extractions with citations and update their confidence
                scores based on how well they match the source text.
              </p>
              <Button onClick={handleValidate} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Start Validation
              </Button>
            </div>
          )}

          {isValidating && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Validating citations...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {summary && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {summary.valid}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-2xl font-bold text-yellow-600">
                        {summary.questionable}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Questionable</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">
                        {summary.invalid}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Invalid</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        {summary.avgConfidence.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </CardContent>
                </Card>
              </div>

              {results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Validation Results</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {results.map((result) => (
                      <Card key={result.extraction_id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {result.field_name}
                              </Badge>
                              <Badge
                                variant={result.isValid ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {result.confidence}% confidence
                              </Badge>
                            </div>
                            <p
                              className={`text-xs font-medium ${getMatchTypeColor(
                                result.matchType
                              )}`}
                            >
                              {result.matchType.toUpperCase()} match
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.reasoning}
                            </p>
                          </div>
                          {result.isValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setSummary(null);
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full"
              >
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
