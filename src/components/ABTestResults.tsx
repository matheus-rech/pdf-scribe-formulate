import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import type { ABTest, ABTestVariant, ABTestStats } from "@/types/ab-testing";

interface ABTestResultsProps {
  testId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ABTestResults = ({ testId, open, onOpenChange }: ABTestResultsProps) => {
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<ABTest | null>(null);
  const [variants, setVariants] = useState<ABTestVariant[]>([]);
  const [stats, setStats] = useState<ABTestStats[]>([]);
  const [significance, setSignificance] = useState<any[]>([]);

  useEffect(() => {
    if (open && testId) {
      loadResults();
    }
  }, [open, testId]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Load test details
      const { data: testData } = await supabase
        .from("ab_tests" as any)
        .select("*")
        .eq("id", testId)
        .single();

      setTest((testData as any) as ABTest | null);

      // Load variants
      const { data: variantsData } = await supabase
        .from("ab_test_variants" as any)
        .select("*")
        .eq("test_id", testId);

      setVariants(((variantsData as any[]) || []) as ABTestVariant[]);

      // Load stats
      const { data: statsData } = await supabase
        .from("ab_test_stats" as any)
        .select("*")
        .eq("test_id", testId);

      setStats(((statsData as any[]) || []) as ABTestStats[]);

      // Calculate significance
      try {
        const { data: sigData } = await (supabase as any)
          .rpc("calculate_ab_test_significance", { p_test_id: testId });

        setSignificance(sigData || []);
      } catch (sigError) {
        console.error("Error calculating significance:", sigError);
      }
    } catch (error) {
      console.error("Error loading results:", error);
      toast.error("Failed to load test results");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async (variantName: string) => {
    try {
      const { error } = await supabase
        .from("ab_tests" as any)
        .update({
          winner_variant: variantName,
          status: "winner_selected",
          completed_at: new Date().toISOString()
        })
        .eq("id", testId);

      if (error) throw error;

      toast.success(`${variantName} selected as winner`);
      loadResults();
    } catch (error) {
      console.error("Error selecting winner:", error);
      toast.error("Failed to select winner");
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getVariantStats = (variantId: string): ABTestStats => {
    return stats.find(s => s.variant_id === variantId) || {
      id: '',
      test_id: testId,
      variant_id: variantId,
      sample_size: 0,
      accuracy_rate: 0,
      avg_confidence: 0,
      avg_processing_time_ms: 0,
      avg_cost: 0,
      agreement_rate: 0,
      statistical_significance: 0,
      is_significant: false,
      updated_at: new Date().toISOString()
    };
  };

  const getVariantSignificance = (variantId: string): any => {
    return significance.find(s => s.variant_id === variantId) || {};
  };

  const controlVariant = variants.find(v => v.is_control);
  const controlStats = controlVariant ? getVariantStats(controlVariant.id) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {test?.name} - Results
            {test?.winner_variant && (
              <Badge className="ml-2" variant="default">
                <Trophy className="h-3 w-3 mr-1" />
                Winner: {test.winner_variant}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sample Size Progress</span>
                  <span className="font-medium">
                    {Math.max(...stats.map(s => s.sample_size || 0))} / {test?.min_sample_size}
                  </span>
                </div>
                <Progress 
                  value={(Math.max(...stats.map(s => s.sample_size || 0)) / (test?.min_sample_size || 1)) * 100}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variants Comparison */}
          <div className="grid gap-4">
            {variants.map((variant) => {
              const variantStats = getVariantStats(variant.id);
              const variantSig = getVariantSignificance(variant.id);
              const isWinner = test?.winner_variant === variant.variant_name;
              const improvementVsControl = controlStats && variantStats.accuracy_rate && controlStats.accuracy_rate
                ? ((variantStats.accuracy_rate - controlStats.accuracy_rate) / controlStats.accuracy_rate * 100)
                : 0;

              return (
                <Card key={variant.id} className={isWinner ? "border-primary border-2" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {variant.variant_name}
                          {variant.is_control && <Badge variant="outline">Control</Badge>}
                          {isWinner && (
                            <Badge variant="default">
                              <Trophy className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{variant.model}</p>
                      </div>
                      {!isWinner && test?.status === "running" && variantStats.sample_size >= test?.min_sample_size && (
                        <Button size="sm" onClick={() => handleSelectWinner(variant.variant_name)}>
                          Select Winner
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Sample Size</div>
                        <div className="text-2xl font-bold">{variantStats.sample_size || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                        <div className="text-2xl font-bold">
                          {variantStats.accuracy_rate ? (variantStats.accuracy_rate * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Confidence</div>
                        <div className="text-2xl font-bold">
                          {variantStats.avg_confidence ? (variantStats.avg_confidence * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                        <div className="text-2xl font-bold">
                          {variantStats.avg_processing_time_ms || 0}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">vs Control</div>
                        <div className="text-2xl font-bold flex items-center gap-1">
                          {!variant.is_control && improvementVsControl !== 0 && (
                            <>
                              {improvementVsControl > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={improvementVsControl > 0 ? "text-green-500" : "text-red-500"}>
                                {improvementVsControl > 0 ? "+" : ""}{improvementVsControl.toFixed(1)}%
                              </span>
                            </>
                          )}
                          {variant.is_control && <span className="text-muted-foreground">-</span>}
                        </div>
                      </div>
                    </div>

                    {!variant.is_control && variantSig.is_significant !== undefined && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span>Statistical Significance:</span>
                          <Badge variant={variantSig.is_significant ? "default" : "secondary"}>
                            {variantSig.is_significant ? "Significant" : "Not Yet Significant"}
                          </Badge>
                        </div>
                        {variantSig.p_value !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            p-value: {parseFloat(variantSig.p_value).toFixed(4)}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};