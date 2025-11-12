import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Clock, FileText, User } from "lucide-react";
import { AIReviewComparison } from "./AIReviewComparison";
import { ConsensusIndicator } from "./ConsensusIndicator";
import { toast } from "@/hooks/use-toast";

interface ConflictItem {
  id: string;
  extraction_id: string;
  field_name: string;
  consensus_value: string;
  agreement_level: number;
  total_reviewers: number;
  agreeing_reviewers: number;
  conflict_types: string[];
  human_review_status: string;
  created_at: string;
}

interface ConflictResolutionDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyId?: string;
}

export const ConflictResolutionDashboard = ({ open, onOpenChange }: ConflictResolutionDashboardProps) => {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvedValue, setResolvedValue] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    loadConflicts();
  }, [activeTab]);

  const loadConflicts = async () => {
    const statusFilter = activeTab === "pending" ? "pending" : 
                        activeTab === "in_progress" ? "in_progress" : "resolved";

    const { data, error } = await supabase
      .from('extraction_consensus')
      .select('*')
      .eq('requires_human_review', true)
      .eq('human_review_status', statusFilter)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading conflicts:', error);
      toast({ title: "Error loading conflicts", variant: "destructive" });
      return;
    }

    setConflicts(data || []);
  };

  const loadReviews = async (extractionId: string, fieldName: string) => {
    const { data, error } = await supabase
      .from('ai_reviews')
      .select(`
        *,
        reviewer_configs (name, model)
      `)
      .eq('extraction_id', extractionId)
      .like('field_name', `%${fieldName}%`);

    if (error) {
      console.error('Error loading reviews:', error);
      return;
    }

    setReviews(data || []);
  };

  const handleSelectConflict = async (conflict: ConflictItem) => {
    setSelectedConflict(conflict);
    setResolvedValue(conflict.consensus_value || "");
    await loadReviews(conflict.extraction_id, conflict.field_name);
    
    // Mark as in progress
    if (conflict.human_review_status === 'pending') {
      await supabase
        .from('extraction_consensus')
        .update({ human_review_status: 'in_progress' })
        .eq('id', conflict.id);
    }
  };

  const handleResolve = async (action: 'accept_consensus' | 'custom' | 'escalate') => {
    if (!selectedConflict) return;

    setIsResolving(true);

    try {
      const updates: any = {
        human_review_status: action === 'escalate' ? 'escalated' : 'resolved',
        human_resolved_at: new Date().toISOString(),
        human_resolution_notes: resolutionNotes
      };

      if (action === 'accept_consensus') {
        updates.human_resolved_value = selectedConflict.consensus_value;
      } else if (action === 'custom') {
        updates.human_resolved_value = resolvedValue;
      }

      const { error } = await supabase
        .from('extraction_consensus')
        .update(updates)
        .eq('id', selectedConflict.id);

      if (error) throw error;

      toast({ title: "Conflict resolved successfully" });
      setSelectedConflict(null);
      setResolutionNotes("");
      setResolvedValue("");
      loadConflicts();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({ title: "Error resolving conflict", variant: "destructive" });
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityBadge = (agreementLevel: number) => {
    if (agreementLevel < 50) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />High</Badge>;
    }
    if (agreementLevel < 70) {
      return <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-600"><AlertTriangle className="w-3 h-3" />Medium</Badge>;
    }
    return <Badge variant="outline" className="gap-1 border-yellow-500/50 text-yellow-600"><AlertTriangle className="w-3 h-3" />Low</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            AI Review Conflict Resolution
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardDescription>
                Review and resolve extraction conflicts flagged by AI reviewers
              </CardDescription>
            </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pending ({conflicts.filter(c => c.human_review_status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-2">
                <User className="w-4 h-4" />
                In Progress
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Resolved
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Conflict Queue */}
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {conflicts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No conflicts to review
                      </p>
                    ) : (
                      conflicts.map((conflict) => (
                        <Card
                          key={conflict.id}
                          className={`cursor-pointer transition-all ${
                            selectedConflict?.id === conflict.id
                              ? 'border-primary shadow-sm'
                              : 'hover:border-muted-foreground/20'
                          }`}
                          onClick={() => handleSelectConflict(conflict)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="gap-1">
                                <FileText className="w-3 h-3" />
                                {conflict.field_name}
                              </Badge>
                              {getSeverityBadge(conflict.agreement_level)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <ConsensusIndicator
                              agreementLevel={conflict.agreement_level}
                              totalReviewers={conflict.total_reviewers}
                              agreeingReviewers={conflict.agreeing_reviewers}
                              hasConflict={true}
                            />
                            {conflict.conflict_types && conflict.conflict_types.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {conflict.conflict_types.map((type, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {type.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(conflict.created_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Resolution Interface */}
                <div className="space-y-4">
                  {selectedConflict ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Resolution Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Resolved Value:
                            </label>
                            <Textarea
                              value={resolvedValue}
                              onChange={(e) => setResolvedValue(e.target.value)}
                              placeholder="Enter the correct value..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Resolution Notes:
                            </label>
                            <Textarea
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Document your decision..."
                              className="min-h-[80px]"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleResolve('accept_consensus')}
                              disabled={isResolving}
                              variant="default"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept Consensus Value
                            </Button>
                            <Button
                              onClick={() => handleResolve('custom')}
                              disabled={isResolving || !resolvedValue}
                              variant="outline"
                            >
                              Use Custom Value
                            </Button>
                            <Button
                              onClick={() => handleResolve('escalate')}
                              disabled={isResolving}
                              variant="destructive"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Escalate for Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI Review Comparison */}
                      {reviews.length > 0 && (
                        <AIReviewComparison
                          reviews={reviews.map(r => ({
                            reviewerId: r.reviewer_config_id,
                            reviewerName: r.reviewer_configs?.name || 'Unknown',
                            data: JSON.parse(r.extracted_value || '{}'),
                            confidence: r.confidence_score,
                            reasoning: r.reasoning,
                            processingTime: r.processing_time_ms
                          }))}
                          consensus={{
                            [selectedConflict.field_name]: {
                              value: selectedConflict.consensus_value,
                              agreementLevel: selectedConflict.agreement_level,
                              agreeingCount: selectedConflict.agreeing_reviewers,
                              totalCount: selectedConflict.total_reviewers,
                              hasConflict: true
                            }
                          }}
                          fieldName={selectedConflict.field_name}
                        />
                      )}
                    </>
                  ) : (
                    <Card className="h-full flex items-center justify-center">
                      <CardContent className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Select a conflict from the queue to begin review
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
      </DialogContent>
    </Dialog>
  );
};
