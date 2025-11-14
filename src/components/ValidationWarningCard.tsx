import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationWarning } from "@/lib/crossStepValidation";

interface ValidationWarningCardProps {
  warnings: ValidationWarning[];
  onAutoFix: (warning: ValidationWarning) => void;
  onDismiss: (index: number) => void;
}

export const ValidationWarningCard = ({
  warnings,
  onAutoFix,
  onDismiss
}: ValidationWarningCardProps) => {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-yellow-900 dark:text-yellow-100">
          <AlertTriangle className="h-5 w-5" />
          <span>Data Validation Warnings</span>
          <span className="ml-auto text-xs font-normal bg-yellow-200 dark:bg-yellow-900 px-2 py-1 rounded-full">
            {warnings.length} issue{warnings.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert
              key={index}
              variant={warning.severity === 'error' ? 'destructive' : 'default'}
              className={cn(
                "relative pr-20",
                warning.severity === 'warning' && "border-yellow-300 bg-yellow-50/80 dark:bg-yellow-950/30"
              )}
            >
              <div className="flex items-start gap-2">
                {warning.severity === 'error' ? (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                )}
                <div className="flex-1 min-w-0">
                  <AlertDescription className="text-sm">
                    <span className="font-medium">{warning.field}: </span>
                    {warning.message}
                    {warning.suggestedFix && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Suggested value: <span className="font-mono font-semibold">{warning.suggestedFix}</span>
                      </div>
                    )}
                  </AlertDescription>
                </div>
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  {warning.autoFixable && (
                    <Button
                      onClick={() => onAutoFix(warning)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-background"
                    >
                      <Wand2 className="h-3 w-3" />
                      Fix
                    </Button>
                  )}
                  <Button
                    onClick={() => onDismiss(index)}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <span className="font-medium">Tip:</span> Click "Fix" to automatically correct issues, or manually adjust the values.
        </div>
      </div>
    </Card>
  );
};
