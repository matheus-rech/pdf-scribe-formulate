import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface AnalyticsData {
  totalReviews: number;
  averageConfidence: number;
  averageAgreement: number;
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  reviewerPerformance: {
    name: string;
    totalReviews: number;
    averageConfidence: number;
    averageProcessingTime: number;
  }[];
  conflictTrends: {
    date: string;
    total: number;
    resolved: number;
  }[];
}

export const AIReviewAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);

    try {
      // Calculate date filter
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Fetch reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('ai_reviews')
        .select(`
          *,
          reviewer_configs (name, model)
        `)
        .gte('created_at', startDate.toISOString());

      if (reviewsError) throw reviewsError;

      // Fetch consensus data
      const { data: consensus, error: consensusError } = await supabase
        .from('extraction_consensus')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (consensusError) throw consensusError;

      // Calculate analytics
      const totalReviews = reviews?.length || 0;
      const averageConfidence = reviews
        ? reviews.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / totalReviews
        : 0;

      const averageAgreement = consensus
        ? consensus.reduce((sum, c) => sum + (c.agreement_level || 0), 0) / consensus.length
        : 0;

      const totalConflicts = consensus?.filter(c => c.conflict_detected).length || 0;
      const resolvedConflicts = consensus?.filter(c => c.human_review_status === 'resolved').length || 0;
      const pendingConflicts = consensus?.filter(c => c.requires_human_review && c.human_review_status === 'pending').length || 0;

      // Reviewer performance
      const reviewerMap = new Map();
      reviews?.forEach(review => {
        const reviewerName = review.reviewer_configs?.name || 'Unknown';
        if (!reviewerMap.has(reviewerName)) {
          reviewerMap.set(reviewerName, {
            name: reviewerName,
            totalReviews: 0,
            totalConfidence: 0,
            totalProcessingTime: 0
          });
        }
        const reviewer = reviewerMap.get(reviewerName);
        reviewer.totalReviews++;
        reviewer.totalConfidence += review.confidence_score || 0;
        reviewer.totalProcessingTime += review.processing_time_ms || 0;
      });

      const reviewerPerformance = Array.from(reviewerMap.values()).map(r => ({
        name: r.name,
        totalReviews: r.totalReviews,
        averageConfidence: r.totalConfidence / r.totalReviews,
        averageProcessingTime: r.totalProcessingTime / r.totalReviews
      }));

      setAnalytics({
        totalReviews,
        averageConfidence,
        averageAgreement,
        totalConflicts,
        resolvedConflicts,
        pendingConflicts,
        reviewerPerformance,
        conflictTrends: [] // Simplified for now
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          AI Review Analytics
        </h3>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Reviews</CardDescription>
            <CardTitle className="text-2xl">{analytics.totalReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="gap-1">
              <Activity className="w-3 h-3" />
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Avg Confidence</CardDescription>
            <CardTitle className="text-2xl">{Math.round(analytics.averageConfidence)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={analytics.averageConfidence} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Avg Agreement</CardDescription>
            <CardTitle className="text-2xl">{Math.round(analytics.averageAgreement)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={analytics.averageAgreement} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Conflicts</CardDescription>
            <CardTitle className="text-2xl">{analytics.totalConflicts}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="gap-1 text-green-600 border-green-500/30">
                <CheckCircle className="w-3 h-3" />
                {analytics.resolvedConflicts}
              </Badge>
              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/30">
                <AlertTriangle className="w-3 h-3" />
                {analytics.pendingConflicts}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviewer Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reviewer Performance</CardTitle>
          <CardDescription>Individual AI model statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.reviewerPerformance.map((reviewer, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{reviewer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {reviewer.totalReviews} reviews • ~{Math.round(reviewer.averageProcessingTime)}ms avg
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Math.round(reviewer.averageConfidence)}% confidence
                  </Badge>
                </div>
                <Progress value={reviewer.averageConfidence} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Quality Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Consensus Rate</span>
            <Badge variant={analytics.averageAgreement >= 80 ? "default" : "outline"}>
              {Math.round((analytics.totalReviews - analytics.totalConflicts) / analytics.totalReviews * 100)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Resolution Rate</span>
            <Badge variant={analytics.resolvedConflicts / analytics.totalConflicts >= 0.5 ? "default" : "outline"}>
              {Math.round(analytics.resolvedConflicts / analytics.totalConflicts * 100)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Requires Human Review</span>
            <Badge variant={analytics.pendingConflicts > 5 ? "destructive" : "outline"}>
              {analytics.pendingConflicts} pending
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
