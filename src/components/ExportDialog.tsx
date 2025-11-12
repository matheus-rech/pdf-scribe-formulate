import { useState, useMemo } from "react";
import { Download, FileJson, FileSpreadsheet, Filter, X } from "lucide-react";
import { format as formatDate } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [validationFilter, setValidationFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showFilters, setShowFilters] = useState(false);

  // Filter extractions based on criteria
  const filterExtractions = (extractions: any[]) => {
    return extractions.filter(e => {
      // Field name search
      if (searchTerm && !e.field_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Validation status filter
      if (validationFilter !== "all") {
        if (validationFilter === "none" && e.validation_status) return false;
        if (validationFilter !== "none" && e.validation_status !== validationFilter) return false;
      }

      // Date range filter
      if (dateFrom && new Date(e.created_at) < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(e.created_at) > endOfDay) return false;
      }

      return true;
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (validationFilter !== "all") count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [searchTerm, validationFilter, dateFrom, dateTo]);

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

      // Apply filters
      const filteredExtractions = filterExtractions(extractions);

      if (filteredExtractions.length === 0) {
        toast({
          title: "No data matches filters",
          description: "Please adjust your filters and try again.",
          variant: "destructive",
        });
        return;
      }

      // Format data for export
      const exportData: ExtractionExportData[] = filteredExtractions.map((e) => ({
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
        description: `Exported ${filteredExtractions.length} extractions as ${format.toUpperCase()}`,
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
        <Button variant="outline" size="sm" className="relative">
          <Download className="h-4 w-4 mr-2" />
          Export Data
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Extraction Results</DialogTitle>
          <DialogDescription>
            Choose a format and apply filters to export your data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setValidationFilter("all");
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              {/* Field Name Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Field Name</Label>
                <Input
                  id="search"
                  placeholder="Search by field name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Validation Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="validation">Validation Status</Label>
                <Select value={validationFilter} onValueChange={setValidationFilter}>
                  <SelectTrigger id="validation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="questionable">Questionable</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="none">No status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        {dateFrom ? formatDate(dateFrom, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        {dateTo ? formatDate(dateTo, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
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
          </div>

          {/* Action Buttons */}
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
