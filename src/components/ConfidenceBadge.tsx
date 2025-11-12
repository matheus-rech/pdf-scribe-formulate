import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface ConfidenceBadgeProps {
  confidence: number;
  sourceSection?: string;
  sourceText?: string;
  className?: string;
}

export const ConfidenceBadge = ({ 
  confidence, 
  sourceSection, 
  sourceText,
  className 
}: ConfidenceBadgeProps) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "bg-green-500 hover:bg-green-600 text-white";
    if (score >= 70) return "bg-yellow-500 hover:bg-yellow-600 text-white";
    if (score >= 50) return "bg-orange-500 hover:bg-orange-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className="w-3 h-3" />;
    if (score >= 70) return <AlertCircle className="w-3 h-3" />;
    if (score >= 50) return <AlertTriangle className="w-3 h-3" />;
    return <HelpCircle className="w-3 h-3" />;
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return "High confidence";
    if (score >= 70) return "Medium confidence";
    if (score >= 50) return "Low confidence";
    return "Very low confidence";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getConfidenceColor(confidence)} border-0 gap-1 cursor-help ${className}`}
          >
            {getConfidenceIcon(confidence)}
            {confidence}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <div className="font-semibold">{getConfidenceLabel(confidence)}</div>
            {sourceSection && (
              <div className="text-xs">
                <span className="text-muted-foreground">Source: </span>
                {sourceSection}
              </div>
            )}
            {sourceText && (
              <div className="text-xs">
                <span className="text-muted-foreground">Preview: </span>
                <div className="mt-1 p-2 bg-muted rounded text-xs italic">
                  {sourceText}
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Click the field to review and validate the extracted value
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
