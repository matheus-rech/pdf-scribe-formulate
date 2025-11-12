import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Sparkles, Camera, Loader2 } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractionFormProps {
  activeField: string | null;
  onFieldFocus: (field: string | null) => void;
  extractions: ExtractionEntry[];
  pdfLoaded: boolean;
  onExtraction: (entry: ExtractionEntry) => void;
  pdfText?: string;
}

const STEPS = [
  { 
    id: 1, 
    title: "Study Identification", 
    fields: ["citation", "doi", "pmid", "journal", "year", "country", "centers", "funding"]
  },
  { 
    id: 2, 
    title: "PICO-T Framework", 
    fields: ["population", "intervention", "comparator", "outcomes", "timing", "studyType"]
  },
  { 
    id: 3, 
    title: "Demographics & Baseline", 
    fields: ["sampleSize", "treatmentN", "controlN", "age", "gender", "inclusionCriteria", "exclusionCriteria", "comorbidities"]
  },
  { 
    id: 4, 
    title: "Imaging & Volume Measurements", 
    fields: ["imagingModality", "hematomaVolume", "edemaVolume", "ivhVolume", "midlineShift", "hydrocephalus"]
  },
  { 
    id: 5, 
    title: "Treatment Details", 
    fields: ["surgicalProcedures", "surgicalTiming", "medicalManagement", "controlIntervention"]
  },
  { 
    id: 6, 
    title: "Outcomes & Functional Scales", 
    fields: ["primaryOutcome", "secondaryOutcomes", "followUpDuration", "mortality", "mRS0", "mRS1", "mRS2", "mRS3", "mRS4", "mRS5", "mRS6", "otherScales"]
  },
  { 
    id: 7, 
    title: "Adverse Events & Predictors", 
    fields: ["complications", "adverseEventsRate", "predictors", "statisticalSignificance"]
  },
  { 
    id: 8, 
    title: "Quality & Notes", 
    fields: ["strengths", "limitations", "biasAssessment", "qualityScore", "reviewerNotes"]
  },
];

export const ExtractionForm = ({
  activeField,
  onFieldFocus,
  extractions,
  pdfLoaded,
  onExtraction,
  pdfText
}: ExtractionFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isExtractingPICOT, setIsExtractingPICOT] = useState(false);

  const currentStepData = STEPS[currentStep - 1];

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

  // Auto-fill field from extractions
  const getFieldValue = (field: string) => {
    const extraction = extractions.find(e => e.fieldName === field);
    return extraction?.text || formData[field] || "";
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
      
      // Update form data with extracted PICO-T elements
      setFormData(prev => ({
        ...prev,
        population: picot.population,
        intervention: picot.intervention,
        comparator: picot.comparator,
        outcomes: picot.outcomes,
        timing: picot.timing
      }));

      // Create extraction entries for tracking
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

        <div>
          <h2 className="text-xl font-semibold mb-1">{currentStepData.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {pdfLoaded ? "Click on a field, then select text from the PDF" : "Load a PDF to begin extraction"}
          </p>

          <div className="space-y-4">
            {/* Step 1: Study Identification */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="citation">Citation</Label>
                  <Textarea
                    id="citation"
                    value={getFieldValue("citation")}
                    onChange={(e) => handleFieldChange("citation", e.target.value)}
                    onFocus={() => onFieldFocus("citation")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "citation" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Full study citation..."
                  />
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="centers">Centers</Label>
                    <Select
                      value={getFieldValue("centers")}
                      onValueChange={(value) => handleFieldChange("centers", value)}
                    >
                      <SelectTrigger
                        className={activeField === "centers" ? "ring-2 ring-primary" : ""}
                        onFocus={() => onFieldFocus("centers")}
                        onBlur={() => onFieldFocus(null)}
                      >
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single-center</SelectItem>
                        <SelectItem value="multi">Multi-center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funding">Funding Sources</Label>
                  <Input
                    id="funding"
                    value={getFieldValue("funding")}
                    onChange={(e) => handleFieldChange("funding", e.target.value)}
                    onFocus={() => onFieldFocus("funding")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "funding" ? "ring-2 ring-primary" : ""}
                    placeholder="Funding and conflicts of interest"
                  />
                </div>
              </>
            )}

            {/* Step 2: PICO-T Framework */}
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
                        className="gap-2 bg-gradient-to-r from-primary to-accent"
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
                            Generate PICO-T Framework
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="population">Population (P)</Label>
                  <Textarea
                    id="population"
                    value={getFieldValue("population")}
                    onChange={(e) => handleFieldChange("population", e.target.value)}
                    onFocus={() => onFieldFocus("population")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "population" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Who are the participants?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervention">Intervention (I)</Label>
                  <Textarea
                    id="intervention"
                    value={getFieldValue("intervention")}
                    onChange={(e) => handleFieldChange("intervention", e.target.value)}
                    onFocus={() => onFieldFocus("intervention")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "intervention" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="What is being tested?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparator">Comparator (C)</Label>
                  <Textarea
                    id="comparator"
                    value={getFieldValue("comparator")}
                    onChange={(e) => handleFieldChange("comparator", e.target.value)}
                    onFocus={() => onFieldFocus("comparator")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "comparator" ? "ring-2 ring-primary" : ""}
                    rows={2}
                    placeholder="What is it compared against?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcomes">Outcomes (O)</Label>
                  <Textarea
                    id="outcomes"
                    value={getFieldValue("outcomes")}
                    onChange={(e) => handleFieldChange("outcomes", e.target.value)}
                    onFocus={() => onFieldFocus("outcomes")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "outcomes" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="What are the measured outcomes?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timing">Timing (T)</Label>
                  <Input
                    id="timing"
                    value={getFieldValue("timing")}
                    onChange={(e) => handleFieldChange("timing", e.target.value)}
                    onFocus={() => onFieldFocus("timing")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "timing" ? "ring-2 ring-primary" : ""}
                    placeholder="Study duration and follow-up"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyType">Study Type</Label>
                  <Select
                    value={getFieldValue("studyType")}
                    onValueChange={(value) => handleFieldChange("studyType", value)}
                  >
                    <SelectTrigger
                      className={activeField === "studyType" ? "ring-2 ring-primary" : ""}
                      onFocus={() => onFieldFocus("studyType")}
                      onBlur={() => onFieldFocus(null)}
                    >
                      <SelectValue placeholder="Select study design..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rct">Randomized Controlled Trial (RCT)</SelectItem>
                      <SelectItem value="cohort">Cohort Study</SelectItem>
                      <SelectItem value="case-control">Case-Control Study</SelectItem>
                      <SelectItem value="cross-sectional">Cross-Sectional Study</SelectItem>
                      <SelectItem value="case-series">Case Series</SelectItem>
                      <SelectItem value="systematic-review">Systematic Review</SelectItem>
                      <SelectItem value="meta-analysis">Meta-Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Demographics & Baseline */}
            {currentStep === 3 && (
              <>
                <Card className="p-4 bg-info/5 border-info/20 mb-4">
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-info mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">💡 Tip: Capture Images from PDF</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Use <strong>Image Mode</strong> to capture figures, tables, or any visual content directly from the PDF
                      </p>
                      <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                        <li>Click the <strong>📷 Image</strong> button in the PDF toolbar</li>
                        <li>Select a field (any field can contain images)</li>
                        <li>Click and drag to select the region you want to capture</li>
                        <li>The image will be saved and displayed in the trace log</li>
                      </ol>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sampleSize">Total Sample Size</Label>
                    <Input
                      id="sampleSize"
                      type="number"
                      value={getFieldValue("sampleSize")}
                      onChange={(e) => handleFieldChange("sampleSize", e.target.value)}
                      onFocus={() => onFieldFocus("sampleSize")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "sampleSize" ? "ring-2 ring-primary" : ""}
                      placeholder="Total N"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatmentN">Treatment Group N</Label>
                    <Input
                      id="treatmentN"
                      type="number"
                      value={getFieldValue("treatmentN")}
                      onChange={(e) => handleFieldChange("treatmentN", e.target.value)}
                      onFocus={() => onFieldFocus("treatmentN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "treatmentN" ? "ring-2 ring-primary" : ""}
                      placeholder="n"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="controlN">Control Group N</Label>
                    <Input
                      id="controlN"
                      type="number"
                      value={getFieldValue("controlN")}
                      onChange={(e) => handleFieldChange("controlN", e.target.value)}
                      onFocus={() => onFieldFocus("controlN")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "controlN" ? "ring-2 ring-primary" : ""}
                      placeholder="n"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age (mean ± SD or median [IQR])</Label>
                  <Input
                    id="age"
                    value={getFieldValue("age")}
                    onChange={(e) => handleFieldChange("age", e.target.value)}
                    onFocus={() => onFieldFocus("age")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "age" ? "ring-2 ring-primary" : ""}
                    placeholder="e.g., 65 ± 12 years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender Distribution</Label>
                  <Input
                    id="gender"
                    value={getFieldValue("gender")}
                    onChange={(e) => handleFieldChange("gender", e.target.value)}
                    onFocus={() => onFieldFocus("gender")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "gender" ? "ring-2 ring-primary" : ""}
                    placeholder="e.g., Male 45%, Female 55%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inclusionCriteria">Inclusion Criteria</Label>
                  <Textarea
                    id="inclusionCriteria"
                    value={getFieldValue("inclusionCriteria")}
                    onChange={(e) => handleFieldChange("inclusionCriteria", e.target.value)}
                    onFocus={() => onFieldFocus("inclusionCriteria")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "inclusionCriteria" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Patient inclusion criteria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exclusionCriteria">Exclusion Criteria</Label>
                  <Textarea
                    id="exclusionCriteria"
                    value={getFieldValue("exclusionCriteria")}
                    onChange={(e) => handleFieldChange("exclusionCriteria", e.target.value)}
                    onFocus={() => onFieldFocus("exclusionCriteria")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "exclusionCriteria" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Patient exclusion criteria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comorbidities">Comorbidities</Label>
                  <Textarea
                    id="comorbidities"
                    value={getFieldValue("comorbidities")}
                    onChange={(e) => handleFieldChange("comorbidities", e.target.value)}
                    onFocus={() => onFieldFocus("comorbidities")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "comorbidities" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="Hypertension (%), Diabetes (%), Smoking (%), etc."
                  />
                </div>
              </>
            )}

            {/* Step 4: Imaging & Volume Measurements */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="imagingModality">Imaging Modality</Label>
                  <Input
                    id="imagingModality"
                    value={getFieldValue("imagingModality")}
                    onChange={(e) => handleFieldChange("imagingModality", e.target.value)}
                    onFocus={() => onFieldFocus("imagingModality")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "imagingModality" ? "ring-2 ring-primary" : ""}
                    placeholder="CT, MRI, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hematomaVolume">Hematoma Volume</Label>
                    <Input
                      id="hematomaVolume"
                      value={getFieldValue("hematomaVolume")}
                      onChange={(e) => handleFieldChange("hematomaVolume", e.target.value)}
                      onFocus={() => onFieldFocus("hematomaVolume")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "hematomaVolume" ? "ring-2 ring-primary" : ""}
                      placeholder="Volume in mL or cm³"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edemaVolume">Edema Volume</Label>
                    <Input
                      id="edemaVolume"
                      value={getFieldValue("edemaVolume")}
                      onChange={(e) => handleFieldChange("edemaVolume", e.target.value)}
                      onFocus={() => onFieldFocus("edemaVolume")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "edemaVolume" ? "ring-2 ring-primary" : ""}
                      placeholder="Volume in mL or cm³"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ivhVolume">IVH Volume</Label>
                    <Input
                      id="ivhVolume"
                      value={getFieldValue("ivhVolume")}
                      onChange={(e) => handleFieldChange("ivhVolume", e.target.value)}
                      onFocus={() => onFieldFocus("ivhVolume")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "ivhVolume" ? "ring-2 ring-primary" : ""}
                      placeholder="Intraventricular hemorrhage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="midlineShift">Midline Shift</Label>
                    <Input
                      id="midlineShift"
                      value={getFieldValue("midlineShift")}
                      onChange={(e) => handleFieldChange("midlineShift", e.target.value)}
                      onFocus={() => onFieldFocus("midlineShift")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "midlineShift" ? "ring-2 ring-primary" : ""}
                      placeholder="Shift in mm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hydrocephalus">Hydrocephalus</Label>
                  <Select
                    value={getFieldValue("hydrocephalus")}
                    onValueChange={(value) => handleFieldChange("hydrocephalus", value)}
                  >
                    <SelectTrigger
                      className={activeField === "hydrocephalus" ? "ring-2 ring-primary" : ""}
                      onFocus={() => onFieldFocus("hydrocephalus")}
                      onBlur={() => onFieldFocus(null)}
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="obstructive">Obstructive</SelectItem>
                      <SelectItem value="communicating">Communicating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 5: Treatment Details */}
            {currentStep === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="surgicalProcedures">Surgical Procedures</Label>
                  <Textarea
                    id="surgicalProcedures"
                    value={getFieldValue("surgicalProcedures")}
                    onChange={(e) => handleFieldChange("surgicalProcedures", e.target.value)}
                    onFocus={() => onFieldFocus("surgicalProcedures")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "surgicalProcedures" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="Craniotomy, EVD, Minimally Invasive Surgery, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surgicalTiming">Surgical Timing</Label>
                  <Input
                    id="surgicalTiming"
                    value={getFieldValue("surgicalTiming")}
                    onChange={(e) => handleFieldChange("surgicalTiming", e.target.value)}
                    onFocus={() => onFieldFocus("surgicalTiming")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "surgicalTiming" ? "ring-2 ring-primary" : ""}
                    placeholder="Time from symptom onset to surgery"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalManagement">Medical Management</Label>
                  <Textarea
                    id="medicalManagement"
                    value={getFieldValue("medicalManagement")}
                    onChange={(e) => handleFieldChange("medicalManagement", e.target.value)}
                    onFocus={() => onFieldFocus("medicalManagement")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "medicalManagement" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="Blood pressure control, coagulation management, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="controlIntervention">Control/Standard Care</Label>
                  <Textarea
                    id="controlIntervention"
                    value={getFieldValue("controlIntervention")}
                    onChange={(e) => handleFieldChange("controlIntervention", e.target.value)}
                    onFocus={() => onFieldFocus("controlIntervention")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "controlIntervention" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Describe control group treatment"
                  />
                </div>
              </>
            )}

            {/* Step 6: Outcomes & Functional Scales */}
            {currentStep === 6 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="primaryOutcome">Primary Outcome</Label>
                  <Textarea
                    id="primaryOutcome"
                    value={getFieldValue("primaryOutcome")}
                    onChange={(e) => handleFieldChange("primaryOutcome", e.target.value)}
                    onFocus={() => onFieldFocus("primaryOutcome")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "primaryOutcome" ? "ring-2 ring-primary" : ""}
                    rows={2}
                    placeholder="Main outcome measure"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryOutcomes">Secondary Outcomes</Label>
                  <Textarea
                    id="secondaryOutcomes"
                    value={getFieldValue("secondaryOutcomes")}
                    onChange={(e) => handleFieldChange("secondaryOutcomes", e.target.value)}
                    onFocus={() => onFieldFocus("secondaryOutcomes")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "secondaryOutcomes" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Additional outcome measures"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="followUpDuration">Follow-up Duration</Label>
                    <Input
                      id="followUpDuration"
                      value={getFieldValue("followUpDuration")}
                      onChange={(e) => handleFieldChange("followUpDuration", e.target.value)}
                      onFocus={() => onFieldFocus("followUpDuration")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "followUpDuration" ? "ring-2 ring-primary" : ""}
                      placeholder="e.g., 90 days, 1 year"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mortality">Mortality Rate</Label>
                    <Input
                      id="mortality"
                      value={getFieldValue("mortality")}
                      onChange={(e) => handleFieldChange("mortality", e.target.value)}
                      onFocus={() => onFieldFocus("mortality")}
                      onBlur={() => onFieldFocus(null)}
                      className={activeField === "mortality" ? "ring-2 ring-primary" : ""}
                      placeholder="Percentage or rate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Modified Rankin Scale (mRS) Distribution</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter percentage or number of patients for each mRS score (0-6)
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((score) => (
                      <div key={score} className="space-y-1">
                        <Label htmlFor={`mRS${score}`} className="text-xs">
                          mRS {score}
                        </Label>
                        <Input
                          id={`mRS${score}`}
                          value={getFieldValue(`mRS${score}`)}
                          onChange={(e) => handleFieldChange(`mRS${score}`, e.target.value)}
                          onFocus={() => onFieldFocus(`mRS${score}`)}
                          onBlur={() => onFieldFocus(null)}
                          className={`text-center ${activeField === `mRS${score}` ? "ring-2 ring-primary" : ""}`}
                          placeholder="%"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherScales">Other Scales (GCS, NIHSS, BI, GOS)</Label>
                  <Textarea
                    id="otherScales"
                    value={getFieldValue("otherScales")}
                    onChange={(e) => handleFieldChange("otherScales", e.target.value)}
                    onFocus={() => onFieldFocus("otherScales")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "otherScales" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Glasgow Coma Scale, NIH Stroke Scale, Barthel Index, Glasgow Outcome Scale"
                  />
                </div>
              </>
            )}

            {/* Step 7: Adverse Events & Predictors */}
            {currentStep === 7 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="complications">Complications</Label>
                  <Textarea
                    id="complications"
                    value={getFieldValue("complications")}
                    onChange={(e) => handleFieldChange("complications", e.target.value)}
                    onFocus={() => onFieldFocus("complications")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "complications" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="Rebleeding, infection, seizures, DVT, PE, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adverseEventsRate">Adverse Events Rate</Label>
                  <Input
                    id="adverseEventsRate"
                    value={getFieldValue("adverseEventsRate")}
                    onChange={(e) => handleFieldChange("adverseEventsRate", e.target.value)}
                    onFocus={() => onFieldFocus("adverseEventsRate")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "adverseEventsRate" ? "ring-2 ring-primary" : ""}
                    placeholder="Overall rate or specific rates"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="predictors">Predictors of Poor Outcome</Label>
                  <Textarea
                    id="predictors"
                    value={getFieldValue("predictors")}
                    onChange={(e) => handleFieldChange("predictors", e.target.value)}
                    onFocus={() => onFieldFocus("predictors")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "predictors" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="Age, hematoma volume, IVH, GCS, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statisticalSignificance">Statistical Significance</Label>
                  <Textarea
                    id="statisticalSignificance"
                    value={getFieldValue("statisticalSignificance")}
                    onChange={(e) => handleFieldChange("statisticalSignificance", e.target.value)}
                    onFocus={() => onFieldFocus("statisticalSignificance")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "statisticalSignificance" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="p-values, odds ratios, confidence intervals"
                  />
                </div>
              </>
            )}

            {/* Step 8: Quality & Notes */}
            {currentStep === 8 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="strengths">Study Strengths</Label>
                  <Textarea
                    id="strengths"
                    value={getFieldValue("strengths")}
                    onChange={(e) => handleFieldChange("strengths", e.target.value)}
                    onFocus={() => onFieldFocus("strengths")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "strengths" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Methodological strengths, large sample size, randomization, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limitations">Study Limitations</Label>
                  <Textarea
                    id="limitations"
                    value={getFieldValue("limitations")}
                    onChange={(e) => handleFieldChange("limitations", e.target.value)}
                    onFocus={() => onFieldFocus("limitations")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "limitations" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Selection bias, small sample, lack of blinding, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biasAssessment">Risk of Bias Assessment</Label>
                  <Textarea
                    id="biasAssessment"
                    value={getFieldValue("biasAssessment")}
                    onChange={(e) => handleFieldChange("biasAssessment", e.target.value)}
                    onFocus={() => onFieldFocus("biasAssessment")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "biasAssessment" ? "ring-2 ring-primary" : ""}
                    rows={3}
                    placeholder="Cochrane Risk of Bias tool, Newcastle-Ottawa Scale, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualityScore">Quality Score</Label>
                  <Input
                    id="qualityScore"
                    value={getFieldValue("qualityScore")}
                    onChange={(e) => handleFieldChange("qualityScore", e.target.value)}
                    onFocus={() => onFieldFocus("qualityScore")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "qualityScore" ? "ring-2 ring-primary" : ""}
                    placeholder="JADAD score, GRADE, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewerNotes">Reviewer Notes</Label>
                  <Textarea
                    id="reviewerNotes"
                    value={getFieldValue("reviewerNotes")}
                    onChange={(e) => handleFieldChange("reviewerNotes", e.target.value)}
                    onFocus={() => onFieldFocus("reviewerNotes")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "reviewerNotes" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="Additional notes, observations, or concerns"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-border p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === STEPS.length}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
