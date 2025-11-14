import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Settings2, Users, Target, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExtractionSettings {
  min_reviewers: number;
  max_reviewers: number;
  default_reviewers: number;
  high_concordance_threshold_even: number;
  high_concordance_threshold_odd: number;
  auto_accept_high_concordance: boolean;
}

interface ExtractionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExtractionSettingsDialog = ({ open, onOpenChange }: ExtractionSettingsDialogProps) => {
  const [settings, setSettings] = useState<ExtractionSettings>({
    min_reviewers: 2,
    max_reviewers: 8,
    default_reviewers: 3,
    high_concordance_threshold_even: 0.80,
    high_concordance_threshold_odd: 0.75,
    auto_accept_high_concordance: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [enabledReviewerCount, setEnabledReviewerCount] = useState(0);

  useEffect(() => {
    if (open) {
      loadSettings();
      loadReviewerCount();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('extraction_settings' as any)
        .select('*')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const settingsData = data as any;
        if (settingsData.min_reviewers !== undefined) {
          setSettings(settingsData);
        }
      }
    } catch (error) {
      console.error("Error loading extraction settings:", error);
      toast.error("Failed to load extraction settings");
    } finally {
      setLoading(false);
    }
  };

  const loadReviewerCount = async () => {
    const { data } = await supabase
      .from('reviewer_configs')
      .select('id', { count: 'exact' })
      .eq('enabled', true);
    
    setEnabledReviewerCount(data?.length || 0);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('extraction_settings' as any)
        .upsert([{ ...settings, user_id: user.id }]);

      if (error) throw error;

      toast.success("Extraction settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving extraction settings:", error);
      toast.error("Failed to save extraction settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof ExtractionSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const estimateTime = (reviewers: number) => Math.round(15 + (reviewers * 3));
  const estimateCost = (reviewers: number) => (0.05 + (reviewers * 0.04)).toFixed(2);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Extraction Settings
          </DialogTitle>
          <DialogDescription>
            Configure how multiple AI reviewers reach consensus on extracted data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reviewer Count Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Number of Reviewers
              </CardTitle>
              <CardDescription>
                Control how many AI reviewers analyze each extraction. More reviewers increase accuracy but take longer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Default Reviewers: {settings.default_reviewers}</Label>
                  <Badge variant="secondary">
                    {enabledReviewerCount} enabled
                  </Badge>
                </div>
                <Slider
                  value={[settings?.default_reviewers || 3]}
                  onValueChange={(v) => {
                    const val = Math.min(v[0] ?? 3, enabledReviewerCount || 7);
                    updateSetting('default_reviewers', val);
                  }}
                  min={settings?.min_reviewers || 1}
                  max={Math.min(settings?.max_reviewers || 7, enabledReviewerCount)}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: {settings.min_reviewers}</span>
                  <span>Max: {Math.min(settings.max_reviewers, enabledReviewerCount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Estimated Time</div>
                  <div className="text-2xl font-bold text-primary">
                    {estimateTime(settings.default_reviewers)}s
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Estimated Cost</div>
                  <div className="text-2xl font-bold text-primary">
                    ${estimateCost(settings.default_reviewers)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consensus Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Consensus Thresholds
              </CardTitle>
              <CardDescription>
                Set agreement levels required to auto-accept extractions without human review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Even Reviewers (2, 4, 6, 8)</Label>
                  <Badge>{Math.round((settings?.high_concordance_threshold_even || 0.8) * 100)}%</Badge>
                </div>
                <Slider
                  value={[(settings?.high_concordance_threshold_even || 0.8) * 100]}
                  onValueChange={(v) => {
                    if (settings && v[0] !== undefined) {
                      updateSetting('high_concordance_threshold_even', v[0] / 100);
                    }
                  }}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  With 4 reviewers at 80%, at least 3 must agree to auto-accept
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Odd Reviewers (3, 5, 7)</Label>
                  <Badge>{Math.round((settings?.high_concordance_threshold_odd || 0.66) * 100)}%</Badge>
                </div>
                <Slider
                  value={[(settings?.high_concordance_threshold_odd || 0.66) * 100]}
                  onValueChange={(v) => {
                    if (settings && v[0] !== undefined) {
                      updateSetting('high_concordance_threshold_odd', v[0] / 100);
                    }
                  }}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  With 3 reviewers at 75%, at least 2 must agree (≥66.7%) to auto-accept
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Consensus Strategy Explanation */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">When Human Review Is Required:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>2 reviewers disagree (always requires review)</li>
                  <li>Even reviewers: Agreement below {Math.round(settings.high_concordance_threshold_even * 100)}%</li>
                  <li>Odd reviewers: Agreement below {Math.round(settings.high_concordance_threshold_odd * 100)}%</li>
                  <li>Split vote with no clear majority</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
