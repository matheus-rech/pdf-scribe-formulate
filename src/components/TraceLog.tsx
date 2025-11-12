import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet, FileText, Trash2, Image as ImageIcon } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { toast } from "sonner";

interface TraceLogProps {
  extractions: ExtractionEntry[];
  onJumpToExtraction: (entry: ExtractionEntry) => void;
  onClearAll: () => void;
}

export const TraceLog = ({ extractions, onJumpToExtraction, onClearAll }: TraceLogProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExtractions = extractions.filter((entry) =>
    entry.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportJSON = () => {
    const data = JSON.stringify(extractions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical-extraction-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to JSON");
  };

  const exportCSV = () => {
    const headers = ["Field", "Text", "Page", "Method", "Timestamp"];
    const rows = extractions.map((e) => [
      e.fieldName,
      `"${e.text.replace(/"/g, '""')}"`,
      e.page,
      e.method,
      e.timestamp.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical-extraction-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const exportAudit = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Clinical Study Extraction Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    h1 { color: #2563eb; }
    .entry { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
    .field { font-weight: bold; color: #1e40af; }
    .text { margin: 10px 0; padding: 10px; background: #f0f9ff; border-radius: 4px; }
    .meta { font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Clinical Study Extraction Audit Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Total Extractions: ${extractions.length}</p>
  <hr>
  ${extractions
    .map(
      (e) => `
    <div class="entry">
      <div class="field">${e.fieldName}</div>
      <div class="text">${e.text}</div>
      <div class="meta">Page ${e.page} • ${e.method} • ${e.timestamp.toLocaleString()}</div>
    </div>
  `
    )
    .join("")}
</body>
</html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical-audit-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported audit report");
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "manual":
        return "border-extraction-manual";
      case "ai":
        return "border-extraction-ai";
      case "image":
        return "border-extraction-image";
      case "region":
        return "border-accent";
      default:
        return "border-muted";
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "manual":
        return <span className="text-xs px-2 py-0.5 rounded bg-extraction-manual/10 text-extraction-manual border border-extraction-manual/20">Manual</span>;
      case "ai":
        return <span className="text-xs px-2 py-0.5 rounded bg-extraction-ai/10 text-extraction-ai border border-extraction-ai/20">AI</span>;
      case "image":
        return <span className="text-xs px-2 py-0.5 rounded bg-extraction-image/10 text-extraction-image border border-extraction-image/20">Image</span>;
      case "region":
        return <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">Region</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Extraction Trace Log</h2>
        
        {/* Export Section */}
        <Card className="p-3 bg-primary/5 border-primary/20 mb-3">
          <h3 className="text-sm font-medium mb-2">Export Options</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2 text-xs">
              <FileJson className="h-3 w-3" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 text-xs">
              <FileSpreadsheet className="h-3 w-3" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportAudit} className="gap-2 text-xs col-span-2">
              <FileText className="h-3 w-3" />
              Audit Report
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-semibold">{extractions.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pages:</span>{" "}
            <span className="font-semibold">{new Set(extractions.map((e) => e.page)).size}</span>
          </div>
        </div>

        {extractions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="w-full mt-3 gap-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {extractions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No extractions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a field and highlight text in the PDF to start
            </p>
          </Card>
        ) : (
          filteredExtractions.reverse().map((entry) => (
            <Card
              key={entry.id}
              className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${getMethodColor(
                entry.method
              )}`}
              onClick={() => onJumpToExtraction(entry)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm">{entry.fieldName}</div>
                {getMethodBadge(entry.method)}
              </div>
              
              {entry.method === "image" && entry.imageData ? (
                <div className="my-2">
                  <img
                    src={entry.imageData}
                    alt="Extracted region"
                    className="w-full rounded border border-border"
                  />
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-2 line-clamp-2">
                  {entry.text}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Page {entry.page}</span>
                <span>{entry.timestamp.toLocaleTimeString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
