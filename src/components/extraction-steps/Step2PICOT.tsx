import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Check, Loader2, AlertTriangle } from "lucide-react";
import { InputWithHints } from "@/components/InputWithHints";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step2Props {
  formData: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onFieldFocus: (field: string | null) => void;
  pdfText?: string;
  studyId?: string;
}

export const Step2PICOT = ({ formData, onUpdate, onFieldFocus, pdfText, studyId }: Step2Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [validatingField, setValidatingField] = useState<string | null>(null);

  const handleGeneratePICO = async () => {
    if (!pdfText) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-picot', {
        body: { pdfText, studyId }
      });

      if (error) throw error;

      if (data?.picot) {
        onUpdate({
          population: data.picot.population || '',
          intervention: data.picot.intervention || '',
          comparator: data.picot.comparator || '',
          outcomes: data.picot.outcomes || '',
          timing: data.picot.timing || '',
          studyType: data.picot.studyType || ''
        });
        toast.success("PICO-T generated successfully!");
      }
    } catch (error: any) {
      console.error("PICO generation error:", error);
      toast.error(error.message || "Failed to generate PICO-T");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidateField = async (fieldName: string) => {
    const fieldValue = formData[fieldName];
    if (!fieldValue || !pdfText) {
      toast.error("Field is empty or PDF not loaded");
      return;
    }

    setValidatingField(fieldName);
    try {
      const { data, error } = await supabase.functions.invoke('validate-extraction', {
        body: { fieldName, fieldValue, pdfText }
      });

      if (error) throw error;

      if (data?.valid) {
        toast.success(`${fieldName} validated successfully!`);
      } else {
        toast.warning(`${fieldName} validation: ${data?.message || 'Check the extracted value'}`);
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      toast.error(error.message || "Failed to validate field");
    } finally {
      setValidatingField(null);
    }
  };

  const inclusionMet = formData["inclusion-met"];
  const showStopWarning = inclusionMet === "false";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Step 2: PICO-T</h2>

      {/* AI Generate Button */}
      <Button 
        type="button" 
        onClick={handleGeneratePICO}
        disabled={isGenerating}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" /> Generate PICO-T Summary</>
        )}
      </Button>

      {/* Population */}
      <div className="space-y-2">
        <Label htmlFor="population">Population</Label>
        <div className="flex gap-2">
          <Textarea
            id="population"
            value={formData.population || ''}
            onChange={(e) => onUpdate({ population: e.target.value })}
            onFocus={() => onFieldFocus('population')}
            onBlur={() => onFieldFocus(null)}
            className="flex-1"
            rows={3}
          />
          <Button
            type="button"
            onClick={() => handleValidateField('population')}
            disabled={validatingField === 'population'}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {validatingField === 'population' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Intervention */}
      <div className="space-y-2">
        <Label htmlFor="intervention">Intervention</Label>
        <div className="flex gap-2">
          <Textarea
            id="intervention"
            value={formData.intervention || ''}
            onChange={(e) => onUpdate({ intervention: e.target.value })}
            onFocus={() => onFieldFocus('intervention')}
            onBlur={() => onFieldFocus(null)}
            className="flex-1"
            rows={3}
          />
          <Button
            type="button"
            onClick={() => handleValidateField('intervention')}
            disabled={validatingField === 'intervention'}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {validatingField === 'intervention' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Comparator */}
      <div className="space-y-2">
        <Label htmlFor="comparator">Comparator</Label>
        <div className="flex gap-2">
          <Textarea
            id="comparator"
            value={formData.comparator || ''}
            onChange={(e) => onUpdate({ comparator: e.target.value })}
            onFocus={() => onFieldFocus('comparator')}
            onBlur={() => onFieldFocus(null)}
            className="flex-1"
            rows={3}
          />
          <Button
            type="button"
            onClick={() => handleValidateField('comparator')}
            disabled={validatingField === 'comparator'}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {validatingField === 'comparator' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Outcomes */}
      <div className="space-y-2">
        <Label htmlFor="outcomes">Outcomes Measured</Label>
        <div className="flex gap-2">
          <Textarea
            id="outcomes"
            value={formData.outcomes || ''}
            onChange={(e) => onUpdate({ outcomes: e.target.value })}
            onFocus={() => onFieldFocus('outcomes')}
            onBlur={() => onFieldFocus(null)}
            className="flex-1"
            rows={3}
          />
          <Button
            type="button"
            onClick={() => handleValidateField('outcomes')}
            disabled={validatingField === 'outcomes'}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {validatingField === 'outcomes' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Timing & Study Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timing">Timing/Follow-up</Label>
          <div className="flex gap-2">
            <Input
              id="timing"
              value={formData.timing || ''}
              onChange={(e) => onUpdate({ timing: e.target.value })}
              onFocus={() => onFieldFocus('timing')}
              onBlur={() => onFieldFocus(null)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => handleValidateField('timing')}
              disabled={validatingField === 'timing'}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {validatingField === 'timing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="studyType">Study Type (e.g., RCT, Cohort)</Label>
          <div className="flex gap-2">
            <Input
              id="studyType"
              value={formData.studyType || ''}
              onChange={(e) => onUpdate({ studyType: e.target.value })}
              onFocus={() => onFieldFocus('studyType')}
              onBlur={() => onFieldFocus(null)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => handleValidateField('studyType')}
              disabled={validatingField === 'studyType'}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {validatingField === 'studyType' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Inclusion Criteria Met (CRITICAL) */}
      <div className="space-y-2">
        <Label htmlFor="inclusion-met">Inclusion Criteria Met?</Label>
        <Select
          value={formData["inclusion-met"] || ''}
          onValueChange={(value) => onUpdate({ "inclusion-met": value })}
        >
          <SelectTrigger id="inclusion-met">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Select...</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No (Stop Extraction)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Warning when inclusion not met */}
      {showStopWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Extraction Stopped:</strong> Inclusion criteria not met. Subsequent steps are disabled.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
