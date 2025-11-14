import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string;
  sourceText: string;
}

interface ValidationSummaryProps {
  validationResults: Record<string, ValidationResult>;
  formData: Record<string, string>;
  currentStep: number;
}

export const ValidationSummary = ({ 
  validationResults, 
  formData,
  currentStep 
}: ValidationSummaryProps) => {
  const validatedFields = Object.keys(validationResults);
  const filledFields = Object.keys(formData).filter(key => formData[key]?.trim());
  
  const validFields = validatedFields.filter(
    field => validationResults[field]?.isValid && (validationResults[field]?.confidence ?? 0) >= 80
  );
  const warningFields = validatedFields.filter(
    field => (validationResults[field]?.confidence ?? 0) >= 50 && (validationResults[field]?.confidence ?? 0) < 80
  );
  const invalidFields = validatedFields.filter(
    field => !validationResults[field]?.isValid || (validationResults[field]?.confidence ?? 0) < 50
  );

  const overallScore = validatedFields.length > 0
    ? Math.round(
        validatedFields.reduce((sum, field) => sum + (validationResults[field]?.confidence ?? 0), 0) / 
        validatedFields.length
      )
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 50) return "Needs Review";
    return "Poor Quality";
  };

  if (validatedFields.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No fields validated yet. Click the checkmark buttons (✓) next to fields to validate them against the PDF.
          </p>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong>{filledFields.length}</strong> fields filled • Step {currentStep} of 8
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Validation Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Quality</span>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </span>
          </div>
          <Progress value={overallScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {getScoreLabel(overallScore)} • {validatedFields.length} of {filledFields.length} fields validated
          </p>
        </div>

        {/* Field Status Summary */}
        <div className="flex gap-2 flex-wrap">
          {validFields.length > 0 && (
            <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {validFields.length} Valid
            </Badge>
          )}
          {warningFields.length > 0 && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warningFields.length} Review
            </Badge>
          )}
          {invalidFields.length > 0 && (
            <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              {invalidFields.length} Invalid
            </Badge>
          )}
        </div>

        {/* Fields Needing Attention */}
        {(invalidFields.length > 0 || warningFields.length > 0) && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
              Needs Attention
            </h4>
            <ScrollArea className="h-32 rounded-md border p-2">
              <div className="space-y-2">
                {invalidFields.map(field => (
                  <div key={field} className="flex items-start gap-2 text-xs">
                    <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{field}</div>
                      <div className="text-muted-foreground text-[10px] line-clamp-1">
                        {validationResults[field]?.issues?.join(", ") || "Validation failed"}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1 h-4 shrink-0">
                      {validationResults[field]?.confidence || 0}%
                    </Badge>
                  </div>
                ))}
                {warningFields.map(field => (
                  <div key={field} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{field}</div>
                      <div className="text-muted-foreground text-[10px] line-clamp-1">
                        Moderate confidence - review recommended
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1 h-4 shrink-0">
                      {validationResults[field]?.confidence || 0}%
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Valid Fields */}
        {validFields.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
              Validated Fields
            </h4>
            <div className="flex flex-wrap gap-1">
              {validFields.slice(0, 5).map(field => (
                <Badge key={field} variant="outline" className="text-[10px] border-green-500/50">
                  {field}
                </Badge>
              ))}
              {validFields.length > 5 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{validFields.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
