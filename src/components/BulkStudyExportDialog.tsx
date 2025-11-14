import { useState } from "react";
import { Download, Package, CheckSquare, Square } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createBulkZipExport, downloadBlob } from "@/lib/zipExport";
import type { ExtractionExportData } from "@/lib/exportData";
import type { PageAnnotation } from "@/hooks/usePageAnnotations";

interface Study {
  id: string;
  name: string;
  total_pages?: number;
  created_at: string;
}

interface BulkStudyExportDialogProps {
  studies: Study[];
  currentStudyAnnotations?: PageAnnotation[];
  currentStudyId?: string;
}

type ExportFormat = "json" | "csv" | "excel";

export const BulkStudyExportDialog = ({ 
  studies, 
  currentStudyAnnotations,
  currentStudyId 
}: BulkStudyExportDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [selectedStudyIds, setSelectedStudyIds] = useState<Set<string>>(new Set());
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studyId)) {
        newSet.delete(studyId);
      } else {
        newSet.add(studyId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedStudyIds(new Set(studies.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedStudyIds(new Set());
  };

  const handleExport = async () => {
    if (selectedStudyIds.size === 0) {
      toast({
        title: "No studies selected",
        description: "Please select at least one study to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const studyExportData: Array<{
        studyName: string;
        extractionData: ExtractionExportData[];
        annotations?: PageAnnotation[];
      }> = [];

      // Fetch data for each selected study
      for (const studyId of Array.from(selectedStudyIds)) {
        const study = studies.find(s => s.id === studyId);
        if (!study) continue;

        // Fetch extractions
        const { data: extractions, error } = await supabase
          .from('extractions')
          .select('*')
          .eq('study_id', studyId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error(`Error fetching extractions for study ${studyId}:`, error);
          continue;
        }

        const formattedExtractions: ExtractionExportData[] = (extractions || []).map(ext => ({
          id: ext.id,
          study_id: ext.study_id,
          extraction_id: ext.extraction_id,
          field_name: ext.field_name,
          text: ext.text,
          confidence_score: ext.confidence_score,
          page: ext.page,
          validation_status: ext.validation_status,
          method: ext.method,
          timestamp: ext.created_at,
        }));

        // Get annotations if this is the current study
        let annotations: PageAnnotation[] | undefined;
        if (includeAnnotations && studyId === currentStudyId && currentStudyAnnotations) {
          annotations = currentStudyAnnotations;
        }

        studyExportData.push({
          studyName: study.name,
          extractionData: formattedExtractions,
          annotations,
        });
      }

      // Create bulk ZIP
      const zipBlob = await createBulkZipExport(studyExportData, format, includeAnnotations);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `bulk_export_${selectedStudyIds.size}_studies_${timestamp}.zip`;
      
      downloadBlob(zipBlob, filename);

      toast({
        title: "Export successful",
        description: `Exported ${selectedStudyIds.size} ${selectedStudyIds.size === 1 ? 'study' : 'studies'} as ${filename}`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Bulk Export
          {selectedStudyIds.size > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedStudyIds.size}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Export Studies</DialogTitle>
          <DialogDescription>
            Select multiple studies to export their data in a single ZIP file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Study Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Studies</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedStudyIds.size === studies.length}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  disabled={selectedStudyIds.size === 0}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[250px] rounded-md border p-4">
              <div className="space-y-2">
                {studies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No studies available
                  </p>
                ) : (
                  studies.map((study) => (
                    <div
                      key={study.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => toggleStudySelection(study.id)}
                    >
                      <Checkbox
                        checked={selectedStudyIds.has(study.id)}
                        onCheckedChange={() => toggleStudySelection(study.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {study.name}
                          </p>
                          {study.id === currentStudyId && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {study.total_pages ? `${study.total_pages} pages` : 'No pages'} • 
                          Created {new Date(study.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {selectedStudyIds.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedStudyIds.size} {selectedStudyIds.size === 1 ? 'study' : 'studies'} selected
              </p>
            )}
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="bulk-csv" />
                <Label htmlFor="bulk-csv" className="font-normal cursor-pointer">
                  CSV - Best for Excel and data analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="bulk-excel" />
                <Label htmlFor="bulk-excel" className="font-normal cursor-pointer">
                  Excel (XLSX) - Native Excel format with formatting
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="bulk-json" />
                <Label htmlFor="bulk-json" className="font-normal cursor-pointer">
                  JSON - Best for programmatic access
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Annotations */}
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/50">
            <Checkbox
              id="bulk-annotations"
              checked={includeAnnotations}
              onCheckedChange={(checked) => setIncludeAnnotations(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="bulk-annotations" className="cursor-pointer font-medium">
                Include PDF Annotations
              </Label>
              <p className="text-xs text-muted-foreground">
                Bundle PDF annotations with extraction data for current study
                {currentStudyId && currentStudyAnnotations
                  ? ` (${currentStudyAnnotations.length} page${currentStudyAnnotations.length === 1 ? '' : 's'} annotated)`
                  : ' (no annotations available)'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedStudyIds.size === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Download className="h-4 w-4 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {selectedStudyIds.size > 0 && `(${selectedStudyIds.size})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
