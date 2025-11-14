import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PromptTemplate } from "@/types/ab-testing";

export const PromptTemplateManager = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);

  const [formData, setFormData] = useState({
    model_provider: "google" as "google" | "openai",
    template_name: "",
    system_prompt: "",
    extraction_prompt: "",
    field_specific_instructions: {} as Record<string, string>
  });

  const fieldTypes = [
    "population", "intervention", "comparator", "outcomes",
    "study_design", "sample_size", "duration", "setting",
    "results", "conclusions", "other"
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prompt_templates" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("model_provider", { ascending: true })
        .order("template_name", { ascending: true });

      if (error) throw error;
      setTemplates(((data as any[]) || []).map(item => ({
        ...item,
        field_specific_instructions: (item.field_specific_instructions as Record<string, string>) || {}
      })) as PromptTemplate[]);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!formData.template_name || !formData.system_prompt || !formData.extraction_prompt) {
        toast.error("Please fill in all required fields");
        return;
      }

      const templateData = {
        user_id: user.id,
        model_provider: formData.model_provider,
        template_name: formData.template_name,
        system_prompt: formData.system_prompt,
        extraction_prompt: formData.extraction_prompt,
        field_specific_instructions: formData.field_specific_instructions
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("prompt_templates" as any)
          .update(templateData)
          .eq("id", editingTemplate.id);
        if (error) throw error;
        toast.success("Template updated successfully");
      } else {
        const { error } = await supabase
          .from("prompt_templates" as any)
          .insert([templateData]);
        if (error) throw error;
        toast.success("Template created successfully");
      }

      setDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error(error.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("prompt_templates" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      model_provider: template.model_provider as "google" | "openai",
      template_name: template.template_name,
      system_prompt: template.system_prompt,
      extraction_prompt: template.extraction_prompt,
      field_specific_instructions: template.field_specific_instructions || {}
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      model_provider: "google",
      template_name: "",
      system_prompt: "",
      extraction_prompt: "",
      field_specific_instructions: {}
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prompt Templates</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit" : "Create"} Prompt Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Model Provider</Label>
                <Select
                  value={formData.model_provider}
                  onValueChange={(value: "google" | "openai") => 
                    setFormData(prev => ({ ...prev, model_provider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google (Gemini)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Template Name</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="e.g., Fast Extraction"
                />
              </div>

              <div>
                <Label>System Prompt</Label>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                  rows={4}
                  placeholder="Define the AI's role and behavior..."
                />
              </div>

              <div>
                <Label>Extraction Prompt</Label>
                <Textarea
                  value={formData.extraction_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, extraction_prompt: e.target.value }))}
                  rows={3}
                  placeholder="Main instruction for extraction..."
                />
              </div>

              <div>
                <Label>Field-Specific Instructions</Label>
                <div className="space-y-2 mt-2">
                  {fieldTypes.map(field => (
                    <div key={field}>
                      <Label className="text-xs text-muted-foreground capitalize">{field.replace(/_/g, ' ')}</Label>
                      <Input
                        value={formData.field_specific_instructions[field] || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          field_specific_instructions: {
                            ...prev.field_specific_instructions,
                            [field]: e.target.value
                          }
                        }))}
                        placeholder={`Instructions for ${field}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{template.template_name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {template.model_provider} • {template.is_default ? "Default" : "Custom"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!template.is_default && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">System: </span>
                  <span className="text-muted-foreground">{template.system_prompt.substring(0, 100)}...</span>
                </div>
                <div>
                  <span className="font-medium">Extraction: </span>
                  <span className="text-muted-foreground">{template.extraction_prompt.substring(0, 100)}...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};