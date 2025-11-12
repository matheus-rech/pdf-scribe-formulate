import { useState, useEffect } from "react";
import { ExtractionForm } from "@/components/ExtractionForm";
import { PDFViewer } from "@/components/PDFViewer";
import { TraceLog } from "@/components/TraceLog";
import { matchAnnotationsToFields, type PDFAnnotation } from "@/lib/annotationParser";
import { toast } from "sonner";
import { FileText, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProjectStorage } from "@/hooks/use-project-storage";

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
  const [email, setEmail] = useState<string>("");
  const [emailSet, setEmailSet] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<ExtractionEntry[]>([]);
  const [scale, setScale] = useState(1);

  const {
    currentProject,
    setCurrentProject,
    createProject,
    saveExtraction,
    loadExtractions,
  } = useProjectStorage(email);

  // Auto-create project when PDF is loaded
  useEffect(() => {
    if (pdfFile && !currentProject && emailSet) {
      createProject(
        `Study - ${new Date().toLocaleDateString()}`,
        pdfFile.name,
        totalPages
      );
    }
  }, [pdfFile, totalPages, currentProject, emailSet]);

  // Load extractions when project is set
  useEffect(() => {
    if (currentProject) {
      loadExtractions(currentProject.id).then(setExtractions);
    }
  }, [currentProject]);

  const handleExtraction = (entry: ExtractionEntry) => {
    setExtractions(prev => [...prev, entry]);
    
    // Save to database
    if (currentProject) {
      saveExtraction(currentProject.id, entry);
    }
  };

  const handleSetEmail = () => {
    if (email.trim()) {
      setEmailSet(true);
      toast.success("Email set");
    } else {
      toast.error("Please enter an email");
    }
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
  };

  const handleAnnotationsImport = (annotations: PDFAnnotation[]) => {
    const FIELD_NAMES = [
      "citation", "doi", "pmid", "journal", "year",
      "population", "intervention", "comparator", "outcomes", "timing",
      "sampleSize", "age", "gender", "comorbidities",
      "volumeMeasurements", "swellingIndices",
      "surgicalProcedures", "medicalManagement",
      "controlGroup", "treatmentGroup",
      "mortality", "mrsDistribution",
      "adverseEvents", "predictors"
    ];

    const matches = matchAnnotationsToFields(annotations, FIELD_NAMES);
    let importCount = 0;

    // Create extraction entries from matched annotations
    Object.entries(matches).forEach(([fieldName, fieldAnnotations]) => {
      fieldAnnotations.forEach((annotation) => {
        const extractionText = annotation.selectedText || annotation.content;
        if (extractionText && extractionText.trim()) {
          handleExtraction({
            id: `import-${annotation.id}`,
            fieldName,
            text: extractionText,
            page: annotation.page,
            coordinates: annotation.coordinates,
            method: "annotation-import" as any,
            timestamp: annotation.timestamp || new Date(),
          });
          importCount++;
        }
      });
    });

    if (importCount > 0) {
      toast.success(`Successfully imported ${importCount} annotation(s) to form fields`);
    }
  };

  // Show email prompt if not set
  if (!emailSet) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="max-w-md w-full p-8 bg-card border border-border rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Clinical Study Extractor</h1>
              <p className="text-sm text-muted-foreground">Enter your email to continue</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetEmail()}
              autoFocus
            />
            <Button onClick={handleSetEmail} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Panel - Form */}
      <div className="w-[35%] border-r border-border bg-card overflow-y-auto">
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Clinical Study Extractor</h1>
                <p className="text-sm text-muted-foreground">Structured data extraction from research PDFs</p>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <User className="h-3 w-3" />
            {email}
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
            onAnnotationsImport={handleAnnotationsImport}
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
