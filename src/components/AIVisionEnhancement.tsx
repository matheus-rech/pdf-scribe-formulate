import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIVisionEnhancementProps {
  imageData: string;
  onEnhancedData?: (data: any) => void;
}

export const AIVisionEnhancement = ({ imageData, onEnhancedData }: AIVisionEnhancementProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAIVisionAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      toast.info("AI is analyzing the image structure...", { duration: 2000 });

      const { data, error } = await supabase.functions.invoke("ai-table-vision", {
        body: {
          imageData,
          analysisType: "table",
        },
      });

      if (error) throw error;

      if (data.success && data.result) {
        setAnalysisResult(data.result);
        onEnhancedData?.(data.result);
        toast.success("AI vision analysis complete!");
      } else {
        throw new Error("Failed to parse AI response");
      }
    } catch (error) {
      console.error("AI vision error:", error);
      toast.error("AI vision analysis failed. Try again or use standard OCR.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">AI Vision Enhancement</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Use advanced AI vision to detect merged cells, complex table structures, and nested hierarchies
            </p>
            <Button
              onClick={handleAIVisionAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance with AI Vision
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {analysisResult && !analysisResult.parseError && (
        <Card className="p-4 border-success/20 bg-success/5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-2">AI Analysis Results</h3>
              
              <div className="space-y-2 text-xs">
                {analysisResult.headers && (
                  <div>
                    <span className="font-medium">Columns Detected:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {analysisResult.headers.length}
                    </Badge>
                  </div>
                )}

                {analysisResult.rows && (
                  <div>
                    <span className="font-medium">Rows Detected:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {analysisResult.rows.length}
                    </Badge>
                  </div>
                )}

                {analysisResult.mergedCells && analysisResult.mergedCells.length > 0 && (
                  <div>
                    <span className="font-medium">Merged Cells:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {analysisResult.mergedCells.length}
                    </Badge>
                  </div>
                )}

                {analysisResult.columnTypes && (
                  <div className="mt-2">
                    <div className="font-medium mb-1">Column Types:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(analysisResult.columnTypes).slice(0, 5).map(([col, type]: [string, any]) => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}: {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.notes && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                    <span className="font-medium">Notes:</span> {analysisResult.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {analysisResult && analysisResult.parseError && (
        <Card className="p-4 border-warning/20 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">AI Analysis Partial</h3>
              <p className="text-xs text-muted-foreground mb-2">
                AI provided insights but couldn't structure the data automatically
              </p>
              {analysisResult.rawResponse && (
                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32">
                  {analysisResult.rawResponse}
                </pre>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
