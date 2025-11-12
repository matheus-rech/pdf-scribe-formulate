import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, XCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsensusIndicatorProps {
  agreementLevel: number;
  totalReviewers: number;
  agreeingReviewers: number;
  hasConflict?: boolean;
  className?: string;
}

export const ConsensusIndicator = ({
  agreementLevel,
  totalReviewers,
  agreeingReviewers,
  hasConflict = false,
  className
}: ConsensusIndicatorProps) => {
  const getConsensusColor = (level: number) => {
    if (level >= 90) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    if (level >= 70) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    if (level >= 50) return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  };

  const getConsensusIcon = (level: number) => {
    if (level >= 90) return <CheckCircle2 className="w-3 h-3" />;
    if (level >= 70) return <AlertTriangle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const getConsensusLabel = (level: number) => {
    if (level >= 90) return "Strong Consensus";
    if (level >= 70) return "Moderate Agreement";
    if (level >= 50) return "Weak Agreement";
    return "Conflict Detected";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 font-medium",
              getConsensusColor(agreementLevel),
              className
            )}
          >
            {getConsensusIcon(agreementLevel)}
            <span>{Math.round(agreementLevel)}%</span>
            <Users className="w-3 h-3 ml-0.5 opacity-70" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{getConsensusLabel(agreementLevel)}</p>
            <p className="text-sm text-muted-foreground">
              {agreeingReviewers} of {totalReviewers} AI reviewers agree
            </p>
            {hasConflict && (
              <p className="text-sm text-destructive font-medium">
                ⚠️ Human review recommended
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
