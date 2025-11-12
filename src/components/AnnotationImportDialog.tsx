import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, CheckCircle2, AlertCircle, Sparkles, Import, Upload } from "lucide-react";
import type { PDFAnnotation, AnnotationImportResult } from "@/lib/annotationParser";
import { getAnnotationColor } from "@/lib/annotationParser";
import { parseAnnotationJSON } from "@/lib/annotationExport";
import type { PageAnnotation } from "@/hooks/usePageAnnotations";
import { toast } from "sonner";

interface AnnotationImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importResult: AnnotationImportResult | null;
  onImport: (selectedAnnotations: PDFAnnotation[]) => void;
  onImportJSON?: (annotations: PageAnnotation[]) => void;
}

export const AnnotationImportDialog = ({
  open,
  onOpenChange,
  importResult,
  onImport,
  onImportJSON,
}: AnnotationImportDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJSONFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseAnnotationJSON(text);

      if (!result.success || !result.data) {
        toast.error(result.error || "Invalid JSON file");
        return;
      }

      if (onImportJSON) {
        onImportJSON(result.data.annotations);
        toast.success(`Imported ${result.data.annotations.length} page annotations from JSON`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("JSON import error:", error);
      toast.error("Failed to import JSON file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!importResult) {
    // Show JSON import option when no PDF import result
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Annotations</DialogTitle>
            <DialogDescription>
              Import annotations from a JSON backup file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="p-6 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Upload JSON File</h4>
                  <p className="text-xs text-muted-foreground">
                    Click to select a JSON annotation backup file
                  </p>
                </div>
              </div>
            </Card>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleJSONFileUpload}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { annotations, summary } = importResult;

  const toggleAnnotation = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(annotations.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = () => {
    const selectedAnnotations = annotations.filter(a => selectedIds.has(a.id));
    if (selectedAnnotations.length === 0) {
      toast.error("Please select at least one annotation to import");
      return;
    }
    onImport(selectedAnnotations);
    onOpenChange(false);
    toast.success(`Imported ${selectedAnnotations.length} annotation(s)`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import PDF Annotations
          </DialogTitle>
          <DialogDescription>
            Found {summary.total} annotation(s) in the PDF. Select which ones to import and auto-populate form fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="text-2xl font-bold text-primary">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total Annotations</div>
            </Card>
            <Card className="p-3 bg-accent/5 border-accent/20">
              <div className="text-2xl font-bold text-accent">{Object.keys(summary.byPage).length}</div>
              <div className="text-xs text-muted-foreground">Pages with Annotations</div>
            </Card>
            <Card className="p-3 bg-info/5 border-info/20">
              <div className="text-2xl font-bold text-info">{Object.keys(summary.byType).length}</div>
              <div className="text-xs text-muted-foreground">Annotation Types</div>
            </Card>
          </div>

          {/* Type Distribution */}
          <Card className="p-3">
            <div className="text-sm font-semibold mb-2">Annotation Types</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byType).map(([type, count]) => (
                <Badge
                  key={type}
                  variant="outline"
                  style={{ borderColor: getAnnotationColor(type as any) }}
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedIds.size} of {annotations.length} selected
            </div>
          </div>

          {/* Annotation List */}
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-4 space-y-3">
              {annotations.map((annotation) => (
                <Card
                  key={annotation.id}
                  className="p-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => toggleAnnotation(annotation.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(annotation.id)}
                      onCheckedChange={() => toggleAnnotation(annotation.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getAnnotationColor(annotation.type),
                            color: getAnnotationColor(annotation.type),
                          }}
                        >
                          {annotation.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Page {annotation.page}</span>
                        {annotation.author && (
                          <span className="text-xs text-muted-foreground">• {annotation.author}</span>
                        )}
                      </div>
                      {annotation.selectedText && (
                        <div className="text-sm bg-primary/5 px-2 py-1 rounded mb-1 border-l-2 border-primary">
                          "{annotation.selectedText}"
                        </div>
                      )}
                      {annotation.content && annotation.content !== annotation.selectedText && (
                        <div className="text-sm text-muted-foreground">
                          💬 {annotation.content}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* AI Matching Info */}
          <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <strong>Smart Field Matching:</strong> The system will attempt to automatically match annotation content to relevant form fields based on keywords and context.
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Import className="h-4 w-4" />
              Import {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
