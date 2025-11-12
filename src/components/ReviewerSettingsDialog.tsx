import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Settings2, Sparkles, Zap, Clock } from "lucide-react";

interface ReviewerConfig {
  id: string;
  name: string;
  model: string;
  temperature: number;
  system_prompt: string;
  prompt_strategy: string;
  priority: number;
  enabled: boolean;
}

interface ReviewerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReviewerSettingsDialog = ({ open, onOpenChange }: ReviewerSettingsDialogProps) => {
  const [reviewers, setReviewers] = useState<ReviewerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      loadReviewers();
    }
  }, [open]);

  const loadReviewers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviewer_configs')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setReviewers(data || []);
    } catch (error) {
      console.error("Error loading reviewers:", error);
      toast.error("Failed to load reviewer configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviewer = (id: string, currentEnabled: boolean) => {
    const enabledCount = reviewers.filter(r => r.enabled).length;
    
    // Prevent disabling if only 2 reviewers remain enabled
    if (currentEnabled && enabledCount <= 2) {
      toast.error("At least 2 reviewers must remain enabled for consensus calculation");
      return;
    }

    setReviewers(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !currentEnabled } : r))
    );
    setHasChanges(true);
  };

  const handleTemperatureChange = (id: string, value: number[]) => {
    setReviewers(prev =>
      prev.map(r => (r.id === id ? { ...r, temperature: value[0] } : r))
    );
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const updates = reviewers.map(reviewer => ({
        id: reviewer.id,
        enabled: reviewer.enabled,
        temperature: reviewer.temperature,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('reviewer_configs')
          .update({ enabled: update.enabled, temperature: update.temperature })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success("Reviewer settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving reviewers:", error);
      toast.error("Failed to save reviewer settings");
    } finally {
      setSaving(false);
    }
  };

  const getModelBadgeColor = (model: string) => {
    if (model.includes('google')) return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
    if (model.includes('openai')) return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
    return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20';
  };

  const getStrategyIcon = (strategy: string) => {
    if (strategy.includes('speed') || strategy.includes('fast')) return <Zap className="w-3 h-3" />;
    if (strategy.includes('balanced')) return <Sparkles className="w-3 h-3" />;
    return <Settings2 className="w-3 h-3" />;
  };

  const enabledCount = reviewers.filter(r => r.enabled).length;
  const estimatedTime = enabledCount * 3; // Rough estimate: 3 seconds per reviewer

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            AI Reviewer Configuration
          </DialogTitle>
          <DialogDescription>
            Configure which AI models are used in Multi-AI Review and adjust their settings.
            At least 2 reviewers must be enabled for consensus calculation.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 my-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enabledCount} / {reviewers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Est. Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">~{estimatedTime}s</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Model Diversity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(reviewers.filter(r => r.enabled).map(r => r.model.split('/')[0])).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {enabledCount < 2 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: At least 2 reviewers must be enabled for meaningful consensus calculation.
            </AlertDescription>
          </Alert>
        )}

        {/* Reviewers List */}
        <div className="space-y-3">
          {reviewers.map((reviewer) => (
            <Card key={reviewer.id} className={!reviewer.enabled ? 'opacity-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{reviewer.name}</CardTitle>
                      <Badge variant="outline" className={getModelBadgeColor(reviewer.model)}>
                        {reviewer.model}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {getStrategyIcon(reviewer.prompt_strategy)}
                        {reviewer.prompt_strategy}
                      </Badge>
                      <Badge variant="secondary">
                        Priority {reviewer.priority}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs line-clamp-2">
                      {reviewer.system_prompt}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Label htmlFor={`reviewer-${reviewer.id}`} className="text-sm cursor-pointer">
                      {reviewer.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`reviewer-${reviewer.id}`}
                      checked={reviewer.enabled}
                      onCheckedChange={() => handleToggleReviewer(reviewer.id, reviewer.enabled)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              {reviewer.enabled && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        Temperature: {reviewer.temperature.toFixed(2)}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {reviewer.temperature < 0.3 ? 'Very Conservative' :
                         reviewer.temperature < 0.6 ? 'Balanced' :
                         reviewer.temperature < 0.9 ? 'Creative' : 'Very Creative'}
                      </span>
                    </div>
                    <Slider
                      value={[reviewer.temperature]}
                      onValueChange={(value) => handleTemperatureChange(reviewer.id, value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                      disabled={!reviewer.enabled}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              loadReviewers(); // Reset changes
              setHasChanges(false);
            }}
            disabled={!hasChanges || saving}
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveChanges} disabled={!hasChanges || saving || enabledCount < 2}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
