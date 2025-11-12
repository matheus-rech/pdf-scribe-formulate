import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, XCircle, Sparkles, Loader2, Info } from "lucide-react";
import { validateTableData, formatValidationIssue, detectColumnTypes, type ValidationResult } from "@/lib/dataValidation";
import type { ParsedTable } from "@/lib/tableParser";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DataValidationViewProps {
  table: ParsedTable;
  imageData?: string;
}

export const DataValidationView = ({ table, imageData }: DataValidationViewProps) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [aiValidation, setAiValidation] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const columnTypes = detectColumnTypes(table);

  useEffect(() => {
    // Run automatic validation
    const result = validateTableData(table);
    setValidation(result);
  }, [table]);

  const handleAIValidation = async () => {
    if (!imageData) {
      toast.error("Image data required for AI validation");
      return;
    }

    setIsLoadingAI(true);
    try {
      toast.info("AI is validating the data...", { duration: 2000 });

      const { data, error } = await supabase.functions.invoke("ai-table-vision", {
        body: {
          imageData,
          analysisType: "validation",
        },
      });

      if (error) throw error;

      if (data.success && data.result) {
        setAiValidation(data.result);
        toast.success("AI validation complete!");
      } else {
        throw new Error("Failed to get AI validation");
      }
    } catch (error) {
      console.error("AI validation error:", error);
      toast.error("AI validation failed. Try again later.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!validation) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation Summary */}
      <Card className={`p-4 border-2 ${validation.isValid ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"}`}>
        <div className="flex items-start gap-3">
          {validation.isValid ? (
            <CheckCircle2 className="h-6 w-6 text-success mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-warning mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Data Validation Report</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-xs">
                <div className="text-muted-foreground">Validation Rate</div>
                <div className="text-lg font-semibold">
                  {validation.statistics.validationRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Valid Cells</div>
                <div className="text-lg font-semibold text-success">
                  {validation.statistics.validCells}
                </div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Errors</div>
                <div className="text-lg font-semibold text-destructive">
                  {validation.errors.length}
                </div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Warnings</div>
                <div className="text-lg font-semibold text-warning">
                  {validation.warnings.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Enhancement */}
      {imageData && !aiValidation && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm mb-1">Enhance with AI Validation</h3>
              <p className="text-xs text-muted-foreground">
                Get deeper insights and contextual validation from AI
              </p>
            </div>
            <Button
              onClick={handleAIValidation}
              disabled={isLoadingAI}
              size="sm"
              className="gap-2"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Validate
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* AI Validation Results */}
      {aiValidation && (
        <Card className="p-4 border-primary/20 bg-primary/5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Validation Insights
          </h3>
          {aiValidation.dataQuality && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-xs">
                <div className="text-muted-foreground">Completeness</div>
                <div className="font-semibold">{aiValidation.dataQuality.completeness}%</div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Consistency</div>
                <div className="font-semibold">{aiValidation.dataQuality.consistency}%</div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Accuracy</div>
                <div className="font-semibold">{aiValidation.dataQuality.accuracy}%</div>
              </div>
            </div>
          )}
          {aiValidation.suggestions && aiValidation.suggestions.length > 0 && (
            <div className="text-xs space-y-1">
              <div className="font-medium">AI Suggestions:</div>
              {aiValidation.suggestions.slice(0, 3).map((suggestion: string, i: number) => (
                <div key={i} className="text-muted-foreground pl-2">
                  • {suggestion}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Column Types */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">Detected Column Types</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(columnTypes).map(([column, type]) => (
            <Badge key={column} variant="outline" className="text-xs">
              {column}: {type}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Issues List */}
      <Accordion type="single" collapsible className="w-full">
        {validation.errors.length > 0 && (
          <AccordionItem value="errors">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Errors ({validation.errors.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {validation.errors.map((error, index) => (
                    <Card key={index} className="p-3 border-destructive/20 bg-destructive/5">
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1 text-xs">
                          <div className="font-medium mb-1">
                            Row {error.row + 1}, {error.field}
                          </div>
                          <div className="text-muted-foreground">{error.issue}</div>
                          {error.suggestedFix && (
                            <div className="mt-1 text-primary">💡 {error.suggestedFix}</div>
                          )}
                        </div>
                        <Badge variant={getSeverityColor(error.severity as any)} className="text-xs">
                          {error.severity}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}

        {validation.warnings.length > 0 && (
          <AccordionItem value="warnings">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Warnings ({validation.warnings.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {validation.warnings.map((warning, index) => (
                    <Card key={index} className="p-3 border-warning/20 bg-warning/5">
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(warning.severity)}
                        <div className="flex-1 text-xs">
                          <div className="font-medium mb-1">
                            Row {warning.row + 1}, {warning.field}
                          </div>
                          <div className="text-muted-foreground">{warning.issue}</div>
                          {warning.suggestedFix && (
                            <div className="mt-1 text-primary">💡 {warning.suggestedFix}</div>
                          )}
                        </div>
                        <Badge variant={getSeverityColor(warning.severity as any)} className="text-xs">
                          {warning.severity}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
