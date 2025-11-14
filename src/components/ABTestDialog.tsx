import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ABTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const FIELD_TYPES = [
  "population", "intervention", "comparator", "outcomes",
  "study_design", "sample_size", "duration", "setting",
  "results", "conclusions", "other"
];

const MODELS = [
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano"
];

export const ABTestDialog = ({ open, onOpenChange, onSuccess }: ABTestDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    field_types: [] as string[],
    primary_metric: "accuracy",
    min_sample_size: 30,
    traffic_split: 0.5
  });

  const [variants, setVariants] = useState([
    { variant_name: "Control", model: "google/gemini-2.5-flash", is_control: true, template_id: null },
    { variant_name: "Variant A", model: "openai/gpt-5-mini", is_control: false, template_id: null }
  ]);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("prompt_templates")
      .select("id, template_name, model_provider");
    setTemplates(data || []);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.name || formData.field_types.length === 0) {
        toast.error("Please fill in required fields");
        return;
      }

      if (variants.length < 2) {
        toast.error("At least 2 variants required");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create test
      const { data: test, error: testError } = await supabase
        .from("ab_tests" as any)
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          field_types: formData.field_types,
          primary_metric: formData.primary_metric,
          min_sample_size: formData.min_sample_size,
          traffic_split: formData.traffic_split,
          status: "draft"
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create variants
      const variantsData = variants.map(v => ({
        test_id: (test as any).id,
        variant_name: v.variant_name,
        model: v.model,
        prompt_template_id: v.template_id,
        is_control: v.is_control,
        traffic_allocation: formData.traffic_split
      }));

      const { error: variantsError } = await supabase
        .from("ab_test_variants" as any)
        .insert(variantsData);

      if (variantsError) throw variantsError;

      toast.success("A/B test created successfully");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating test:", error);
      toast.error(error.message || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      field_types: [],
      primary_metric: "accuracy",
      min_sample_size: 30,
      traffic_split: 0.5
    });
    setVariants([
      { variant_name: "Control", model: "google/gemini-2.5-flash", is_control: true, template_id: null },
      { variant_name: "Variant A", model: "openai/gpt-5-mini", is_control: false, template_id: null }
    ]);
  };

  const addVariant = () => {
    setVariants([...variants, {
      variant_name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
      model: "google/gemini-2.5-flash",
      is_control: false,
      template_id: null
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Test Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., GPT-5 vs Gemini for Population Extraction"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What are you testing?"
                rows={3}
              />
            </div>

            <div>
              <Label>Field Types to Test *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {FIELD_TYPES.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={formData.field_types.includes(field)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, field_types: [...prev.field_types, field] }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            field_types: prev.field_types.filter(f => f !== field) 
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={field} className="text-sm capitalize cursor-pointer">
                      {field.replace(/_/g, " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric">Primary Metric</Label>
                <Select
                  value={formData.primary_metric}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, primary_metric: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="confidence">Confidence</SelectItem>
                    <SelectItem value="speed">Speed</SelectItem>
                    <SelectItem value="agreement_rate">Agreement Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sample_size">Min Sample Size</Label>
                <Input
                  id="sample_size"
                  type="number"
                  min="10"
                  value={formData.min_sample_size}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_sample_size: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Test Variants</Label>
              <Button size="sm" variant="outline" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Input
                    value={variant.variant_name}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].variant_name = e.target.value;
                      setVariants(newVariants);
                    }}
                    placeholder="Variant name"
                    className="w-1/3"
                  />
                  {!variant.is_control && variants.length > 2 && (
                    <Button size="sm" variant="ghost" onClick={() => removeVariant(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Model</Label>
                    <Select
                      value={variant.model}
                      onValueChange={(value) => {
                        const newVariants = [...variants];
                        newVariants[index].model = value;
                        setVariants(newVariants);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Prompt Template (Optional)</Label>
                    <Select
                      value={variant.template_id || "none"}
                      onValueChange={(value) => {
                        const newVariants = [...variants];
                        newVariants[index].template_id = value === "none" ? null : value;
                        setVariants(newVariants);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Default</SelectItem>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.template_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Test
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};