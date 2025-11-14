import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, Plus, Trash2, Loader2, Check, AlertCircle, Save, Cloud, CloudOff, Download, AlertTriangle, FileDown } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValidationSummary } from "./ValidationSummary";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ExtractButton } from "./ExtractButton";
import { ExtractionPreview } from "./ExtractionPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ConflictResolutionDashboard } from "./ConflictResolutionDashboard";
import { ReviewerSettingsDialog } from "./ReviewerSettingsDialog";
import { ExtractionMethodInfo } from "./ExtractionMethodInfo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Info } from "lucide-react";
import { ExportDialog } from "./ExportDialog";
import { ReviewerCountSelector } from "./ReviewerCountSelector";
import { ExtractionSettingsDialog } from "./ExtractionSettingsDialog";
import { Step1StudyId } from "./extraction-steps/Step1StudyId";
import { Step2PICOT } from "./extraction-steps/Step2PICOT";
import { Step3Baseline } from "./extraction-steps/Step3Baseline";
import { Step4Imaging } from "./extraction-steps/Step4Imaging";
import { Step5Interventions } from "./extraction-steps/Step5Interventions";
import { Step6StudyArms } from "./extraction-steps/Step6StudyArms";
import { Step7Outcomes } from "./extraction-steps/Step7Outcomes";
import { Step8Complications } from "./extraction-steps/Step8Complications";
import { ExtractionQualityScore } from "./ExtractionQualityScore";
import { validateCrossStepData, getAutoFix } from "@/lib/crossStepValidation";
import type { ValidationWarning } from "@/lib/crossStepValidation";
import { ValidationWarningCard } from "./ValidationWarningCard";

interface ExtractionFormProps {
  activeField: string | null;
  onFieldFocus: (field: string | null) => void;
  extractions: ExtractionEntry[];
  pdfLoaded: boolean;
  onExtraction: (entry: ExtractionEntry) => void;
  pdfText?: string;
  studyId?: string;
  studyName?: string;
}

interface StudyArm {
  id: string;
  name: string;
  description: string;
  n: string;
}

interface Indication {
  id: string;
  text: string;
}

interface Intervention {
  id: string;
  type: string;
  details: string;
}

interface MortalityData {
  id: string;
  timepoint: string;
  overallN: string;
  overallPercent: string;
  armData: { armId: string; n: string; percent: string }[];
}

interface MRSData {
  id: string;
  timepoint: string;
  armData: { armId: string; mRS0: string; mRS1: string; mRS2: string; mRS3: string; mRS4: string; mRS5: string; mRS6: string; }[];
}

interface Complication {
  id: string;
  name: string;
  overallRate: string;
  armData: { armId: string; rate: string }[];
}

interface Predictor {
  id: string;
  variable: string;
  outcome: string;
  statisticalMeasure: string;
}

const STEPS = [
  { id: 1, title: "Study ID" },
  { id: 2, title: "PICO-T" },
  { id: 3, title: "Baseline" },
  { id: 4, title: "Imaging" },
  { id: 5, title: "Interventions" },
  { id: 6, title: "Study Arms" },
  { id: 7, title: "Outcomes" },
  { id: 8, title: "Complications" },
];

export const ExtractionForm = ({
  activeField,
  onFieldFocus,
  extractions,
  pdfLoaded,
  onExtraction,
  pdfText,
  studyId,
  studyName
}: ExtractionFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isExtractingPICOT, setIsExtractingPICOT] = useState(false);
  const [numReviewers, setNumReviewers] = useState(3); // NEW: Dynamic reviewer count
  
  // AI Extraction state
  const [isExtractingStep, setIsExtractingStep] = useState<Record<number, boolean>>({});
  const [isExtractingAll, setIsExtractingAll] = useState(false);
  const [isExtractingMultiModel, setIsExtractingMultiModel] = useState(false);
  const [confidenceScores, setConfidenceScores] = useState<Record<string, {
    confidence: number;
    sourceSection: string;
    sourceText: string;
  }>>({});
  const [previewData, setPreviewData] = useState<{
    extractedData: Record<string, string>;
    confidenceScores: Record<string, any>;
    stepNumber: number;
    stepTitle: string;
  } | null>(null);
  const [showConflictDashboard, setShowConflictDashboard] = useState(false);
  const [multiModelResults, setMultiModelResults] = useState<any>(null);
  const [showReviewerSettings, setShowReviewerSettings] = useState(false);
  const [showMethodInfo, setShowMethodInfo] = useState(false);
  
  // Validation state
  const [validationResults, setValidationResults] = useState<Record<string, {
    isValid: boolean;
    confidence: number;
    issues: string[];
    suggestions: string;
    sourceText: string;
  }>>({});
  const [validatingFields, setValidatingFields] = useState<Set<string>>(new Set());
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
  
  // Cross-step validation state
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<number>>(new Set());
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<string>('');
  
  // Dynamic lists
  const [studyArms, setStudyArms] = useState<StudyArm[]>([]);
  const [indications, setIndications] = useState<Indication[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [mortalityData, setMortalityData] = useState<MortalityData[]>([]);
  const [mrsData, setMRSData] = useState<MRSData[]>([]);
  const [complications, setComplications] = useState<Complication[]>([]);
  const [predictors, setPredictors] = useState<Predictor[]>([]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBulkUpdate = (updates: Record<string, string>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Check if inclusion criteria met for disabling subsequent steps
  const inclusionMet = formData["inclusion-met"];
  const isExtractionStopped = inclusionMet === "false";

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldValue = (field: string) => {
    const extraction = extractions.find(e => e.fieldName === field);
    return extraction?.text || formData[field] || "";
  };

  // Study Arms Management
  const addArm = () => {
    setStudyArms([...studyArms, { 
      id: `arm-${Date.now()}`, 
      name: "", 
      description: "", 
      n: "" 
    }]);
  };

  const removeArm = (id: string) => {
    setStudyArms(studyArms.filter(arm => arm.id !== id));
  };

  const updateArm = (id: string, field: keyof StudyArm, value: string) => {
    setStudyArms(studyArms.map(arm => 
      arm.id === id ? { ...arm, [field]: value } : arm
    ));
  };

  // Indications Management
  const addIndication = () => {
    setIndications([...indications, { id: `ind-${Date.now()}`, text: "" }]);
  };

  const removeIndication = (id: string) => {
    setIndications(indications.filter(ind => ind.id !== id));
  };

  const updateIndication = (id: string, text: string) => {
    setIndications(indications.map(ind => 
      ind.id === id ? { ...ind, text } : ind
    ));
  };

  // Interventions Management
  const addIntervention = () => {
    setInterventions([...interventions, { 
      id: `int-${Date.now()}`, 
      type: "", 
      details: "" 
    }]);
  };

  const removeIntervention = (id: string) => {
    setInterventions(interventions.filter(int => int.id !== id));
  };

  const updateIntervention = (id: string, field: keyof Intervention, value: string) => {
    setInterventions(interventions.map(int => 
      int.id === id ? { ...int, [field]: value } : int
    ));
  };

  // Mortality Management
  const addMortality = () => {
    setMortalityData([...mortalityData, {
      id: `mort-${Date.now()}`,
      timepoint: "",
      overallN: "",
      overallPercent: "",
      armData: studyArms.map(arm => ({ armId: arm.id, n: "", percent: "" }))
    }]);
  };

  const removeMortality = (id: string) => {
    setMortalityData(mortalityData.filter(m => m.id !== id));
  };

  const updateMortalityField = (id: string, field: string, value: string) => {
    setMortalityData(mortalityData.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const updateMortalityArmData = (mortalityId: string, armId: string, field: string, value: string) => {
    setMortalityData(mortalityData.map(m => 
      m.id === mortalityId 
        ? { 
            ...m, 
            armData: m.armData.map(a => 
              a.armId === armId ? { ...a, [field]: value } : a
            )
          }
        : m
    ));
  };

  // MRS Management
  const addMRS = () => {
    setMRSData([...mrsData, {
      id: `mrs-${Date.now()}`,
      timepoint: "",
      armData: studyArms.map(arm => ({ 
        armId: arm.id, 
        mRS0: "", mRS1: "", mRS2: "", mRS3: "", mRS4: "", mRS5: "", mRS6: ""
      }))
    }]);
  };

  const removeMRS = (id: string) => {
    setMRSData(mrsData.filter(m => m.id !== id));
  };

  const updateMRSField = (mrsId: string, armId: string, field: string, value: string) => {
    setMRSData(mrsData.map(m => 
      m.id === mrsId 
        ? { 
            ...m, 
            armData: m.armData.map(a => 
              a.armId === armId 
                ? { ...a, [field]: value }
                : a
            )
          }
        : m
    ));
  };

  // Complications Management
  const addComplication = () => {
    setComplications([...complications, {
      id: `comp-${Date.now()}`,
      name: "",
      overallRate: "",
      armData: studyArms.map(arm => ({ armId: arm.id, rate: "" }))
    }]);
  };

  const removeComplication = (id: string) => {
    setComplications(complications.filter(c => c.id !== id));
  };

  const updateComplicationField = (id: string, field: string, value: string) => {
    setComplications(complications.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const updateComplicationArmData = (compId: string, armId: string, value: string) => {
    setComplications(complications.map(c => 
      c.id === compId 
        ? { 
            ...c, 
            armData: c.armData.map(a => 
              a.armId === armId ? { ...a, rate: value } : a
            )
          }
        : c
    ));
  };

  // Predictors Management
  const addPredictor = () => {
    setPredictors([...predictors, {
      id: `pred-${Date.now()}`,
      variable: "",
      outcome: "",
      statisticalMeasure: ""
    }]);
  };

  const removePredictor = (id: string) => {
    setPredictors(predictors.filter(p => p.id !== id));
  };

  const updatePredictor = (id: string, field: keyof Predictor, value: string) => {
    setPredictors(predictors.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const validateField = async (fieldName: string) => {
    const fieldValue = getFieldValue(fieldName);
    if (!fieldValue || !pdfText) {
      toast.error("Field is empty or PDF not loaded");
      return;
    }

    setValidatingFields(prev => new Set(prev).add(fieldName));

    try {
      const { data, error } = await supabase.functions.invoke('validate-extraction', {
        body: { fieldName, fieldValue, pdfText }
      });

      if (error) throw error;

      setValidationResults(prev => ({
        ...prev,
        [fieldName]: data
      }));

      toast.success(
        data.isValid 
          ? `✓ Validated (${data.confidence}% confidence)` 
          : `⚠ Issues found: ${data.issues.join(", ")}`
      );
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Validation failed");
    } finally {
      setValidatingFields(prev => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
  };

  const getFieldValidationStatus = (fieldName: string) => {
    const result = validationResults[fieldName];
    if (!result) return null;
    
    if (result.isValid && result.confidence >= 80) return 'valid';
    if (result.confidence >= 50) return 'warning';
    return 'invalid';
  };

  const getFieldClassName = (fieldName: string, baseClass: string = '') => {
    const status = getFieldValidationStatus(fieldName);
    let statusClass = '';
    
    if (status === 'valid') statusClass = 'border-green-500 bg-green-50/50 dark:bg-green-950/20';
    else if (status === 'warning') statusClass = 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
    else if (status === 'invalid') statusClass = 'border-red-500 bg-red-50/50 dark:bg-red-950/20';
    
    return `${baseClass} ${statusClass}`.trim();
  };

  const renderValidationButton = (fieldName: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => validateField(fieldName)}
      disabled={validatingFields.has(fieldName) || !pdfText}
      title="Validate against PDF"
    >
      {validatingFields.has(fieldName) ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : getFieldValidationStatus(fieldName) === 'valid' ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : getFieldValidationStatus(fieldName) === 'invalid' ? (
        <AlertCircle className="h-4 w-4 text-red-600" />
      ) : getFieldValidationStatus(fieldName) === 'warning' ? (
        <AlertCircle className="h-4 w-4 text-yellow-600" />
      ) : (
        <Check className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );

  const renderConfidenceBadge = (fieldName: string) => {
    const confidence = confidenceScores[fieldName];
    if (!confidence) return null;
    
    return (
      <ConfidenceBadge
        confidence={confidence.confidence}
        sourceSection={confidence.sourceSection}
        sourceText={confidence.sourceText}
        className="ml-2"
      />
    );
  };

  // AI Extraction functions
  const handleExtractStep = async (stepNumber: number) => {
    if (!pdfText) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsExtractingStep(prev => ({ ...prev, [stepNumber]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("extract-form-step", {
        body: { 
          stepNumber, 
          pdfText, 
          studyId
        }
      });

      if (error) throw error;

      const { extractedData, confidenceScores: scores } = data;
      
      // Show preview dialog
      setPreviewData({
        extractedData,
        confidenceScores: scores,
        stepNumber,
        stepTitle: STEPS[stepNumber - 1]?.title || 'Unknown Step'
      });

    } catch (error: any) {
      console.error("Extraction error:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please wait a moment.");
      } else if (error.message?.includes("credits")) {
        toast.error("AI credits depleted. Please add credits.");
      } else {
        toast.error("Extraction failed: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsExtractingStep(prev => ({ ...prev, [stepNumber]: false }));
    }
  };

  const handleMultiModelExtract = async (stepNumber: number) => {
    if (!pdfText || !studyId) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsExtractingMultiModel(true);

    // Create a temporary extraction entry to store reviews
    const extractionId = `multi-${stepNumber}-${Date.now()}`;

    try {
      const { data, error } = await supabase.functions.invoke("multi-model-extract", {
        body: { 
          stepNumber, 
          pdfText, 
          studyId,
          extractionId,
          numReviewers
        }
      });

      if (error) throw error;

      setMultiModelResults(data);

      const { consensus, summary, conflicts } = data;

      // Apply consensus values to form
      const extractedData: Record<string, string> = {};
      Object.entries(consensus).forEach(([fieldName, consensusData]: [string, any]) => {
        if (consensusData.value !== null) {
          extractedData[fieldName] = JSON.stringify(consensusData.value);
        }
      });

      setFormData(prev => ({ ...prev, ...extractedData }));

      // Create extraction entries for fields
      Object.entries(extractedData).forEach(([field, value]) => {
        onExtraction({
          id: `multi-ai-${field}-${Date.now()}`,
          fieldName: field,
          text: value,
          page: 1,
          method: "ai",
          timestamp: new Date(),
          confidence_score: Math.round(summary.averageConfidence)
        });
      });

      if (conflicts.length > 0) {
        toast.warning(`Extraction complete with ${conflicts.length} conflict(s). Review recommended.`, {
          action: {
            label: "Review Conflicts",
            onClick: () => setShowConflictDashboard(true)
          }
        });
      } else {
        toast.success(`Multi-model extraction complete! Average confidence: ${Math.round(summary.averageConfidence)}%`);
      }

    } catch (error: any) {
      console.error("Multi-model extraction error:", error);
      toast.error("Multi-model extraction failed: " + (error.message || "Unknown error"));
    } finally {
      setIsExtractingMultiModel(false);
    }
  };

  const handleAcceptExtraction = (selectedFields: string[]) => {
    if (!previewData) return;

    const { extractedData, confidenceScores: scores } = previewData;
    
    // Update form data with selected fields
    const updates: Record<string, string> = {};
    selectedFields.forEach(field => {
      if (extractedData[field]) {
        updates[field] = extractedData[field];
      }
    });
    
    setFormData(prev => ({ ...prev, ...updates }));
    setConfidenceScores(prev => ({ ...prev, ...scores }));
    
    // Create extraction entries for trace log
    selectedFields.forEach(field => {
      if (extractedData[field] && extractedData[field] !== "Not specified") {
        onExtraction({
          id: `ai-${field}-${Date.now()}`,
          fieldName: field,
          text: String(extractedData[field]),
          page: 1,
          method: "ai",
          timestamp: new Date(),
          confidence_score: scores[field]?.confidence || 70
        });
      }
    });

    toast.success(`Extracted ${selectedFields.length} fields successfully!`);
    setPreviewData(null);
  };

  const handleRejectExtraction = () => {
    toast.info("Extraction cancelled");
    setPreviewData(null);
  };

  const handleExtractAll = async () => {
    if (!pdfText) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsExtractingAll(true);
    const stepsToExtract = [1, 3, 4, 5, 6, 7, 8]; // Skip step 2 (PICO-T has its own button)

    try {
      const promises = stepsToExtract.map(stepNumber => 
        supabase.functions.invoke("extract-form-step", {
          body: { stepNumber, pdfText, studyId }
        })
      );

      const results = await Promise.allSettled(promises);
      
      let successCount = 0;
      const allExtractedData: Record<string, string> = {};
      const allConfidenceScores: Record<string, any> = {};

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          successCount++;
          const { extractedData, confidenceScores } = result.value.data;
          Object.assign(allExtractedData, extractedData);
          Object.assign(allConfidenceScores, confidenceScores);
        } else {
          console.error(`Step ${stepsToExtract[index]} failed:`, result);
        }
      });

      if (successCount > 0) {
        setFormData(prev => ({ ...prev, ...allExtractedData }));
        setConfidenceScores(prev => ({ ...prev, ...allConfidenceScores }));

        Object.entries(allExtractedData).forEach(([field, value]) => {
          if (value && value !== "Not specified") {
            onExtraction({
              id: `ai-${field}-${Date.now()}`,
              fieldName: field,
              text: String(value),
              page: 1,
              method: "ai",
              timestamp: new Date(),
              confidence_score: allConfidenceScores[field]?.confidence || 70
            });
          }
        });

        toast.success(`Extracted data from ${successCount} steps successfully!`);
      } else {
        toast.error("All extractions failed");
      }
    } catch (error) {
      console.error("Batch extraction error:", error);
      toast.error("Batch extraction failed");
    } finally {
      setIsExtractingAll(false);
    }
  };

  const renderValidationAlert = (fieldName: string) => {
    const result = validationResults[fieldName];
    if (!result || result.isValid) return null;

    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Issues:</strong> {result.issues.join(", ")}
          {result.suggestions && (
            <>
              <br />
              <strong>Suggestion:</strong> {result.suggestions}
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const handleGeneratePICOT = async () => {
    if (!pdfText || pdfText.trim().length === 0) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsExtractingPICOT(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-picot", {
        body: { pdfText, studyId }
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Failed to extract PICO-T framework");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const { picot } = data;
      
      setFormData(prev => ({
        ...prev,
        population: picot.population,
        intervention: picot.intervention,
        comparator: picot.comparator,
        outcomes: picot.outcomes,
        timing: picot.timing
      }));

      const timestamp = new Date();
      const picotFields = [
        { name: "population", value: picot.population },
        { name: "intervention", value: picot.intervention },
        { name: "comparator", value: picot.comparator },
        { name: "outcomes", value: picot.outcomes },
        { name: "timing", value: picot.timing }
      ];

      picotFields.forEach((field) => {
        onExtraction({
          id: `picot-ai-${field.name}-${Date.now()}`,
          fieldName: field.name,
          text: field.value,
          page: 1,
          method: "ai",
          timestamp
        });
      });

      toast.success("PICO-T framework extracted successfully!");
    } catch (error) {
      console.error("Error extracting PICO-T:", error);
      toast.error("An error occurred during extraction");
    } finally {
      setIsExtractingPICOT(false);
    }
  };

  // Auto-save functionality
  const saveFormData = async () => {
    if (!studyId) return;

    const currentDataStr = JSON.stringify({
      formData,
      studyArms,
      indications,
      interventions,
      mortalityData,
      mrsData,
      complications,
      predictors,
      currentStep,
      validationResults
    });

    // Skip if data hasn't changed
    if (currentDataStr === lastFormDataRef.current) {
      return;
    }

    setSaveStatus('saving');

    try {
      // Generate a unique extraction_id for this autosave
      const extractionId = `autosave-${studyId}`;
      
      // Get current user ID for insertion
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user for autosave");
        return;
      }
      
      // Save form progress to database
      const { error } = await supabase
        .from('extractions')
        .insert({
          extraction_id: extractionId,
          study_id: studyId,
          user_id: user.id,
          field_name: 'form_progress',
          text: currentDataStr,
          method: 'autosave'
        });

      if (error) throw error;

      lastFormDataRef.current = currentDataStr;
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      toast.error('Failed to auto-save progress');
    }
  };

  // Trigger auto-save on form data changes with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('unsaved');

    saveTimeoutRef.current = setTimeout(() => {
      saveFormData();
    }, 3000); // Save after 3 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, studyArms, indications, interventions, mortalityData, mrsData, complications, predictors, currentStep]);

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      if (!studyId) return;

      try {
        const { data, error } = await supabase
          .from('extractions')
          .select('text')
          .eq('study_id', studyId)
          .eq('field_name', 'form_progress')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            console.error('Load error:', error);
          }
          return;
        }

        if (data?.text) {
          const savedData = JSON.parse(data.text);
          setFormData(savedData.formData || {});
          setStudyArms(savedData.studyArms || []);
          setIndications(savedData.indications || []);
          setInterventions(savedData.interventions || []);
          setMortalityData(savedData.mortalityData || []);
          setMRSData(savedData.mrsData || []);
          setComplications(savedData.complications || []);
          setPredictors(savedData.predictors || []);
          setCurrentStep(savedData.currentStep || 1);
          setValidationResults(savedData.validationResults || {});
          
          lastFormDataRef.current = data.text;
          setLastSaved(new Date());
          toast.success('Previous progress restored');
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, [studyId]);

  // Run cross-step validation when relevant data changes
  useEffect(() => {
    const dataToValidate = {
      ...formData,
      studyArms,
      mortalityData,
      mrsData
    };
    
    const warnings = validateCrossStepData(dataToValidate);
    setValidationWarnings(warnings);
    
    // Clear dismissed warnings when new warnings appear
    if (warnings.length > 0) {
      setDismissedWarnings(new Set());
    }
  }, [formData, studyArms, mortalityData, mrsData]);

  const handleAutoFix = (warning: ValidationWarning) => {
    const dataToFix = {
      ...formData,
      studyArms,
      mortalityData,
      mrsData
    };
    
    const fix = getAutoFix(warning, dataToFix);
    
    if (!fix) {
      toast.error("Could not auto-fix this warning");
      return;
    }
    
    // Apply the fix
    if (fix.studyArms) {
      setStudyArms(fix.studyArms);
      toast.success("Study arms adjusted to match total N");
    } else {
      setFormData(prev => ({ ...prev, ...fix }));
      toast.success(`Auto-fixed: ${warning.field}`);
    }
  };

  const handleDismissWarning = (index: number) => {
    setDismissedWarnings(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };

  // Filter out dismissed warnings
  const activeWarnings = validationWarnings.filter((_, index) => !dismissedWarnings.has(index));

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'saved':
        return <Cloud className="h-3 w-3 text-green-500" />;
      case 'error':
        return <CloudOff className="h-3 w-3 text-red-500" />;
      case 'unsaved':
        return <Save className="h-3 w-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${formatTimeSince(lastSaved)}` : 'Saved';
      case 'error':
        return 'Save failed';
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return '';
    }
  };

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const exportAsJSON = () => {
    const exportData = {
      formData,
      studyArms,
      indications,
      interventions,
      mortalityData,
      mrsData,
      complications,
      predictors,
      currentStep,
      validationResults,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extraction-${studyId || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  };

  const exportAsCSV = () => {
    const flattenObject = (obj: any, prefix = ''): any => {
      return Object.keys(obj).reduce((acc: any, key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(acc, flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          acc[newKey] = JSON.stringify(value);
        } else {
          acc[newKey] = value ?? '';
        }
        return acc;
      }, {});
    };

    const flatData = flattenObject({
      ...formData,
      studyArms: studyArms,
      indications: indications,
      interventions: interventions,
      mortalityData: mortalityData,
      mrsData: mrsData,
      complications: complications,
      predictors: predictors
    });
    
    const headers = Object.keys(flatData);
    const values = Object.values(flatData);
    
    const csvContent = [
      headers.join(','),
      values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extraction-${studyId || 'data'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Save Status Indicator and Export Buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {getSaveStatusIcon()}
            <span>{getSaveStatusText()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsJSON}
              className="h-7 text-xs gap-1"
            >
              <Download className="h-3 w-3" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsCSV}
              className="h-7 text-xs gap-1"
            >
              <Download className="h-3 w-3" />
              CSV
            </Button>
            {studyId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={saveFormData}
                disabled={saveStatus === 'saving'}
                className="h-7 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Now
              </Button>
            )}
          </div>
        </div>

        {/* Validation Warnings with Auto-Fix */}
        {activeWarnings.length > 0 && (
          <ValidationWarningCard
            warnings={activeWarnings}
            onAutoFix={handleAutoFix}
            onDismiss={handleDismissWarning}
          />
        )}

        {/* Step Indicator and Quality Score */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </div>
            <div className="flex gap-1 mt-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    step.id === currentStep
                      ? "bg-primary"
                      : step.id < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-64">
            <ExtractionQualityScore 
              formData={formData}
              validatedFields={validatedFields}
            />
          </div>
        </div>

        {/* Validation Summary Panel */}
        <ValidationSummary 
          validationResults={validationResults}
          formData={formData}
          currentStep={currentStep}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">{STEPS[currentStep - 1]?.title || 'Extraction Step'}</h2>
              <p className="text-sm text-muted-foreground">
                {pdfLoaded ? "Click on a field, then select text from the PDF" : "Load a PDF to begin extraction"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentStep !== 2 && ( // Step 2 (PICO-T) has its own extraction button
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <ExtractButton
                            onClick={() => handleExtractStep(currentStep)}
                            isLoading={isExtractingStep[currentStep] || false}
                            disabled={!pdfLoaded || isExtractingAll || isExtractingMultiModel}
                            size="sm"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-medium mb-1">Single AI Extraction</p>
                        <p className="text-xs text-muted-foreground">
                          Quick extraction using Gemini Flash. Faster and uses fewer credits. 
                          Best for straightforward data extraction.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <ExtractButton
                            onClick={() => handleMultiModelExtract(currentStep)}
                            isLoading={isExtractingMultiModel}
                            disabled={!pdfLoaded || isExtractingAll || isExtractingStep[currentStep]}
                            variant="default"
                            size="sm"
                          >
                            Multi-AI Review
                          </ExtractButton>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-medium mb-1">Multi-AI Review (8 Models)</p>
                        <p className="text-xs text-muted-foreground">
                          Advanced extraction using 8 specialized AI models working in parallel. 
                          Provides consensus-based results with conflict detection. 
                          More accurate but uses more credits and takes longer (~20-30s).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setShowMethodInfo(true)}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compare extraction methods</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setShowReviewerSettings(true)}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                        >
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Configure AI reviewers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              {currentStep === 1 && (
                <>
                  <ExtractButton
                    onClick={handleExtractAll}
                    isLoading={isExtractingAll}
                    disabled={!pdfLoaded || isExtractingMultiModel}
                    variant="outline"
                    size="sm"
                  >
                    Extract All Steps
                  </ExtractButton>
                  <Button
                    onClick={() => setShowConflictDashboard(true)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Review Conflicts
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* STEP 1: STUDY ID */}
            {currentStep === 1 && (
              <Step1StudyId
                formData={formData}
                onUpdate={handleBulkUpdate}
                onFieldFocus={onFieldFocus}
              />
            )}

            {/* STEP 2: PICO-T */}
            {currentStep === 2 && (
              <Step2PICOT
                formData={formData}
                onUpdate={handleBulkUpdate}
                onFieldFocus={onFieldFocus}
                pdfText={pdfText}
                studyId={studyId}
              />
            )}

            {/* STEP 3: BASELINE */}
            {currentStep === 3 && (
              <Step3Baseline
                formData={formData}
                onUpdate={handleBulkUpdate}
                onFieldFocus={onFieldFocus}
                disabled={isExtractionStopped}
              />
            )}

            {/* STEP 4: IMAGING */}
            {currentStep === 4 && (
              <Step4Imaging
                formData={formData}
                onUpdate={handleBulkUpdate}
                onFieldFocus={onFieldFocus}
                disabled={isExtractionStopped}
              />
            )}

            {currentStep === 5 && (
              <Step5Interventions
                indications={indications}
                interventions={interventions}
                addIndication={addIndication}
                updateIndication={updateIndication}
                removeIndication={removeIndication}
                addIntervention={addIntervention}
                updateIntervention={updateIntervention}
                removeIntervention={removeIntervention}
                disabled={isExtractionStopped}
              />
            )}

            {currentStep === 6 && (
              <Step6StudyArms
                studyArms={studyArms}
                addArm={addArm}
                updateArm={updateArm}
                removeArm={removeArm}
                disabled={isExtractionStopped}
              />
            )}

            {currentStep === 7 && (
              <Step7Outcomes
                mortalityData={mortalityData}
                mrsData={mrsData}
                studyArms={studyArms}
                addMortality={addMortality}
                updateMortalityField={updateMortalityField}
                updateMortalityArmData={updateMortalityArmData}
                removeMortality={removeMortality}
                addMRS={addMRS}
                updateMRSField={updateMRSField}
                removeMRS={removeMRS}
                disabled={isExtractionStopped}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="sticky bottom-0 p-4 bg-background border-t flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </div>
        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          studyId && studyName ? (
            <ExportDialog studyId={studyId} studyName={studyName}>
              <Button className="gap-2" onClick={async () => {
                setSaveStatus('saving');
                await saveFormData();
                toast.success('Form data saved successfully');
              }}>
                <FileDown className="h-4 w-4" />
                Save & Export
              </Button>
            </ExportDialog>
          ) : (
            <Button className="gap-2" disabled>
              <FileDown className="h-4 w-4" />
              Save & Export
            </Button>
          )
        )}
      </div>
      
      {/* Extraction Preview Dialog */}
      {previewData && (
        <ExtractionPreview
          open={!!previewData}
          onOpenChange={(open) => !open && setPreviewData(null)}
          extractedData={previewData.extractedData}
          confidenceScores={previewData.confidenceScores}
          onAccept={handleAcceptExtraction}
          onReject={handleRejectExtraction}
          stepTitle={previewData.stepTitle}
        />
      )}

      {/* Conflict Resolution Dashboard */}
      <ConflictResolutionDashboard
        open={showConflictDashboard}
        onOpenChange={setShowConflictDashboard}
        studyId={studyId || ''}
      />

      {/* Reviewer Settings Dialog */}
      <ReviewerSettingsDialog
        open={showReviewerSettings}
        onOpenChange={setShowReviewerSettings}
      />

      {/* Extraction Method Info Dialog */}
      <ExtractionMethodInfo
        open={showMethodInfo}
        onOpenChange={setShowMethodInfo}
      />
    </div>
  );
};
