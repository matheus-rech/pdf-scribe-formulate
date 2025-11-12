import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ExtractionPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: Record<string, string>;
  confidenceScores: Record<string, { confidence: number; sourceSection: string; sourceText: string }>;
  onAccept: (selectedFields: string[]) => void;
  onReject: () => void;
  stepTitle: string;
}

export const ExtractionPreview = ({
  open,
  onOpenChange,
  extractedData,
  confidenceScores,
  onAccept,
  onReject,
  stepTitle
}: ExtractionPreviewProps) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(Object.keys(extractedData))
  );

  const toggleField = (field: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const handleAccept = () => {
    onAccept(Array.from(selectedFields));
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const fieldsArray = Object.entries(extractedData);
  const avgConfidence = fieldsArray.length > 0
    ? Math.round(
        fieldsArray.reduce((sum, [field]) => 
          sum + (confidenceScores[field]?.confidence || 0), 0
        ) / fieldsArray.length
      )
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Extracted Data - {stepTitle}</DialogTitle>
          <DialogDescription>
            Review the AI-extracted data and select which fields to accept. 
            Average confidence: <ConfidenceBadge confidence={avgConfidence} className="ml-1" />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fieldsArray.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No data was extracted for this step
            </div>
          ) : (
            fieldsArray.map(([field, value]) => {
              const confidence = confidenceScores[field];
              const isSelected = selectedFields.has(field);
              const isEmpty = !value || value === "Not specified" || value.trim() === "";
              
              if (isEmpty) return null;

              return (
                <div 
                  key={field}
                  className={`p-4 border rounded-lg space-y-2 transition-colors ${
                    isSelected ? 'bg-accent/50' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={field}
                      checked={isSelected}
                      onCheckedChange={() => toggleField(field)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <Label 
                        htmlFor={field}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {formatFieldName(field)}
                      </Label>
                      <div className="text-sm text-foreground bg-muted p-2 rounded">
                        {value}
                      </div>
                      {confidence && (
                        <div className="flex items-center gap-2 mt-2">
                          <ConfidenceBadge
                            confidence={confidence.confidence}
                            sourceSection={confidence.sourceSection}
                            sourceText={confidence.sourceText}
                          />
                          <span className="text-xs text-muted-foreground">
                            from {confidence.sourceSection}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            className="gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject All
          </Button>
          <Button
            onClick={handleAccept}
            disabled={selectedFields.size === 0}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept Selected ({selectedFields.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
