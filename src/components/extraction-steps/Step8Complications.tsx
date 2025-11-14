import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Complication {
  id: string;
  name: string;
  overallRate: string;
  armData: Array<{ armId: string; rate: string }>;
}

interface Predictor {
  id: string;
  variable: string;
  outcome: string;
  statisticalMeasure: string;
}

interface StudyArm {
  id: string;
  name: string;
}

interface Step8ComplicationsProps {
  complications: Complication[];
  predictors: Predictor[];
  studyArms: StudyArm[];
  predictorsSummary: string;
  formData: any;
  addComplication: () => void;
  updateComplicationField: (id: string, field: string, value: string) => void;
  updateComplicationArmData: (compId: string, armId: string, value: string) => void;
  removeComplication: (id: string) => void;
  addPredictor: () => void;
  updatePredictor: (id: string, field: string, value: string) => void;
  removePredictor: (id: string) => void;
  handleFieldChange: (field: string, value: string) => void;
  onFieldFocus: (field: string | null) => void;
  activeField: string | null;
  disabled?: boolean;
}

export const Step8Complications = ({
  complications,
  predictors,
  studyArms,
  predictorsSummary,
  formData,
  addComplication,
  updateComplicationField,
  updateComplicationArmData,
  removeComplication,
  addPredictor,
  updatePredictor,
  removePredictor,
  handleFieldChange,
  onFieldFocus,
  activeField,
  disabled = false
}: Step8ComplicationsProps) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          formData: formData,
        }
      });

      if (error) throw error;

      if (data?.summary) {
        handleFieldChange('predictorsSummary', data.summary);
        toast({
          title: "Summary Generated",
          description: "AI has generated a comprehensive summary of key findings.",
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-base">Complications</h3>
      <div className="space-y-3">
        {complications.map((comp) => (
          <Card key={comp.id} className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Label>Complication Name</Label>
                  <Input
                    value={comp.name}
                    onChange={(e) => updateComplicationField(comp.id, "name", e.target.value)}
                    placeholder="e.g., Infection, Hemorrhage..."
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeComplication(comp.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Overall Rate</Label>
                <Input
                  value={comp.overallRate}
                  onChange={(e) => updateComplicationField(comp.id, "overallRate", e.target.value)}
                  placeholder="% or n/N"
                  disabled={disabled}
                />
              </div>
              {studyArms.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">By Study Arm</Label>
                  {comp.armData.map((armData) => {
                    const arm = studyArms.find(a => a.id === armData.armId);
                    return arm ? (
                      <div key={armData.armId} className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">{arm.name || "Unnamed Arm"}</span>
                        <Input
                          value={armData.rate}
                          onChange={(e) => updateComplicationArmData(comp.id, armData.armId, e.target.value)}
                          placeholder="% or n/N"
                          disabled={disabled}
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addComplication}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Complication
        </Button>
      </div>

      <h3 className="font-semibold text-base mt-6">Predictors of Outcome</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="predictorsSummary">Summary of Key Findings / Predictors</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={disabled || isGeneratingSummary}
            >
              {isGeneratingSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-2">Summarize Key Findings</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || !predictorsSummary}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Textarea
          id="predictorsSummary"
          value={predictorsSummary}
          onChange={(e) => handleFieldChange("predictorsSummary", e.target.value)}
          onFocus={() => onFieldFocus("predictorsSummary")}
          onBlur={() => onFieldFocus(null)}
          className={activeField === "predictorsSummary" ? "ring-2 ring-primary" : ""}
          rows={6}
          disabled={disabled}
        />
      </div>

      <h4 className="font-semibold text-sm mt-6">Predictor Analysis</h4>
      <div className="space-y-3">
        {predictors.map((pred) => (
          <Card key={pred.id} className="p-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={pred.variable}
                  onChange={(e) => updatePredictor(pred.id, "variable", e.target.value)}
                  placeholder="Predictor variable..."
                  className="flex-1"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removePredictor(pred.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={pred.outcome}
                onChange={(e) => updatePredictor(pred.id, "outcome", e.target.value)}
                placeholder="Associated outcome..."
                disabled={disabled}
              />
              <Input
                value={pred.statisticalMeasure}
                onChange={(e) => updatePredictor(pred.id, "statisticalMeasure", e.target.value)}
                placeholder="Statistical measure (OR, HR, p-value)..."
                disabled={disabled}
              />
            </div>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPredictor}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Predictor
        </Button>
      </div>
    </>
  );
};
