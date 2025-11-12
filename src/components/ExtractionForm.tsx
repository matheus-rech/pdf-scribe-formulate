import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { ExtractionEntry } from "@/pages/Index";
import { Card } from "./ui/card";

interface ExtractionFormProps {
  activeField: string | null;
  onFieldFocus: (field: string | null) => void;
  extractions: ExtractionEntry[];
  pdfLoaded: boolean;
  onExtraction: (entry: ExtractionEntry) => void;
}

const STEPS = [
  { id: 1, title: "Study Metadata", fields: ["citation", "doi", "pmid", "journal", "year"] },
  { id: 2, title: "PICO-T Framework", fields: ["population", "intervention", "comparator", "outcomes", "timing"] },
  { id: 3, title: "Demographics", fields: ["sampleSize", "age", "gender", "comorbidities"] },
  { id: 4, title: "Imaging Data", fields: ["volumeMeasurements", "swellingIndices"] },
  { id: 5, title: "Interventions", fields: ["surgicalProcedures", "medicalManagement"] },
  { id: 6, title: "Study Arms", fields: ["controlGroup", "treatmentGroup"] },
  { id: 7, title: "Outcomes", fields: ["mortality", "mrsDistribution"] },
  { id: 8, title: "Complications", fields: ["adverseEvents", "predictors"] },
];

export const ExtractionForm = ({
  activeField,
  onFieldFocus,
  extractions,
  pdfLoaded,
  onExtraction
}: ExtractionFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});

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
            {/* Step 1: Study Metadata */}
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
                    <div className="flex gap-2">
                      <Input
                        id="doi"
                        value={getFieldValue("doi")}
                        onChange={(e) => handleFieldChange("doi", e.target.value)}
                        onFocus={() => onFieldFocus("doi")}
                        onBlur={() => onFieldFocus(null)}
                        className={activeField === "doi" ? "ring-2 ring-primary" : ""}
                        placeholder="10.1000/xyz123"
                      />
                      <Button variant="outline" size="sm" className="shrink-0 gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Button>
                    </div>
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
                      <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent">
                        <Sparkles className="h-3 w-3" />
                        Generate PICO-T Framework
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
              </>
            )}

            {/* Step 3: Demographics */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Sample Size</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    value={getFieldValue("sampleSize")}
                    onChange={(e) => handleFieldChange("sampleSize", e.target.value)}
                    onFocus={() => onFieldFocus("sampleSize")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "sampleSize" ? "ring-2 ring-primary" : ""}
                    placeholder="Total number of participants"
                  />
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
                  <Label htmlFor="comorbidities">Comorbidities</Label>
                  <Textarea
                    id="comorbidities"
                    value={getFieldValue("comorbidities")}
                    onChange={(e) => handleFieldChange("comorbidities", e.target.value)}
                    onFocus={() => onFieldFocus("comorbidities")}
                    onBlur={() => onFieldFocus(null)}
                    className={activeField === "comorbidities" ? "ring-2 ring-primary" : ""}
                    rows={4}
                    placeholder="List comorbidities and percentages"
                  />
                </div>
              </>
            )}

            {/* Additional steps 4-8 would follow similar patterns */}
            {currentStep > 3 && (
              <Card className="p-8 text-center">
                <h3 className="font-semibold mb-2">Step {currentStep}: {currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This section is under construction. Follow the same pattern as previous steps.
                </p>
                <div className="space-y-3">
                  {currentStepData.fields.map(field => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field} className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Textarea
                        id={field}
                        value={getFieldValue(field)}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        onFocus={() => onFieldFocus(field)}
                        onBlur={() => onFieldFocus(null)}
                        className={activeField === field ? "ring-2 ring-primary" : ""}
                        rows={2}
                        placeholder={`Enter ${field}...`}
                      />
                    </div>
                  ))}
                </div>
              </Card>
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
