import { useState } from "react";
import { PDFViewer } from "@/components/PDFViewer";
import { ExtractionForm } from "@/components/ExtractionForm";
import { TraceLog } from "@/components/TraceLog";
import { FileText } from "lucide-react";

export interface ExtractionEntry {
  id: string;
  fieldName: string;
  text: string;
  page: number;
  coordinates?: { x: number; y: number; width: number; height: number };
  method: "manual" | "ai" | "image" | "region";
  timestamp: Date;
  imageData?: string;
}

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<ExtractionEntry[]>([]);
  const [scale, setScale] = useState(1);

  const handleExtraction = (entry: ExtractionEntry) => {
    setExtractions(prev => [...prev, entry]);
  };

  const handleUpdateExtraction = (id: string, updates: Partial<ExtractionEntry>) => {
    setExtractions(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  };

  const handleJumpToExtraction = (entry: ExtractionEntry) => {
    setCurrentPage(entry.page);
    // Scroll to coordinates if available
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Panel - Form */}
      <div className="w-[35%] border-r border-border bg-card overflow-y-auto">
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Clinical Study Extractor</h1>
              <p className="text-sm text-muted-foreground">Structured data extraction from research PDFs</p>
            </div>
          </div>
        </div>
        <ExtractionForm
          activeField={activeField}
          onFieldFocus={setActiveField}
          extractions={extractions}
          pdfLoaded={!!pdfFile}
          onExtraction={handleExtraction}
        />
      </div>

      {/* Center Panel - PDF Viewer */}
      <div className="flex-1 flex flex-col bg-muted/30">
        <PDFViewer
          file={pdfFile}
          onFileChange={setPdfFile}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
          onTotalPagesChange={setTotalPages}
          activeField={activeField}
          onExtraction={handleExtraction}
          scale={scale}
          onScaleChange={setScale}
          extractions={extractions}
        />
      </div>

      {/* Right Panel - Trace Log */}
      <div className="w-[25%] border-l border-border bg-card overflow-y-auto">
        <TraceLog 
          extractions={extractions}
          onJumpToExtraction={handleJumpToExtraction}
          onClearAll={() => setExtractions([])}
          onUpdateExtraction={handleUpdateExtraction}
        />
      </div>
    </div>
  );
};

export default Index;
