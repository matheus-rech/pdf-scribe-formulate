import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  exportToJSON,
  exportToCSV,
  exportToExcel,
  formatExportFilename,
  type ExtractionExportData,
} from "@/lib/exportData";

interface ExportDialogProps {
  studyId: string;
  studyName: string;
}

type ExportFormat = "json" | "csv" | "excel";

export const ExportDialog = ({ studyId, studyName }: ExportDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch extractions for the study
      const { data: extractions, error } = await supabase
        .from("extractions")
        .select("*")
        .eq("study_id", studyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!extractions || extractions.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no extractions for this study yet.",
          variant: "destructive",
        });
        return;
      }

      // Format data for export
      const exportData: ExtractionExportData[] = extractions.map((e) => ({
        id: e.id,
        study_id: e.study_id,
        extraction_id: e.extraction_id,
        field_name: e.field_name,
        text: e.text,
        confidence_score: e.confidence_score,
        page: e.page,
        validation_status: e.validation_status,
        method: e.method,
        timestamp: e.created_at,
      }));

      const filename = formatExportFilename(studyName);

      // Export based on selected format
      switch (format) {
        case "json":
          exportToJSON(exportData, filename);
          break;
        case "csv":
          exportToCSV(exportData, filename);
          break;
        case "excel":
          exportToExcel(exportData, filename);
          break;
      }

      toast({
        title: "Export successful",
        description: `Exported ${extractions.length} extractions as ${format.toUpperCase()}`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Extraction Results</DialogTitle>
          <DialogDescription>
            Choose a format to download your extraction data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex-1 cursor-pointer flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">CSV (Comma Separated)</div>
                  <div className="text-sm text-muted-foreground">
                    Best for Excel and data analysis tools
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex-1 cursor-pointer flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="font-medium">Excel (.xlsx)</div>
                  <div className="text-sm text-muted-foreground">
                    Native Excel format with formatting
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex-1 cursor-pointer flex items-center gap-3">
                <FileJson className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">JSON</div>
                  <div className="text-sm text-muted-foreground">
                    Machine-readable format for APIs
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
