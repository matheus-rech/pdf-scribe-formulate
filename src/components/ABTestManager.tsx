import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Play, Pause, Trophy, BarChart3 } from "lucide-react";
import { ABTestDialog } from "./ABTestDialog";
import { ABTestResults } from "./ABTestResults";

interface ABTest {
  id: string;
  name: string;
  description: string | null;
  status: string;
  field_types: string[];
  primary_metric: string;
  min_sample_size: number;
  started_at: string | null;
  completed_at: string | null;
  winner_variant: string | null;
  created_at: string;
}

export const ABTestManager = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ab_tests" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests((data as any) || []);
    } catch (error) {
      console.error("Error loading tests:", error);
      toast.error("Failed to load A/B tests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === "running" && !tests.find(t => t.id === testId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }
      
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("ab_tests" as any)
        .update(updates)
        .eq("id", testId);

      if (error) throw error;

      toast.success(`Test ${newStatus}`);
      loadTests();
    } catch (error) {
      console.error("Error updating test:", error);
      toast.error("Failed to update test");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "running": return "default";
      case "paused": return "outline";
      case "completed": return "secondary";
      case "winner_selected": return "default";
      default: return "secondary";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">A/B Tests</h2>
          <p className="text-muted-foreground">Optimize models and prompts with automated testing</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B tests yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first test to compare different models and prompts
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{test.name}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(test.status)}>
                    {test.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Metric: </span>
                      <span className="font-medium capitalize">{test.primary_metric}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fields: </span>
                      <span className="font-medium">{test.field_types.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Sample: </span>
                      <span className="font-medium">{test.min_sample_size}</span>
                    </div>
                  </div>

                  {test.winner_variant && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="font-medium">Winner: {test.winner_variant}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {test.status === "draft" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(test.id, "running")}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Test
                      </Button>
                    )}
                    {test.status === "running" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(test.id, "paused")}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {test.status === "paused" && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(test.id, "running")}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTest(test.id);
                        setResultsOpen(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ABTestDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={loadTests}
      />

      {selectedTest && (
        <ABTestResults
          testId={selectedTest}
          open={resultsOpen}
          onOpenChange={setResultsOpen}
        />
      )}
    </div>
  );
};