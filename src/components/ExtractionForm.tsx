import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, Plus, Trash2, Loader2, Check, AlertCircle, Save, Cloud, CloudOff, Download } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValidationSummary } from "./ValidationSummary";

interface ExtractionFormProps {
  activeField: string | null;
  onFieldFocus: (field: string | null) => void;
  extractions: ExtractionEntry[];
  pdfLoaded: boolean;
  onExtraction: (entry: ExtractionEntry) => void;
  pdfText?: string;
  studyId?: string;
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
  armData: { armId: string; scores: Record<string, string> }[];
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
  studyId
}: ExtractionFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isExtractingPICOT, setIsExtractingPICOT] = useState(false);
  
  // Validation state
  const [validationResults, setValidationResults] = useState<Record<string, {
    isValid: boolean;
    confidence: number;
    issues: string[];
    suggestions: string;
    sourceText: string;
  }>>({});
  const [validatingFields, setValidatingFields] = useState<Set<string>>(new Set());
  
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
        scores: { "0": "", "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" }
      }))
    }]);
  };

  const removeMRS = (id: string) => {
    setMRSData(mrsData.filter(m => m.id !== id));
  };

  const updateMRSTimepoint = (id: string, value: string) => {
    setMRSData(mrsData.map(m => 
      m.id === id ? { ...m, timepoint: value } : m
    ));
  };

  const updateMRSScore = (mrsId: string, armId: string, score: string, value: string) => {
    setMRSData(mrsData.map(m => 
      m.id === mrsId 
        ? { 
            ...m, 
            armData: m.armData.map(a => 
              a.armId === armId 
                ? { ...a, scores: { ...a.scores, [score]: value } }
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
        body: { pdfText }
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
      
      // Save form progress to database
      const { error } = await supabase
        .from('extractions')
        .upsert({
          extraction_id: extractionId,
          study_id: studyId,
          field_name: 'form_progress',
          text: currentDataStr,
          method: 'autosave',
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'extraction_id'
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

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </div>
          <div className="flex gap-1">
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

        {/* Validation Summary Panel */}
        <ValidationSummary 
          validationResults={validationResults}
          formData={formData}
          currentStep={currentStep}
        />

        <div>
          <h2 className="text-xl font-semibold mb-1">{STEPS[currentStep - 1].title}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {pdfLoaded ? "Click on a field, then select text from the PDF" : "Load a PDF to begin extraction"}
          </p>

          <div className="space-y-4">
            {/* STEP 1: STUDY ID */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="citation">Full Citation (Required)</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="citation"
                      value={getFieldValue("citation")}
                      onChange={(e) => handleFieldChange("citation", e.target.value)}
                      onFocus={() => onFieldFocus("citation")}
                      onBlur={() => onFieldFocus(null)}
                      className={`flex-1 ${activeField === "citation" ? "ring-2 ring-primary" : ""} ${getFieldClassName("citation")}`}
                      rows={3}
                      placeholder="Paste citation or title..."
                      required
                    />
                    {renderValidationButton("citation")}
                  </div>
                  {renderValidationAlert("citation")}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doi">DOI</Label>
                    <Input
                      id="doi"
                      value={getFieldValue("doi")}
                      onChange={(e) => handleFieldChange("doi", e.target.value)}
                      onFocus={() => onFieldFocus("doi")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "doi" ? "ring-2 ring-primary" : ""}
                      placeholder="10.1000/xyz123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pmid">PMID</Label>
                    <Input
                      id="pmid"
                      value={getFieldValue("pmid")}
                      onChange={(e) => handleFieldChange("pmid", e.target.value)}
                      onFocus={() => onFieldFocus("pmid")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "pmid" ? "ring-2 ring-primary" : ""}
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="journal">Journal</Label>
                    <Input
                      id="journal"
                      value={getFieldValue("journal")}
                      onChange={(e) => handleFieldChange("journal", e.target.value)}
                      onFocus={() => onFieldFocus("journal")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "journal" ? "ring-2 ring-primary" : ""}
                      placeholder="Journal name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={getFieldValue("year")}
                      onChange={(e) => handleFieldChange("year", e.target.value)}
                      onFocus={() => onFieldFocus("year")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "year" ? "ring-2 ring-primary" : ""}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={getFieldValue("country")}
                      onChange={(e) => handleFieldChange("country", e.target.value)}
                      onFocus={() => onFieldFocus("country")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "country" ? "ring-2 ring-primary" : ""}
                      placeholder="Study location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centers">Centers (e.g., Single, Multi)</Label>
                  <Input
                    id="centers"
                    value={getFieldValue("centers")}
                    onChange={(e) => handleFieldChange("centers", e.target.value)}
                    onFocus={() => onFieldFocus("centers")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "centers" ? "ring-2 ring-primary" : ""}
                    placeholder="Single-center or Multi-center"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funding">Funding Sources</Label>
                  <Textarea
                    id="funding"
                    value={getFieldValue("funding")}
                    onChange={(e) => handleFieldChange("funding", e.target.value)}
                    onFocus={() => onFieldFocus("funding")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "funding" ? "ring-2 ring-primary" : ""}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conflicts">Conflicts of Interest</Label>
                  <Textarea
                    id="conflicts"
                    value={getFieldValue("conflicts")}
                    onChange={(e) => handleFieldChange("conflicts", e.target.value)}
                    onFocus={() => onFieldFocus("conflicts")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "conflicts" ? "ring-2 ring-primary" : ""}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">Trial Registration ID</Label>
                  <Input
                    id="registration"
                    value={getFieldValue("registration")}
                    onChange={(e) => handleFieldChange("registration", e.target.value)}
                    onFocus={() => onFieldFocus("registration")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "registration" ? "ring-2 ring-primary" : ""}
                    placeholder="e.g., NCT12345678"
                  />
                </div>
              </>
            )}

            {/* STEP 2: PICO-T */}
            {currentStep === 2 && (
              <>
                <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">AI-Powered PICO-T Generation</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Let AI analyze your PDF and generate the PICO-T framework automatically
                      </p>
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={handleGeneratePICOT}
                        disabled={!pdfLoaded || isExtractingPICOT}
                      >
                        {isExtractingPICOT ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Generate PICO-T Summary
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="population">Population</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="population"
                      value={getFieldValue("population")}
                      onChange={(e) => handleFieldChange("population", e.target.value)}
                      onFocus={() => onFieldFocus("population")}
                      onBlur={() => onFieldFocus(null)}
                      className={`flex-1 ${activeField === "population" ? "ring-2 ring-primary" : ""} ${getFieldClassName("population")}`}
                      rows={3}
                    />
                    {renderValidationButton("population")}
                  </div>
                  {renderValidationAlert("population")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intervention">Intervention</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="intervention"
                      value={getFieldValue("intervention")}
                      onChange={(e) => handleFieldChange("intervention", e.target.value)}
                      onFocus={() => onFieldFocus("intervention")}
                      onBlur={() => onFieldFocus(null)}
                      className={`flex-1 ${activeField === "intervention" ? "ring-2 ring-primary" : ""} ${getFieldClassName("intervention")}`}
                      rows={3}
                    />
                    {renderValidationButton("intervention")}
                  </div>
                  {renderValidationAlert("intervention")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comparator">Comparator</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="comparator"
                      value={getFieldValue("comparator")}
                      onChange={(e) => handleFieldChange("comparator", e.target.value)}
                      onFocus={() => onFieldFocus("comparator")}
                      onBlur={() => onFieldFocus(null)}
                      className={`flex-1 ${activeField === "comparator" ? "ring-2 ring-primary" : ""} ${getFieldClassName("comparator")}`}
                      rows={2}
                    />
                    {renderValidationButton("comparator")}
                  </div>
                  {renderValidationAlert("comparator")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcomes">Outcomes Measured</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="outcomes"
                      value={getFieldValue("outcomes")}
                      onChange={(e) => handleFieldChange("outcomes", e.target.value)}
                      onFocus={() => onFieldFocus("outcomes")}
                      onBlur={() => onFieldFocus(null)}
                      className={`flex-1 ${activeField === "outcomes" ? "ring-2 ring-primary" : ""} ${getFieldClassName("outcomes")}`}
                      rows={3}
                    />
                    {renderValidationButton("outcomes")}
                  </div>
                  {renderValidationAlert("outcomes")}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timing">Timing/Follow-up</Label>
                    <Input
                      id="timing"
                      value={getFieldValue("timing")}
                      onChange={(e) => handleFieldChange("timing", e.target.value)}
                      onFocus={() => onFieldFocus("timing")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "timing" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studyType">Study Type (e.g., RCT, Cohort)</Label>
                    <Input
                      id="studyType"
                      value={getFieldValue("studyType")}
                      onChange={(e) => handleFieldChange("studyType", e.target.value)}
                      onFocus={() => onFieldFocus("studyType")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "studyType" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inclusionMet">Inclusion Criteria Met?</Label>
                  <Select
                    value={getFieldValue("inclusionMet")}
                    onValueChange={(value) => handleFieldChange("inclusionMet", value)}
                  >
                    <SelectTrigger className={activeField === "inclusionMet" ? "ring-2 ring-primary" : ""}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No (Stop Extraction)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* STEP 3: BASELINE */}
            {currentStep === 3 && (
              <>
                <h3 className="font-semibold text-base mt-4">Sample Size</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalN">Total N (Required)</Label>
                    <Input
                      id="totalN"
                      type="number"
                      value={getFieldValue("totalN")}
                      onChange={(e) => handleFieldChange("totalN", e.target.value)}
                      onFocus={() => onFieldFocus("totalN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "totalN" ? "ring-2 ring-primary" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surgicalN">Surgical N</Label>
                    <Input
                      id="surgicalN"
                      type="number"
                      value={getFieldValue("surgicalN")}
                      onChange={(e) => handleFieldChange("surgicalN", e.target.value)}
                      onFocus={() => onFieldFocus("surgicalN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "surgicalN" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="controlN">Control N</Label>
                    <Input
                      id="controlN"
                      type="number"
                      value={getFieldValue("controlN")}
                      onChange={(e) => handleFieldChange("controlN", e.target.value)}
                      onFocus={() => onFieldFocus("controlN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "controlN" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-base mt-6">Age Demographics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageMean">Age Mean</Label>
                    <Input
                      id="ageMean"
                      type="number"
                      step="0.1"
                      value={getFieldValue("ageMean")}
                      onChange={(e) => handleFieldChange("ageMean", e.target.value)}
                      onFocus={() => onFieldFocus("ageMean")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "ageMean" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageSD">Age SD</Label>
                    <Input
                      id="ageSD"
                      type="number"
                      step="0.1"
                      value={getFieldValue("ageSD")}
                      onChange={(e) => handleFieldChange("ageSD", e.target.value)}
                      onFocus={() => onFieldFocus("ageSD")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "ageSD" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageMedian">Age Median</Label>
                    <Input
                      id="ageMedian"
                      type="number"
                      step="0.1"
                      value={getFieldValue("ageMedian")}
                      onChange={(e) => handleFieldChange("ageMedian", e.target.value)}
                      onFocus={() => onFieldFocus("ageMedian")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "ageMedian" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageIQRLower">Age IQR (Lower/Q1)</Label>
                    <Input
                      id="ageIQRLower"
                      type="number"
                      step="0.1"
                      value={getFieldValue("ageIQRLower")}
                      onChange={(e) => handleFieldChange("ageIQRLower", e.target.value)}
                      onFocus={() => onFieldFocus("ageIQRLower")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "ageIQRLower" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageIQRUpper">Age IQR (Upper/Q3)</Label>
                    <Input
                      id="ageIQRUpper"
                      type="number"
                      step="0.1"
                      value={getFieldValue("ageIQRUpper")}
                      onChange={(e) => handleFieldChange("ageIQRUpper", e.target.value)}
                      onFocus={() => onFieldFocus("ageIQRUpper")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "ageIQRUpper" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-base mt-6">Gender</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maleN">Male N</Label>
                    <Input
                      id="maleN"
                      type="number"
                      value={getFieldValue("maleN")}
                      onChange={(e) => handleFieldChange("maleN", e.target.value)}
                      onFocus={() => onFieldFocus("maleN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "maleN" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="femaleN">Female N</Label>
                    <Input
                      id="femaleN"
                      type="number"
                      value={getFieldValue("femaleN")}
                      onChange={(e) => handleFieldChange("femaleN", e.target.value)}
                      onFocus={() => onFieldFocus("femaleN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "femaleN" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-base mt-6">Baseline Clinical Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prestrokeMRS">Pre-stroke mRS</Label>
                    <Input
                      id="prestrokeMRS"
                      type="number"
                      step="0.1"
                      value={getFieldValue("prestrokeMRS")}
                      onChange={(e) => handleFieldChange("prestrokeMRS", e.target.value)}
                      onFocus={() => onFieldFocus("prestrokeMRS")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "prestrokeMRS" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nihssMean">NIHSS Mean/Median</Label>
                    <Input
                      id="nihssMean"
                      type="number"
                      step="0.1"
                      value={getFieldValue("nihssMean")}
                      onChange={(e) => handleFieldChange("nihssMean", e.target.value)}
                      onFocus={() => onFieldFocus("nihssMean")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "nihssMean" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gcsMean">GCS Mean/Median</Label>
                    <Input
                      id="gcsMean"
                      type="number"
                      step="0.1"
                      value={getFieldValue("gcsMean")}
                      onChange={(e) => handleFieldChange("gcsMean", e.target.value)}
                      onFocus={() => onFieldFocus("gcsMean")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "gcsMean" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 4: IMAGING */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vascularTerritory">Vascular Territory</Label>
                  <Input
                    id="vascularTerritory"
                    value={getFieldValue("vascularTerritory")}
                    onChange={(e) => handleFieldChange("vascularTerritory", e.target.value)}
                    onFocus={() => onFieldFocus("vascularTerritory")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "vascularTerritory" ? "ring-2 ring-primary" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="infarctVolume">Infarct Volume</Label>
                    <Input
                      id="infarctVolume"
                      type="number"
                      step="0.1"
                      value={getFieldValue("infarctVolume")}
                      onChange={(e) => handleFieldChange("infarctVolume", e.target.value)}
                      onFocus={() => onFieldFocus("infarctVolume")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "infarctVolume" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="strokeVolumeCerebellum">Stroke Volume (Cerebellum)</Label>
                    <Input
                      id="strokeVolumeCerebellum"
                      value={getFieldValue("strokeVolumeCerebellum")}
                      onChange={(e) => handleFieldChange("strokeVolumeCerebellum", e.target.value)}
                      onFocus={() => onFieldFocus("strokeVolumeCerebellum")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "strokeVolumeCerebellum" ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-base mt-6">Edema Dynamics</h3>
                <div className="space-y-2">
                  <Label htmlFor="edemaDynamics">Edema Description</Label>
                  <Textarea
                    id="edemaDynamics"
                    value={getFieldValue("edemaDynamics")}
                    onChange={(e) => handleFieldChange("edemaDynamics", e.target.value)}
                    onFocus={() => onFieldFocus("edemaDynamics")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "edemaDynamics" ? "ring-2 ring-primary" : ""}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peakSwellingWindow">Peak Swelling Window</Label>
                  <Input
                    id="peakSwellingWindow"
                    value={getFieldValue("peakSwellingWindow")}
                    onChange={(e) => handleFieldChange("peakSwellingWindow", e.target.value)}
                    onFocus={() => onFieldFocus("peakSwellingWindow")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "peakSwellingWindow" ? "ring-2 ring-primary" : ""}
                  />
                </div>

                <h3 className="font-semibold text-base mt-6">Involvement Areas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brainstemInvolvement">Brainstem Involvement?</Label>
                    <Select
                      value={getFieldValue("brainstemInvolvement")}
                      onValueChange={(value) => handleFieldChange("brainstemInvolvement", value)}
                    >
                      <SelectTrigger className={activeField === "brainstemInvolvement" ? "ring-2 ring-primary" : ""}>
                        <SelectValue placeholder="Unknown" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Unknown</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supratentorialInvolvement">Supratentorial?</Label>
                    <Select
                      value={getFieldValue("supratentorialInvolvement")}
                      onValueChange={(value) => handleFieldChange("supratentorialInvolvement", value)}
                    >
                      <SelectTrigger className={activeField === "supratentorialInvolvement" ? "ring-2 ring-primary" : ""}>
                        <SelectValue placeholder="Unknown" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Unknown</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nonCerebellarStroke">Non-cerebellar?</Label>
                    <Select
                      value={getFieldValue("nonCerebellarStroke")}
                      onValueChange={(value) => handleFieldChange("nonCerebellarStroke", value)}
                    >
                      <SelectTrigger className={activeField === "nonCerebellarStroke" ? "ring-2 ring-primary" : ""}>
                        <SelectValue placeholder="Unknown" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Unknown</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 5: INTERVENTIONS */}
            {currentStep === 5 && (
              <>
                <h3 className="font-semibold text-base">Surgical Indications</h3>
                <div className="space-y-3">
                  {indications.map((indication) => (
                    <div key={indication.id} className="flex gap-2">
                      <Input
                        value={indication.text}
                        onChange={(e) => updateIndication(indication.id, e.target.value)}
                        placeholder="Enter surgical indication..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeIndication(indication.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIndication}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Indication
                  </Button>
                </div>

                <h3 className="font-semibold text-base mt-6">Interventions</h3>
                <div className="space-y-3">
                  {interventions.map((intervention) => (
                    <Card key={intervention.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={intervention.type}
                            onChange={(e) => updateIntervention(intervention.id, "type", e.target.value)}
                            placeholder="Intervention type..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeIntervention(intervention.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={intervention.details}
                          onChange={(e) => updateIntervention(intervention.id, "details", e.target.value)}
                          placeholder="Details..."
                          rows={2}
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIntervention}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Intervention Type
                  </Button>
                </div>
              </>
            )}

            {/* STEP 6: STUDY ARMS */}
            {currentStep === 6 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Define the distinct groups for comparison.
                </p>
                <div className="space-y-3">
                  {studyArms.map((arm) => (
                    <Card key={arm.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            value={arm.name}
                            onChange={(e) => updateArm(arm.id, "name", e.target.value)}
                            placeholder="Arm name (e.g., Surgical, Control)..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeArm(arm.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={arm.description}
                          onChange={(e) => updateArm(arm.id, "description", e.target.value)}
                          placeholder="Description of treatment..."
                          rows={2}
                        />
                        <Input
                          type="number"
                          value={arm.n}
                          onChange={(e) => updateArm(arm.id, "n", e.target.value)}
                          placeholder="N (sample size)"
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addArm}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Study Arm
                  </Button>
                </div>
              </>
            )}

            {/* STEP 7: OUTCOMES */}
            {currentStep === 7 && (
              <>
                <h3 className="font-semibold text-base">Mortality Data</h3>
                <div className="space-y-3">
                  {mortalityData.map((mortality) => (
                    <Card key={mortality.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Label>Timepoint</Label>
                            <Input
                              value={mortality.timepoint}
                              onChange={(e) => updateMortalityField(mortality.id, "timepoint", e.target.value)}
                              placeholder="e.g., 30 days, 90 days..."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="mt-6"
                            onClick={() => removeMortality(mortality.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>Overall N</Label>
                            <Input
                              type="number"
                              value={mortality.overallN}
                              onChange={(e) => updateMortalityField(mortality.id, "overallN", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Overall %</Label>
                            <Input
                              value={mortality.overallPercent}
                              onChange={(e) => updateMortalityField(mortality.id, "overallPercent", e.target.value)}
                            />
                          </div>
                        </div>
                        {studyArms.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">By Study Arm</Label>
                            {mortality.armData.map((armData) => {
                              const arm = studyArms.find(a => a.id === armData.armId);
                              return arm ? (
                                <div key={armData.armId} className="grid grid-cols-3 gap-2 items-center">
                                  <span className="text-sm">{arm.name || "Unnamed Arm"}</span>
                                  <Input
                                    type="number"
                                    value={armData.n}
                                    onChange={(e) => updateMortalityArmData(mortality.id, armData.armId, "n", e.target.value)}
                                    placeholder="N"
                                  />
                                  <Input
                                    value={armData.percent}
                                    onChange={(e) => updateMortalityArmData(mortality.id, armData.armId, "percent", e.target.value)}
                                    placeholder="%"
                                  />
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMortality}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mortality Data
                  </Button>
                </div>

                <h3 className="font-semibold text-base mt-6">Modified Rankin Scale (mRS)</h3>
                <div className="space-y-3">
                  {mrsData.map((mrs) => (
                    <Card key={mrs.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Label>Timepoint</Label>
                            <Input
                              value={mrs.timepoint}
                              onChange={(e) => updateMRSTimepoint(mrs.id, e.target.value)}
                              placeholder="e.g., 90 days, 1 year..."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="mt-6"
                            onClick={() => removeMRS(mrs.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {studyArms.length > 0 ? (
                          mrs.armData.map((armData) => {
                            const arm = studyArms.find(a => a.id === armData.armId);
                            return arm ? (
                              <div key={armData.armId} className="space-y-2 border-t pt-3">
                                <Label className="text-sm font-semibold">{arm.name || "Unnamed Arm"}</Label>
                                <div className="grid grid-cols-7 gap-1">
                                  {["0", "1", "2", "3", "4", "5", "6"].map((score) => (
                                    <div key={score} className="space-y-1">
                                      <Label className="text-xs">mRS {score}</Label>
                                      <Input
                                        value={armData.scores[score] || ""}
                                        onChange={(e) => updateMRSScore(mrs.id, armData.armId, score, e.target.value)}
                                        placeholder="n"
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">Add study arms first (Step 6)</p>
                        )}
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMRS}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add mRS Data
                  </Button>
                </div>
              </>
            )}

            {/* STEP 8: COMPLICATIONS */}
            {currentStep === 8 && (
              <>
                <h3 className="font-semibold text-base">Complications</h3>
                <div className="space-y-3">
                  {complications.map((comp) => (
                    <Card key={comp.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Label>Complication Name</Label>
                            <Input
                              value={comp.name}
                              onChange={(e) => updateComplicationField(comp.id, "name", e.target.value)}
                              placeholder="e.g., Infection, Hemorrhage..."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="mt-6"
                            onClick={() => removeComplication(comp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Overall Rate</Label>
                          <Input
                            value={comp.overallRate}
                            onChange={(e) => updateComplicationField(comp.id, "overallRate", e.target.value)}
                            placeholder="% or n/N"
                          />
                        </div>
                        {studyArms.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">By Study Arm</Label>
                            {comp.armData.map((armData) => {
                              const arm = studyArms.find(a => a.id === armData.armId);
                              return arm ? (
                                <div key={armData.armId} className="grid grid-cols-2 gap-2 items-center">
                                  <span className="text-sm">{arm.name || "Unnamed Arm"}</span>
                                  <Input
                                    value={armData.rate}
                                    onChange={(e) => updateComplicationArmData(comp.id, armData.armId, e.target.value)}
                                    placeholder="% or n/N"
                                  />
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addComplication}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Complication
                  </Button>
                </div>

                <h3 className="font-semibold text-base mt-6">Predictors of Outcome</h3>
                <div className="space-y-2">
                  <Label htmlFor="predictorsSummary">Summary of Key Findings / Predictors</Label>
                  <Textarea
                    id="predictorsSummary"
                    value={getFieldValue("predictorsSummary")}
                    onChange={(e) => handleFieldChange("predictorsSummary", e.target.value)}
                    onFocus={() => onFieldFocus("predictorsSummary")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "predictorsSummary" ? "ring-2 ring-primary" : ""}
                    rows={6}
                  />
                </div>

                <h4 className="font-semibold text-sm mt-6">Predictor Analysis</h4>
                <div className="space-y-3">
                  {predictors.map((pred) => (
                    <Card key={pred.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={pred.variable}
                            onChange={(e) => updatePredictor(pred.id, "variable", e.target.value)}
                            placeholder="Predictor variable..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removePredictor(pred.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={pred.outcome}
                          onChange={(e) => updatePredictor(pred.id, "outcome", e.target.value)}
                          placeholder="Associated outcome..."
                        />
                        <Input
                          value={pred.statisticalMeasure}
                          onChange={(e) => updatePredictor(pred.id, "statisticalMeasure", e.target.value)}
                          placeholder="Statistical measure (OR, HR, p-value)..."
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPredictor}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Predictor
                  </Button>
                </div>
              </>
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
          <Button className="gap-2">
            Save to Google Sheets
          </Button>
        )}
      </div>
    </div>
  );
};
