import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet, FileText, Trash2, ImageIcon, Sparkles, Link2, MapPin, CheckCircle, CheckSquare } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { toast } from "sonner";
import { OCRDialog } from "./OCRDialog";
import { OCRInfoCard } from "./OCRInfoCard";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { BulkEditDialog } from "./BulkEditDialog";
import type { SourceCitation } from "@/lib/citationDetector";
import { detectSourceCitations } from "@/lib/citationDetector";
import { validateAllCitations, getCitationConfidenceColor, getCitationConfidenceBadge } from "@/lib/citationValidation";

interface TraceLogProps {
  extractions: ExtractionEntry[];
  onJumpToExtraction: (entry: ExtractionEntry) => void;
  onClearAll: () => void;
  onUpdateExtraction?: (id: string, updates: Partial<ExtractionEntry>) => void;
  onHighlightSources?: (citations?: SourceCitation[]) => void;
  onClearSourceHighlights?: () => void;
  onJumpToCitation?: (citation: SourceCitation) => void;
  pdfFile?: File | null;
  currentStudy?: any;
}

export const TraceLog = ({ 
  extractions, 
  onJumpToExtraction, 
  onClearAll, 
  onUpdateExtraction,
  onHighlightSources,
  onClearSourceHighlights,
  onJumpToCitation,
  pdfFile,
  currentStudy
}: TraceLogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [selectedImageForOCR, setSelectedImageForOCR] = useState<{ data: string; entryId: string } | null>(null);
  const [detectingSource, setDetectingSource] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredExtractions = extractions.filter((entry) =>
    entry.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredExtractions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExtractions.map(e => e.id));
    }
  };

  const handleBulkUpdate = (updates: { validation_status?: string; notes?: string }) => {
    if (!onUpdateExtraction) return;

    selectedIds.forEach(id => {
      const typedUpdates: Partial<ExtractionEntry> = {};
      
      if (updates.validation_status) {
        typedUpdates.validation_status = updates.validation_status as "validated" | "questionable" | "pending";
      }
      
      // Note: notes field doesn't exist on ExtractionEntry, so we skip it for now
      // You may need to add this field to the ExtractionEntry interface if needed
      
      onUpdateExtraction(id, typedUpdates);
    });

    setSelectedIds([]);
    setSelectionMode(false);
  };

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
    .image-container { margin: 10px 0; }
    .image-container img { max-width: 400px; border: 2px solid #2563eb; border-radius: 4px; }
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
      ${e.method === "image" && e.imageData 
        ? `<div class="image-container"><img src="${e.imageData}" alt="Extracted image"></div>`
        : `<div class="text">${e.text}</div>`
      }
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

  const downloadImage = (entry: ExtractionEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.imageData) return;

    const link = document.createElement("a");
    link.href = entry.imageData;
    link.download = `${entry.fieldName}-page${entry.page}-${Date.now()}.png`;
    link.click();
    toast.success("Image downloaded");
  };

  const handleOpenOCR = (entry: ExtractionEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.imageData) return;
    
    setSelectedImageForOCR({ data: entry.imageData, entryId: entry.id });
    setOcrDialogOpen(true);
  };

  const handleOCRExtractToField = (text: string) => {
    if (selectedImageForOCR && onUpdateExtraction) {
      onUpdateExtraction(selectedImageForOCR.entryId, {
        text: text,
        method: "ai" // Mark as AI-extracted
      });
      toast.success("OCR text added to extraction");
    }
  };

  const detectSourceForExtraction = async (entry: ExtractionEntry) => {
    if (!pdfFile || !onUpdateExtraction) return;
    
    setDetectingSource(entry.id);
    toast.info("Detecting and validating source...");
    
    try {
      const preProcessedChunks = currentStudy?.pdf_chunks?.pageChunks;
      
      const detection = await detectSourceCitations(
        entry.text,
        pdfFile,
        entry.page,
        preProcessedChunks
      );
      
      if (detection.sourceCitations.length > 0) {
        // Validate citations with AI
        const validatedCitations = await validateAllCitations(
          entry.text,
          detection.sourceCitations
        );
        
        onUpdateExtraction(entry.id, {
          sourceCitations: validatedCitations
        });
        
        const avgConfidence = validatedCitations.reduce((sum, c) => sum + c.confidence, 0) / validatedCitations.length;
        toast.success(`Found ${validatedCitations.length} source${validatedCitations.length > 1 ? 's' : ''} (${(avgConfidence * 100).toFixed(0)}% avg confidence)`);
      } else {
        toast.error("No source found");
      }
    } catch (error) {
      console.error("Error detecting source:", error);
      toast.error("Failed to detect source");
    } finally {
      setDetectingSource(null);
    }
  };

  const detectAllSources = async () => {
    if (!pdfFile || !onUpdateExtraction) return;
    
    toast.info("Detecting and validating sources for all extractions...");
    let detected = 0;
    
    const preProcessedChunks = currentStudy?.pdf_chunks?.pageChunks;
    
    for (const extraction of extractions) {
      if (!extraction.sourceCitations || extraction.sourceCitations.length === 0) {
        try {
          const detection = await detectSourceCitations(
            extraction.text,
            pdfFile,
            extraction.page,
            preProcessedChunks
          );
          
          if (detection.sourceCitations.length > 0) {
            // Validate with AI
            const validatedCitations = await validateAllCitations(
              extraction.text,
              detection.sourceCitations
            );
            
            onUpdateExtraction(extraction.id, {
              sourceCitations: validatedCitations
            });
            detected++;
          }
        } catch (error) {
          console.error(`Error detecting source for ${extraction.id}:`, error);
        }
        
        // Small delay between extractions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    toast.success(`Detected and validated sources for ${detected} extraction${detected !== 1 ? 's' : ''}`);
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
      case "annotation-import":
        return "border-chart-2";
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
      case "annotation-import":
        return <span className="text-xs px-2 py-0.5 rounded bg-chart-2/10 text-chart-2 border border-chart-2/20">📎 Annotation</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Extraction Trace Log</h2>
        
        {/* OCR Info Card */}
        <div className="mb-3">
          <OCRInfoCard />
        </div>
        
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
        <div className="flex items-center justify-between text-sm mb-2">
          <div>
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-semibold">{extractions.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pages:</span>{" "}
            <span className="font-semibold">{new Set(extractions.map((e) => e.page)).size}</span>
          </div>
        </div>

        {/* Batch detection button */}
        {pdfFile && extractions.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={detectAllSources}
              className="w-full gap-2 text-xs"
            >
              <MapPin className="h-3 w-3" />
              Auto-Detect All Sources
            </Button>
            
            {/* Bulk Edit Controls */}
            <div className="flex gap-2">
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedIds([]);
                }}
                className="flex-1 gap-2 text-xs"
              >
                <CheckSquare className="h-3 w-3" />
                {selectionMode ? "Cancel" : "Select"}
              </Button>
              
              {selectionMode && (
                <BulkEditDialog
                  selectedIds={selectedIds}
                  onBulkUpdate={handleBulkUpdate}
                  onClearSelection={() => setSelectedIds([])}
                />
              )}
            </div>
            
            {selectionMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="w-full text-xs"
              >
                {selectedIds.length === filteredExtractions.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        )}

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
          filteredExtractions.reverse().map((entry) => {
            const isSelected = selectedIds.includes(entry.id);
            
            return (
            <Card
              key={entry.id}
              className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${getMethodColor(
                entry.method
              )} ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
              onClick={() => {
                if (selectionMode) {
                  toggleSelection(entry.id);
                } else {
                  onJumpToExtraction(entry);
                }
              }}
              onMouseEnter={() => !selectionMode && onHighlightSources?.(entry.sourceCitations)}
              onMouseLeave={() => !selectionMode && onClearSourceHighlights?.()}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(entry.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-input"
                    />
                  )}
                  <div className="font-medium text-sm">{entry.fieldName}</div>
                  
                  {/* Citation indicator */}
                  {entry.sourceCitations && entry.sourceCitations.length > 0 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-1 text-xs text-primary cursor-help">
                          <Link2 className="h-3 w-3" />
                          <span>{entry.sourceCitations.length}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-96" side="left">
                        <div className="space-y-3">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Source Citations
                          </div>
                          
                          {entry.sourceCitations.map((citation, idx) => (
                            <div
                              key={citation.id}
                              className="border-l-2 border-primary/30 pl-3 py-2 hover:bg-muted/50 rounded cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onJumpToCitation?.(citation);
                              }}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-primary">
                                    Source {idx + 1} • Page {citation.page}
                                  </span>
                                  {citation.validated && (
                                    <Badge variant="outline" className={`text-xs ${getCitationConfidenceColor(citation.confidence)}`}>
                                      {getCitationConfidenceBadge(citation.confidence)}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {(citation.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              
                              {citation.validationResult && (
                                <div className="text-xs text-muted-foreground mb-1">
                                  <span className="font-medium">{citation.validationResult.matchType}:</span> {citation.validationResult.reasoning}
                                </div>
                              )}
                              
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {citation.context}
                              </p>
                              
                              <div className="text-xs bg-primary/5 p-2 rounded border border-primary/10">
                                "{citation.sourceText}"
                              </div>
                              
                              {citation.validationResult?.issues && citation.validationResult.issues.length > 0 && (
                                <div className="mt-2 text-xs text-orange-600">
                                  ⚠️ {citation.validationResult.issues.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  
                  {/* Confidence badge */}
                  {entry.sourceCitations?.[0]?.confidence && entry.sourceCitations[0].confidence > 0.8 && (
                    <div title="High confidence source match">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {entry.method === "image" && entry.imageData && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenOCR(entry, e)}
                        className="h-6 w-6 p-0 hover:bg-primary/10"
                        title="Extract text with OCR"
                      >
                        <Sparkles className="h-3 w-3 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => downloadImage(entry, e)}
                        className="h-6 w-6 p-0 hover:bg-extraction-image/10"
                        title="Download image"
                      >
                        <Download className="h-3 w-3 text-extraction-image" />
                      </Button>
                    </>
                  )}
                  {getMethodBadge(entry.method)}
                </div>
              </div>
              
              {entry.method === "image" && entry.imageData ? (
                <div className="my-2 group relative">
                  <img
                    src={entry.imageData}
                    alt="Extracted region"
                    className="w-full rounded border border-extraction-image shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open in new tab for full view
                      const win = window.open();
                      if (win) {
                        win.document.write(`
                          <html>
                            <head><title>Extracted Image - ${entry.fieldName}</title></head>
                            <body style="margin:0;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                              <img src="${entry.imageData}" style="max-width:100%;height:auto;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
                            </body>
                          </html>
                        `);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/95 px-3 py-2 rounded shadow-md text-xs space-y-1">
                      <div className="font-medium">Click to enlarge</div>
                      <div className="text-muted-foreground">✨ Use OCR to extract text</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-2 line-clamp-2">
                  {entry.text}
                </div>
              )}
              
              {/* Show primary source context if available */}
              {entry.sourceCitations?.[0] && (
                <div className="text-xs text-primary/70 italic border-l-2 border-primary/20 pl-2 mt-2">
                  From: "{entry.sourceCitations[0].context.substring(0, 80)}..."
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>Page {entry.page}</span>
                <span>{entry.timestamp.toLocaleTimeString()}</span>
              </div>

              {/* Find Source button if no citations */}
              {!entry.sourceCitations && pdfFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    detectSourceForExtraction(entry);
                  }}
                  disabled={detectingSource === entry.id}
                >
                  <MapPin className="h-3 w-3" />
                  {detectingSource === entry.id ? "Detecting..." : "Find Source"}
                </Button>
              )}
            </Card>
          );
          })
        )}
      </div>

      {/* OCR Dialog */}
      {selectedImageForOCR && (
        <OCRDialog
          open={ocrDialogOpen}
          onOpenChange={setOcrDialogOpen}
          imageData={selectedImageForOCR.data}
          onExtractToField={handleOCRExtractToField}
        />
      )}
    </div>
  );
};
