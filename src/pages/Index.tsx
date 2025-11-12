import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ExtractionForm } from "@/components/ExtractionForm";
import { PDFViewer } from "@/components/PDFViewer";
import { TraceLog } from "@/components/TraceLog";
import { StudyManager } from "@/components/StudyManager";
import { ChunkDebugPanel } from "@/components/ChunkDebugPanel";
import { matchAnnotationsToFields, type PDFAnnotation } from "@/lib/annotationParser";
import { toast } from "sonner";
import { FileText, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStorage } from "@/hooks/use-study-storage";
import { detectSourceCitations, type SourceCitation } from "@/lib/citationDetector";
import { AuditReportDialog } from "@/components/AuditReportDialog";
import { BatchRevalidationDialog } from "@/components/BatchRevalidationDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface ExtractionEntry {
  id: string;
  fieldName: string;
  text: string;
  page: number;
  coordinates?: { x: number; y: number; width: number; height: number };
  method: "manual" | "ai" | "image" | "region" | "annotation";
  timestamp: Date;
  imageData?: string;
  validation_status?: "validated" | "questionable" | "pending";
  confidence_score?: number;
  region?: { x: number; y: number; width: number; height: number };
  sourceCitations?: SourceCitation[];
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<ExtractionEntry[]>([]);
  const [scale, setScale] = useState(1);
  const [pdfText, setPdfText] = useState<string>("");
  const [studies, setStudies] = useState<any[]>([]);
  const [isCreatingStudy, setIsCreatingStudy] = useState(false);
  const [highlightedSources, setHighlightedSources] = useState<SourceCitation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    currentStudy,
    setCurrentStudy,
    createStudy,
    saveExtraction,
    loadExtractions,
    getAllStudies,
    loadStudyPdf,
    reprocessStudy,
  } = useStudyStorage(userId);

  const [isReprocessing, setIsReprocessing] = useState(false);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setUserId(session.user.id);
        setEmail(session.user.email || session.user.user_metadata?.email || "");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setUserId(session.user.id);
        setEmail(session.user.email || session.user.user_metadata?.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load all studies when user is authenticated
  useEffect(() => {
    if (userId) {
      getAllStudies().then(setStudies);
    }
  }, [userId]);

  // Load extractions when study is selected
  useEffect(() => {
    if (currentStudy) {
      loadExtractions(currentStudy.id).then(setExtractions);
    }
  }, [currentStudy]);

  // Create study and upload PDF when totalPages is available
  useEffect(() => {
    if (pdfFile && totalPages > 0 && isCreatingStudy && !currentStudy) {
      const studyName = pdfFile.name.replace('.pdf', '') || `Study - ${new Date().toLocaleDateString()}`;
      
      createStudy(studyName, pdfFile, totalPages).then((newStudy) => {
        if (newStudy) {
          getAllStudies().then(setStudies);
          setIsCreatingStudy(false);
        }
      });
    }
  }, [pdfFile, totalPages, isCreatingStudy, currentStudy]);

  const handleExtraction = (entry: ExtractionEntry) => {
    setExtractions(prev => [...prev, entry]);
    
    // Save to database
    if (currentStudy) {
      saveExtraction(currentStudy.id, entry);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleStudySelect = async (studyId: string) => {
    const study = studies.find((s) => s.id === studyId);
    if (study) {
      setCurrentStudy(study);
      
      // Load PDF from storage
      const pdf = await loadStudyPdf(study);
      if (pdf) {
        setPdfFile(pdf);
      }
      
      // Load extractions
      const loadedExtractions = await loadExtractions(studyId);
      setExtractions(loadedExtractions);
      
      toast.success(`Loaded study: ${study.name}`);
    }
  };

  const handleNewStudy = () => {
    // Trigger file picker to upload new study PDF
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Clear current state
      setCurrentStudy(null);
      setExtractions([]);
      setPdfText("");
      setCurrentPage(1);
      setTotalPages(0);
      
      // Set new PDF - study creation will happen after PDF loads and totalPages is set
      setPdfFile(file);
      setIsCreatingStudy(true);
      toast.info("Loading PDF...");
    } else {
      toast.error("Please select a valid PDF file");
    }
    
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleUpdateExtraction = (id: string, updates: Partial<ExtractionEntry>) => {
    setExtractions(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
    
    // Save to database if study is selected
    if (currentStudy) {
      const updatedExtraction = extractions.find(e => e.id === id);
      if (updatedExtraction) {
        saveExtraction(currentStudy.id, { ...updatedExtraction, ...updates });
      }
    }
  };

  const handleBatchUpdateExtractions = (updated: ExtractionEntry[]) => {
    // Update state
    updated.forEach(ext => {
      setExtractions(prev => 
        prev.map(e => e.id === ext.id ? ext : e)
      );
    });
    
    // Save to database
    if (currentStudy) {
      updated.forEach(async (ext) => {
        await saveExtraction(currentStudy.id, ext);
      });
      toast.success('Citations updated successfully');
    }
  };

  const handleJumpToExtraction = (entry: ExtractionEntry) => {
    setCurrentPage(entry.page);
  };

  const handleHighlightSources = (citations?: SourceCitation[]) => {
    setHighlightedSources(citations || []);
  };

  const handleClearSourceHighlights = () => {
    setHighlightedSources([]);
  };

  const handleJumpToCitation = (citation: SourceCitation) => {
    setCurrentPage(citation.page);
  };

  const handleReprocessStudy = async (studyId: string) => {
    setIsReprocessing(true);
    const success = await reprocessStudy(studyId);
    if (success) {
      // Refresh studies list
      const updatedStudies = await getAllStudies();
      setStudies(updatedStudies);
    }
    setIsReprocessing(false);
  };

  const [isBatchExtracting, setIsBatchExtracting] = useState(false);

  const handleBatchExtract = async (section: any) => {
    if (!currentStudy?.pdf_chunks?.pageChunks) {
      toast.error("PDF chunks not available. Please re-process the PDF first.");
      return;
    }

    setIsBatchExtracting(true);
    try {
      // Get text for this section
      const pageChunks = currentStudy.pdf_chunks.pageChunks;
      const fullText = pageChunks.map((c: any) => c.text).join('\n\n');
      const sectionText = fullText.substring(section.charStart, section.charEnd);

      toast.info(`Extracting data from ${section.name}...`);

      const { data, error } = await supabase.functions.invoke('batch-extract-section', {
        body: {
          sectionText,
          sectionType: section.type,
          sectionName: section.name
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const { extractedData, fieldsExtracted } = data;

      // Create extraction entries for each extracted field
      const timestamp = new Date();
      let extractionCount = 0;

      for (const [fieldName, fieldValue] of Object.entries(extractedData)) {
        if (typeof fieldValue === 'string' && fieldValue.trim()) {
          handleExtraction({
            id: `batch-${section.type}-${fieldName}-${Date.now()}-${extractionCount}`,
            fieldName,
            text: fieldValue,
            page: section.pageStart,
            method: "ai",
            timestamp
          });
          extractionCount++;
        }
      }

      toast.success(`✨ Extracted ${fieldsExtracted} fields from ${section.name}`);
    } catch (error: any) {
      console.error("Batch extraction error:", error);
      toast.error("Failed to extract data from section");
    } finally {
      setIsBatchExtracting(false);
    }
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

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Panel - Form */}
      <div className="w-[35%] border-r border-border bg-card overflow-y-auto">
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Meta-Analysis Extractor</h1>
              <p className="text-sm text-muted-foreground">Study-centric data extraction for systematic reviews</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-7 px-2 text-xs"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Sign Out
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <StudyManager
              studies={studies}
              currentStudy={currentStudy}
              onStudySelect={handleStudySelect}
              onNewStudy={handleNewStudy}
              onReprocessStudy={handleReprocessStudy}
              isReprocessing={isReprocessing}
            />

            <ChunkDebugPanel currentStudy={currentStudy} extractions={extractions} />
          </div>
        </div>
        <ExtractionForm
          activeField={activeField}
          onFieldFocus={setActiveField}
          extractions={extractions}
          pdfLoaded={!!pdfFile}
          onExtraction={handleExtraction}
          pdfText={pdfText}
          studyId={currentStudy?.id}
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
            onPdfTextExtracted={setPdfText}
            highlightedSources={highlightedSources}
            onJumpToExtraction={handleJumpToExtraction}
            studySections={currentStudy?.pdf_chunks?.sections}
            onBatchExtract={handleBatchExtract}
            isBatchExtracting={isBatchExtracting}
          />
      </div>

      {/* Right Panel - Trace Log */}
      <div className="w-[25%] border-l border-border bg-card overflow-y-auto">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex flex-col gap-2">
            <AuditReportDialog
              extractions={extractions}
              studyInfo={{
                id: currentStudy?.id || '',
                name: currentStudy?.name || '',
                pdfName: currentStudy?.pdf_name || '',
                email: currentStudy?.email || email
              }}
              onJumpToExtraction={handleJumpToExtraction}
            />
            <BatchRevalidationDialog
              extractions={extractions}
              onUpdateExtractions={handleBatchUpdateExtractions}
            />
            {currentStudy && (
              <ExportDialog
                studyId={currentStudy.id}
                studyName={currentStudy.name}
              />
            )}
          </div>
        </div>
        <TraceLog
          extractions={extractions}
          onJumpToExtraction={handleJumpToExtraction}
          onClearAll={() => setExtractions([])}
          onUpdateExtraction={handleUpdateExtraction}
          onHighlightSources={handleHighlightSources}
          onClearSourceHighlights={handleClearSourceHighlights}
          onJumpToCitation={handleJumpToCitation}
          pdfFile={pdfFile}
          currentStudy={currentStudy}
        />
      </div>
    </div>
  );
};

export default Index;
