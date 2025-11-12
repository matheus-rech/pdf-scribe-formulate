import type { SourceCitation } from "./citationDetector";

export interface AuditReportData {
  metadata: {
    studyId: string;
    studyName: string;
    pdfName: string;
    generatedAt: Date;
    generatedBy: string;
    totalExtractions: number;
    totalCitations: number;
    averageConfidence: number;
    complianceScore: number;
  };
  
  summary: {
    highConfidenceCitations: number;
    mediumConfidenceCitations: number;
    lowConfidenceCitations: number;
    veryLowConfidenceCitations: number;
    unvalidatedCitations: number;
    extractionsWithoutSources: number;
    extractionsWithMultipleSources: number;
  };
  
  extractionDetails: ExtractionAuditEntry[];
  
  validationIssues: {
    critical: ValidationIssue[];
    warnings: ValidationIssue[];
    suggestions: ValidationIssue[];
  };
  
  pageBreakdown: {
    page: number;
    extractionCount: number;
    citationCount: number;
    avgConfidence: number;
  }[];
}

export interface ExtractionAuditEntry {
  extractionId: string;
  fieldName: string;
  extractedText: string;
  page: number;
  method: string;
  timestamp: Date;
  
  citationData: {
    totalCitations: number;
    primaryCitation?: SourceCitation;
    allCitations: SourceCitation[];
    avgConfidence: number;
    validated: boolean;
  };
  
  complianceStatus: 'compliant' | 'warning' | 'non-compliant' | 'needs-review';
  complianceNotes: string[];
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  extractionId: string;
  fieldName: string;
  issue: string;
  details: string;
  recommendation: string;
  page: number;
}

export interface ExtractionEntry {
  id: string;
  fieldName: string;
  text: string;
  page?: number;
  method?: string;
  timestamp: Date;
  sourceCitations?: SourceCitation[];
}

export function generateAuditReport(
  extractions: ExtractionEntry[],
  studyInfo: {
    id: string;
    name: string;
    pdfName: string;
    email: string;
  }
): AuditReportData {
  
  const auditEntries: ExtractionAuditEntry[] = [];
  const validationIssues: { critical: ValidationIssue[], warnings: ValidationIssue[], suggestions: ValidationIssue[] } = {
    critical: [],
    warnings: [],
    suggestions: []
  };
  
  extractions.forEach(extraction => {
    const citations = extraction.sourceCitations || [];
    const validated = citations.filter(c => c.validated);
    const avgConfidence = citations.length > 0 
      ? citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length 
      : 0;
    
    let complianceStatus: 'compliant' | 'warning' | 'non-compliant' | 'needs-review';
    const complianceNotes: string[] = [];
    
    if (citations.length === 0) {
      complianceStatus = 'non-compliant';
      complianceNotes.push('No source citations found');
      validationIssues.critical.push({
        severity: 'critical',
        extractionId: extraction.id,
        fieldName: extraction.fieldName,
        issue: 'Missing source citation',
        details: `Extraction "${extraction.text?.substring(0, 50)}..." has no traceable source in the PDF`,
        recommendation: 'Use "Find Source" to automatically detect citation',
        page: extraction.page || 0
      });
    } else if (validated.length === 0) {
      complianceStatus = 'needs-review';
      complianceNotes.push('Citations not validated with AI');
      validationIssues.warnings.push({
        severity: 'warning',
        extractionId: extraction.id,
        fieldName: extraction.fieldName,
        issue: 'Unvalidated citations',
        details: `${citations.length} citation(s) detected but not validated`,
        recommendation: 'Run batch validation to verify accuracy',
        page: extraction.page || 0
      });
    } else if (avgConfidence < 0.4) {
      complianceStatus = 'non-compliant';
      complianceNotes.push(`Low confidence score: ${(avgConfidence * 100).toFixed(0)}%`);
      validationIssues.critical.push({
        severity: 'critical',
        extractionId: extraction.id,
        fieldName: extraction.fieldName,
        issue: 'Very low citation confidence',
        details: `Average confidence ${(avgConfidence * 100).toFixed(0)}% is below acceptable threshold`,
        recommendation: 'Manual review required - extracted text may not match source',
        page: extraction.page || 0
      });
    } else if (avgConfidence < 0.6) {
      complianceStatus = 'warning';
      complianceNotes.push(`Moderate confidence: ${(avgConfidence * 100).toFixed(0)}%`);
      validationIssues.warnings.push({
        severity: 'warning',
        extractionId: extraction.id,
        fieldName: extraction.fieldName,
        issue: 'Moderate citation confidence',
        details: `Confidence ${(avgConfidence * 100).toFixed(0)}% suggests possible paraphrasing or minor discrepancies`,
        recommendation: 'Review extraction against source text',
        page: extraction.page || 0
      });
    } else {
      complianceStatus = 'compliant';
      if (avgConfidence >= 0.95) {
        complianceNotes.push('Excellent match - exact or near-exact citation');
      } else {
        complianceNotes.push(`Good confidence: ${(avgConfidence * 100).toFixed(0)}%`);
      }
    }
    
    citations.forEach(citation => {
      if (citation.validationResult?.issues && citation.validationResult.issues.length > 0) {
        validationIssues.suggestions.push({
          severity: 'suggestion',
          extractionId: extraction.id,
          fieldName: extraction.fieldName,
          issue: `Citation validation raised concerns`,
          details: citation.validationResult.issues.join('; '),
          recommendation: citation.validationResult.reasoning || 'Review citation match',
          page: citation.page
        });
      }
    });
    
    auditEntries.push({
      extractionId: extraction.id,
      fieldName: extraction.fieldName,
      extractedText: extraction.text,
      page: extraction.page || 0,
      method: extraction.method || 'unknown',
      timestamp: extraction.timestamp,
      citationData: {
        totalCitations: citations.length,
        primaryCitation: citations[0],
        allCitations: citations,
        avgConfidence,
        validated: validated.length > 0
      },
      complianceStatus,
      complianceNotes
    });
  });
  
  const allCitations = extractions.flatMap(e => e.sourceCitations || []);
  const validated = allCitations.filter(c => c.validated);
  const avgConfidence = validated.length > 0
    ? validated.reduce((sum, c) => sum + c.confidence, 0) / validated.length
    : 0;
  
  const highConf = validated.filter(c => c.confidence >= 0.8).length;
  const mediumConf = validated.filter(c => c.confidence >= 0.6 && c.confidence < 0.8).length;
  const lowConf = validated.filter(c => c.confidence >= 0.4 && c.confidence < 0.6).length;
  const veryLowConf = validated.filter(c => c.confidence < 0.4).length;
  
  const compliantCount = auditEntries.filter(e => e.complianceStatus === 'compliant').length;
  const warningCount = auditEntries.filter(e => e.complianceStatus === 'warning').length;
  const complianceScore = extractions.length > 0
    ? Math.round(((compliantCount + warningCount * 0.5) / extractions.length) * 100)
    : 0;
  
  const pageMap = new Map<number, { extractionCount: number; citations: number[]; }>();
  extractions.forEach(extraction => {
    const page = extraction.page || 0;
    if (!pageMap.has(page)) {
      pageMap.set(page, { extractionCount: 0, citations: [] });
    }
    const pageData = pageMap.get(page)!;
    pageData.extractionCount++;
    (extraction.sourceCitations || []).forEach(c => {
      if (c.validated) pageData.citations.push(c.confidence);
    });
  });
  
  const pageBreakdown = Array.from(pageMap.entries())
    .map(([page, data]) => ({
      page,
      extractionCount: data.extractionCount,
      citationCount: data.citations.length,
      avgConfidence: data.citations.length > 0
        ? data.citations.reduce((a, b) => a + b, 0) / data.citations.length
        : 0
    }))
    .sort((a, b) => a.page - b.page);
  
  return {
    metadata: {
      studyId: studyInfo.id,
      studyName: studyInfo.name,
      pdfName: studyInfo.pdfName,
      generatedAt: new Date(),
      generatedBy: studyInfo.email,
      totalExtractions: extractions.length,
      totalCitations: allCitations.length,
      averageConfidence: avgConfidence,
      complianceScore
    },
    summary: {
      highConfidenceCitations: highConf,
      mediumConfidenceCitations: mediumConf,
      lowConfidenceCitations: lowConf,
      veryLowConfidenceCitations: veryLowConf,
      unvalidatedCitations: allCitations.length - validated.length,
      extractionsWithoutSources: extractions.filter(e => !e.sourceCitations || e.sourceCitations.length === 0).length,
      extractionsWithMultipleSources: extractions.filter(e => e.sourceCitations && e.sourceCitations.length > 1).length
    },
    extractionDetails: auditEntries,
    validationIssues,
    pageBreakdown
  };
}
