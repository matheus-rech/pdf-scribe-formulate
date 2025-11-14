import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ExtractionForm } from "@/components/ExtractionForm";
import { PDFViewer } from "@/components/PDFViewer";
import { TraceLog } from "@/components/TraceLog";
import { StudyManager } from "@/components/StudyManager";
import { ChunkDebugPanel } from "@/components/ChunkDebugPanel";
import { SectionDetectionProgress } from "@/components/SectionDetectionProgress";
import { matchAnnotationsToFields, type PDFAnnotation } from "@/lib/annotationParser";
import { toast } from "sonner";
import { FileText, User, LogOut, ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStorage } from "@/hooks/use-study-storage";
import { detectSourceCitations, type SourceCitation } from "@/lib/citationDetector";
import { AuditReportDialog } from "@/components/AuditReportDialog";
import { BatchRevalidationDialog } from "@/components/BatchRevalidationDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { BulkStudyExportDialog } from "@/components/BulkStudyExportDialog";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [pdfAnnotations, setPdfAnnotations] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Panel collapse states
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('leftPanelCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('rightPanelCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  // Persist panel states
  useEffect(() => {
    localStorage.setItem('leftPanelCollapsed', JSON.stringify(leftPanelCollapsed));
  }, [leftPanelCollapsed]);

  useEffect(() => {
    localStorage.setItem('rightPanelCollapsed', JSON.stringify(rightPanelCollapsed));
  }, [rightPanelCollapsed]);

  // Keyboard shortcuts for panel toggling
  useKeyboardShortcuts({
    onEscape: () => {
      if (leftPanelCollapsed) leftPanelRef.current?.expand();
      if (rightPanelCollapsed) rightPanelRef.current?.expand();
    },
  }, true);

  const [detectedSections, setDetectedSections] = useState<any[]>([]);
  const [showSectionProgress, setShowSectionProgress] = useState(false);

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
      
      setShowSectionProgress(true);
      
      createStudy(studyName, pdfFile, totalPages, (sections) => {
        setDetectedSections(sections);
      }).then((newStudy) => {
        if (newStudy) {
          getAllStudies().then(setStudies);
          setIsCreatingStudy(false);
          // Keep section progress visible for a moment
          setTimeout(() => setShowSectionProgress(false), 3000);
        } else {
          setShowSectionProgress(false);
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
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
        {/* Left Panel - Form */}
        <ResizablePanel
          ref={leftPanelRef}
          defaultSize={35}
          minSize={20}
          maxSize={50}
          collapsible
          collapsedSize={0}
          onCollapse={() => setLeftPanelCollapsed(true)}
          onExpand={() => setLeftPanelCollapsed(false)}
          className="relative"
        >
          <div className="h-full border-r border-border bg-card overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-card-foreground">Meta-Analysis Extractor</h1>
                  <p className="text-sm text-muted-foreground">Study-centric data extraction for systematic reviews</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => leftPanelRef.current?.collapse()}
                  className="h-8 w-8 shrink-0"
                  title="Collapse panel (Esc to restore)"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
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

            {showSectionProgress && (
              <SectionDetectionProgress
                sections={detectedSections}
                currentPage={currentPage}
                totalPages={totalPages}
                isProcessing={isCreatingStudy}
              />
            )}

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
              studyName={currentStudy?.name}
            />
          </div>
        </ResizablePanel>

        {/* Collapsed Left Panel Indicator */}
        {leftPanelCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => leftPanelRef.current?.expand()}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-50 h-24 w-8 rounded-none rounded-r-md border-r border-border bg-card hover:bg-muted shadow-sm"
              >
                <div className="flex flex-col items-center gap-1">
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-[10px] font-medium writing-mode-vertical">Form</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand Form Panel</p>
            </TooltipContent>
          </Tooltip>
        )}

        <ResizableHandle withHandle className="hover:bg-primary/20 transition-colors" />

        {/* Center Panel - PDF Viewer */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col bg-muted/30">
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
            onAnnotationsChange={setPdfAnnotations}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hover:bg-primary/20 transition-colors" />

        {/* Collapsed Right Panel Indicator */}
        {rightPanelCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => rightPanelRef.current?.expand()}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-50 h-24 w-8 rounded-none rounded-l-md border-l border-border bg-card hover:bg-muted shadow-sm"
              >
                <div className="flex flex-col items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-[10px] font-medium writing-mode-vertical">Trace</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Expand Trace Log Panel</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Right Panel - Trace Log */}
        <ResizablePanel
          ref={rightPanelRef}
          defaultSize={25}
          minSize={20}
          maxSize={40}
          collapsible
          collapsedSize={0}
          onCollapse={() => setRightPanelCollapsed(true)}
          onExpand={() => setRightPanelCollapsed(false)}
          className="relative"
        >
          <div className="h-full border-l border-border bg-card overflow-y-auto flex flex-col">
            <div className="p-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => rightPanelRef.current?.collapse()}
                  className="h-8 w-8 shrink-0"
                  title="Collapse panel (Esc to restore)"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
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
              <>
                <ExportDialog
                  studyId={currentStudy.id}
                  studyName={currentStudy.name}
                  annotations={pdfAnnotations}
                />
                <BulkStudyExportDialog
                  studies={studies}
                  currentStudyAnnotations={pdfAnnotations}
                  currentStudyId={currentStudy.id}
                />
              </>
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
    </TooltipProvider>
  );
};

export default Index;
