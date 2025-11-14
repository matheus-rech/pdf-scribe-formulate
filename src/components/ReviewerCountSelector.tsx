import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReviewerCountSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export const ReviewerCountSelector = ({ value, onChange }: ReviewerCountSelectorProps) => {
  const [enabledCount, setEnabledCount] = useState(0);
  const [settings, setSettings] = useState({
    min_reviewers: 2,
    max_reviewers: 8,
    default_reviewers: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get enabled reviewer count
    const { data: reviewers } = await supabase
      .from('reviewer_configs')
      .select('id', { count: 'exact' })
      .eq('enabled', true);
    
    setEnabledCount(reviewers?.length || 0);

    // Get user settings
    const { data: userSettings } = await supabase
      .from('extraction_settings')
      .select('*')
      .single();

    if (userSettings) {
      setSettings(userSettings);
    }
  };

  const estimateTime = (reviewers: number) => Math.round(15 + (reviewers * 3));
  const estimateCost = (reviewers: number) => (0.05 + (reviewers * 0.04)).toFixed(2);

  const maxAllowed = Math.min(settings.max_reviewers, enabledCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="reviewer-count" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Number of AI Reviewers
        </Label>
        <Badge variant="secondary">
          {enabledCount} enabled
        </Badge>
      </div>

      <Select 
        value={value.toString()} 
        onValueChange={(v) => onChange(parseInt(v))}
      >
        <SelectTrigger id="reviewer-count">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2 Reviewers - Fastest (requires agreement)</SelectItem>
          <SelectItem value="3">3 Reviewers - Balanced</SelectItem>
          {maxAllowed >= 4 && <SelectItem value="4">4 Reviewers - Good confidence</SelectItem>}
          {maxAllowed >= 5 && <SelectItem value="5">5 Reviewers - High confidence</SelectItem>}
          {maxAllowed >= 6 && <SelectItem value="6">6 Reviewers - Very high confidence</SelectItem>}
          {maxAllowed >= 7 && <SelectItem value="7">7 Reviewers - Near maximum</SelectItem>}
          {maxAllowed >= 8 && <SelectItem value="8">8 Reviewers - Maximum accuracy</SelectItem>}
        </SelectContent>
      </Select>

      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">~{estimateTime(value)}s</div>
                <div className="text-xs text-muted-foreground">Estimated time</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">${estimateCost(value)}</div>
                <div className="text-xs text-muted-foreground">Estimated cost</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {value === 2 && (
        <p className="text-xs text-muted-foreground">
          ⚠️ With 2 reviewers, any disagreement will require human review
        </p>
      )}
    </div>
  );
};
