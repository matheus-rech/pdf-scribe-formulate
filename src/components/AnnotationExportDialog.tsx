import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, FileJson } from "lucide-react";
import type { PageAnnotation } from "@/hooks/usePageAnnotations";
import { exportAnnotationsAsJSON } from "@/lib/annotationExport";
import { toast } from "sonner";

interface AnnotationExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageAnnotations: PageAnnotation[];
  pdfFileName: string;
}

export const AnnotationExportDialog = ({
  open,
  onOpenChange,
  pageAnnotations,
  pdfFileName
}: AnnotationExportDialogProps) => {
  const handleExportJSON = () => {
    try {
      exportAnnotationsAsJSON(pageAnnotations, pdfFileName);
      toast.success(`Exported ${pageAnnotations.length} page annotations`);
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export annotations");
    }
  };

  const totalObjects = pageAnnotations.reduce((sum, ann) => {
    return sum + (ann.canvasJSON?.objects?.length || 0);
  }, 0);

  const pages = pageAnnotations.map(a => a.pageNumber).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Annotations</DialogTitle>
          <DialogDescription>
            Save your annotations as a backup file that can be imported later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileJson className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-semibold">JSON Backup</h4>
                  <p className="text-sm text-muted-foreground">
                    Lightweight format for backup and restore
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div>📄 <span className="font-medium">{pageAnnotations.length}</span> annotated pages</div>
                    <div>✏️ <span className="font-medium">{totalObjects}</span> drawing objects</div>
                    <div>📑 Pages: <span className="font-medium">{pages}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Backup Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>JSON files can be re-imported on any device</li>
              <li>Includes all drawings, colors, and positioning</li>
              <li>Small file size, easy to share or version control</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportJSON}
            disabled={pageAnnotations.length === 0}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
