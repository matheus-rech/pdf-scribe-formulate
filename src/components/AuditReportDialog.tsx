import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileCheck
} from "lucide-react";
import { generateAuditReport, type AuditReportData, type ExtractionEntry } from "@/lib/auditReport";
import { useState } from "react";

interface AuditReportDialogProps {
  extractions: ExtractionEntry[];
  studyInfo: {
    id: string;
    name: string;
    pdfName: string;
    email: string;
  };
  onJumpToExtraction: (extraction: ExtractionEntry) => void;
}

export const AuditReportDialog = ({
  extractions,
  studyInfo,
  onJumpToExtraction
}: AuditReportDialogProps) => {
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleGenerateReport = () => {
    const auditReport = generateAuditReport(extractions, studyInfo);
    setReport(auditReport);
  };
  
  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${studyInfo.id}-${Date.now()}.json`;
    a.click();
  };
  
  const handleExportCSV = () => {
    if (!report) return;
    
    const headers = [
      'Field Name', 'Extracted Text', 'Page', 'Method', 
      'Citations Count', 'Avg Confidence', 'Compliance Status', 'Notes'
    ];
    
    const rows = report.extractionDetails.map(entry => [
      entry.fieldName,
      `"${entry.extractedText.replace(/"/g, '""')}"`,
      entry.page,
      entry.method,
      entry.citationData.totalCitations,
      `${(entry.citationData.avgConfidence * 100).toFixed(1)}%`,
      entry.complianceStatus,
      `"${entry.complianceNotes.join('; ').replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${studyInfo.id}-${Date.now()}.csv`;
    a.click();
  };
  
  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
      case 'non-compliant': return 'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300';
      case 'needs-review': return 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      default: return 'border-border bg-muted text-muted-foreground';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleGenerateReport}
        >
          <FileCheck className="h-4 w-4" />
          Generate Audit Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Citation Audit Report
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportJSON}>
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {report && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="extractions">Extractions</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="breakdown">Page Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Report Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <div><strong>Study:</strong> {report.metadata.studyName}</div>
                      <div><strong>PDF:</strong> {report.metadata.pdfName}</div>
                      <div><strong>Generated:</strong> {report.metadata.generatedAt.toLocaleString()}</div>
                      <div><strong>Generated By:</strong> {report.metadata.generatedBy}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Overall Compliance Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl font-bold">
                          {report.metadata.complianceScore}%
                        </span>
                        <Badge variant={
                          report.metadata.complianceScore >= 80 ? "default" :
                          report.metadata.complianceScore >= 60 ? "secondary" : "destructive"
                        }>
                          {report.metadata.complianceScore >= 80 ? "Good" :
                           report.metadata.complianceScore >= 60 ? "Fair" : "Needs Improvement"}
                        </Badge>
                      </div>
                      <Progress value={report.metadata.complianceScore} className="h-3" />
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Total Extractions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{report.metadata.totalExtractions}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Total Citations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{report.metadata.totalCitations}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Avg Confidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(report.metadata.averageConfidence * 100).toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Without Sources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                          {report.summary.extractionsWithoutSources}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Citation Confidence Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">High (≥80%)</span>
                        <Badge variant="outline" className="border-green-500">
                          {report.summary.highConfidenceCitations}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Medium (60-79%)</span>
                        <Badge variant="outline" className="border-yellow-500">
                          {report.summary.mediumConfidenceCitations}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Low (40-59%)</span>
                        <Badge variant="outline" className="border-orange-500">
                          {report.summary.lowConfidenceCitations}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Very Low (&lt;40%)</span>
                        <Badge variant="outline" className="border-red-500">
                          {report.summary.veryLowConfidenceCitations}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="extractions">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2 p-4">
                  {report.extractionDetails.map((entry) => (
                    <Card 
                      key={entry.extractionId}
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        getComplianceColor(entry.complianceStatus)
                      }`}
                      onClick={() => {
                        const extraction = extractions.find(e => e.id === entry.extractionId);
                        if (extraction) onJumpToExtraction(extraction);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{entry.fieldName}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {entry.extractedText}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Page {entry.page}
                            </Badge>
                            {entry.complianceStatus === 'compliant' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {entry.complianceStatus === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            {entry.complianceStatus === 'non-compliant' && <AlertCircle className="h-4 w-4 text-red-600" />}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span>
                            <strong>Citations:</strong> {entry.citationData.totalCitations}
                          </span>
                          {entry.citationData.validated && (
                            <span>
                              <strong>Confidence:</strong> {(entry.citationData.avgConfidence * 100).toFixed(0)}%
                            </span>
                          )}
                          <span>
                            <strong>Method:</strong> {entry.method}
                          </span>
                        </div>
                        
                        {entry.complianceNotes.length > 0 && (
                          <div className="mt-2 text-xs italic">
                            {entry.complianceNotes.join(' • ')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="issues">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 p-4">
                  {report.validationIssues.critical.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Critical Issues ({report.validationIssues.critical.length})
                      </h3>
                      <div className="space-y-2">
                        {report.validationIssues.critical.map((issue, idx) => (
                          <Card key={idx} className="border-red-500">
                            <CardContent className="p-3">
                              <div className="font-medium text-sm">{issue.fieldName}</div>
                              <div className="text-xs text-muted-foreground mt-1">{issue.details}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                <strong>Recommendation:</strong> {issue.recommendation}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {report.validationIssues.warnings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Warnings ({report.validationIssues.warnings.length})
                      </h3>
                      <div className="space-y-2">
                        {report.validationIssues.warnings.map((issue, idx) => (
                          <Card key={idx} className="border-yellow-500">
                            <CardContent className="p-3">
                              <div className="font-medium text-sm">{issue.fieldName}</div>
                              <div className="text-xs text-muted-foreground mt-1">{issue.details}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                <strong>Recommendation:</strong> {issue.recommendation}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {report.validationIssues.suggestions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        Suggestions ({report.validationIssues.suggestions.length})
                      </h3>
                      <div className="space-y-2">
                        {report.validationIssues.suggestions.slice(0, 10).map((issue, idx) => (
                          <Card key={idx} className="border-blue-500">
                            <CardContent className="p-3">
                              <div className="font-medium text-sm">{issue.fieldName}</div>
                              <div className="text-xs text-muted-foreground mt-1">{issue.details}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {report.validationIssues.critical.length === 0 && 
                   report.validationIssues.warnings.length === 0 && 
                   report.validationIssues.suggestions.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <div className="font-medium">No Issues Found</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          All extractions have valid citations with good confidence scores
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="breakdown">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2 p-4">
                  {report.pageBreakdown.map(page => (
                    <Card key={page.page}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Page {page.page}</div>
                            <div className="text-xs text-muted-foreground">
                              {page.extractionCount} extraction{page.extractionCount !== 1 ? 's' : ''} • {page.citationCount} citation{page.citationCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {page.citationCount > 0 ? `${(page.avgConfidence * 100).toFixed(0)}%` : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Confidence</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
