import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExtractionQualityScoreProps {
  formData: Record<string, any>;
  validatedFields: Set<string>;
}

export const ExtractionQualityScore = ({
  formData,
  validatedFields,
}: ExtractionQualityScoreProps) => {
  const qualityMetrics = useMemo(() => {
    // Define all expected fields across all steps
    const allFields = [
      // Step 1: Study ID
      'doi', 'pmid', 'journal', 'year', 'country', 'centers', 'funding', 'conflicts', 'registration',
      // Step 2: PICO-T
      'population', 'intervention', 'comparator', 'outcomes', 'timing', 'studyType', 'inclusion-met',
      // Step 3: Baseline
      'totalN', 'surgicalN', 'controlN', 'ageMean', 'ageSD', 'ageMedian', 'ageIQR_lower', 'ageIQR_upper',
      'maleN', 'femaleN', 'prestrokeMRS', 'nihssMean', 'gcsMean',
      // Step 4: Imaging
      'vascularTerritory', 'brainstemInvolvement', 'supratentorialInvolvement', 'nonCerebellarStroke',
      'infarctVolume', 'strokeVolumeCerebellum', 'edemaDynamics', 'peakSwellingWindow',
      // Step 8: Predictors
      'predictorsSummary'
    ];

    // Count filled fields
    const filledFields = allFields.filter(field => {
      const value = formData[field];
      return value !== undefined && value !== null && value !== '';
    }).length;

    // Count validated fields
    const validatedCount = validatedFields.size;

    // Calculate percentages
    const totalFields = allFields.length;
    const filledPercentage = (filledFields / totalFields) * 100;
    const validatedPercentage = (validatedCount / totalFields) * 100;

    // Weighted quality score
    const qualityScore = Math.round(
      (filledPercentage * 0.4) + 
      (validatedPercentage * 0.6)
    );

    // Determine color based on score
    let scoreColor = 'text-destructive';
    if (qualityScore >= 75) scoreColor = 'text-green-600';
    else if (qualityScore >= 50) scoreColor = 'text-yellow-600';

    return {
      qualityScore,
      filledFields,
      totalFields,
      validatedCount,
      filledPercentage: Math.round(filledPercentage),
      validatedPercentage: Math.round(validatedPercentage),
      scoreColor
    };
  }, [formData, validatedFields]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="p-3 cursor-help">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Score</span>
                <span className={`text-xl font-bold ${qualityMetrics.scoreColor}`}>
                  {qualityMetrics.qualityScore}%
                </span>
              </div>
              <Progress value={qualityMetrics.qualityScore} className="h-2" />
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64">
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-sm mb-2">Quality Breakdown</div>
            <div className="flex justify-between">
              <span>Fields Filled:</span>
              <span className="font-medium">{qualityMetrics.filledFields}/{qualityMetrics.totalFields} ({qualityMetrics.filledPercentage}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Fields Validated:</span>
              <span className="font-medium">{qualityMetrics.validatedCount}/{qualityMetrics.totalFields} ({qualityMetrics.validatedPercentage}%)</span>
            </div>
            <div className="pt-2 mt-2 border-t">
              <div className="text-muted-foreground">
                {qualityMetrics.qualityScore < 50 && "Fill and validate more fields to improve quality."}
                {qualityMetrics.qualityScore >= 50 && qualityMetrics.qualityScore < 75 && "Good progress! Validate remaining fields."}
                {qualityMetrics.qualityScore >= 75 && "Excellent quality! Most fields completed and validated."}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
