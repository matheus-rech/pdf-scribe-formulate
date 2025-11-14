import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ConsensusIndicator } from "./ConsensusIndicator";
import { Bot, Clock } from "lucide-react";

interface ReviewerOpinion {
  reviewerId: string;
  reviewerName: string;
  data: any;
  confidence: number;
  reasoning?: string;
  processingTime?: number;
}

interface ConsensusData {
  value: any;
  agreementLevel: number;
  agreeingCount: number;
  totalCount: number;
  hasConflict: boolean;
  allValues?: any[];
}

interface AIReviewComparisonProps {
  reviews: ReviewerOpinion[];
  consensus: Record<string, ConsensusData>;
  fieldName: string;
}

export const AIReviewComparison = ({ reviews, consensus, fieldName }: AIReviewComparisonProps) => {
  const fieldConsensus = consensus[fieldName];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg">AI Review Comparison</CardTitle>
          <CardDescription>Multiple AI models analyzed: {fieldName}</CardDescription>
        </div>
        {fieldConsensus && (
          <ConsensusIndicator
            agreementLevel={fieldConsensus.agreementLevel}
            totalReviewers={fieldConsensus.totalCount}
            agreeingReviewers={fieldConsensus.agreeingCount}
            hasConflict={fieldConsensus.hasConflict}
          />
        )}
      </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* Consensus Value */}
            {fieldConsensus && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="default" className="gap-1">
                      <Bot className="w-3 h-3" />
                      Consensus
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-mono text-sm bg-background/50 p-2 rounded">
                      {JSON.stringify(fieldConsensus.value, null, 2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fieldConsensus.agreeingCount} of {fieldConsensus.totalCount} reviewers agree
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Individual Reviews */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Individual AI Opinions</h4>
              {reviews.map((review) => {
                const fieldValue = review.data?.[fieldName];
                const isConsensusMatch = fieldConsensus && 
                  JSON.stringify(fieldValue) === JSON.stringify(fieldConsensus.value);

                return (
                  <Card 
                    key={review.reviewerId} 
                    className={isConsensusMatch ? "border-green-500/30" : ""}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Bot className="w-3 h-3" />
                            {review.reviewerName}
                          </Badge>
                          {isConsensusMatch && (
                            <Badge variant="default" className="text-xs">
                              Matches Consensus
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <ConfidenceBadge confidence={review.confidence} />
                          {review.processingTime && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              {review.processingTime}ms
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Extracted Value:</p>
                        <p className="font-mono text-sm bg-muted/50 p-2 rounded">
                          {fieldValue !== null && fieldValue !== undefined 
                            ? JSON.stringify(fieldValue, null, 2) 
                            : "null"}
                        </p>
                      </div>
                      {review.reasoning && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reasoning:</p>
                          <p className="text-sm">{review.reasoning}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* All Unique Values */}
            {fieldConsensus?.allValues && fieldConsensus.allValues.length > 1 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">All Unique Values Found</h4>
                  <div className="space-y-1">
                    {fieldConsensus.allValues.map((value, idx) => (
                      <p key={idx} className="text-sm font-mono bg-muted/30 p-1 rounded">
                        {JSON.stringify(value)}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
