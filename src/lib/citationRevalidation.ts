import { validateAllCitations } from './citationValidation';
import type { SourceCitation } from './citationDetector';

export interface ExtractionEntry {
  id: string;
  fieldName: string;
  text: string;
  sourceCitations?: SourceCitation[];
}

export interface RevalidationProgress {
  total: number;
  current: number;
  percentage: number;
  currentField: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  errors: string[];
}

export interface RevalidationResult {
  updated: number;
  unchanged: number;
  errors: number;
  avgConfidenceChange: number;
  updatedExtractions: ExtractionEntry[];
}

export async function batchRevalidateCitations(
  extractions: ExtractionEntry[],
  onProgress: (progress: RevalidationProgress) => void
): Promise<RevalidationResult> {
  
  const updatedExtractions: ExtractionEntry[] = [];
  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  let totalConfidenceChange = 0;
  let changedCitations = 0;
  
  const extractionsWithCitations = extractions.filter(
    e => e.sourceCitations && e.sourceCitations.length > 0
  );
  
  for (let i = 0; i < extractionsWithCitations.length; i++) {
    const extraction = extractionsWithCitations[i];
    
    onProgress({
      total: extractionsWithCitations.length,
      current: i + 1,
      percentage: Math.round(((i + 1) / extractionsWithCitations.length) * 100),
      currentField: extraction.fieldName,
      status: 'running',
      errors: []
    });
    
    try {
      const oldCitations = extraction.sourceCitations || [];
      const validatedCitations = await validateAllCitations(
        extraction.text,
        oldCitations
      );
      
      let hasChanges = false;
      validatedCitations.forEach((newCit, idx) => {
        const oldCit = oldCitations[idx];
        if (oldCit && Math.abs(newCit.confidence - oldCit.confidence) > 0.05) {
          totalConfidenceChange += newCit.confidence - oldCit.confidence;
          changedCitations++;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        updated++;
        updatedExtractions.push({
          ...extraction,
          sourceCitations: validatedCitations
        });
      } else {
        unchanged++;
      }
      
    } catch (error) {
      errors++;
      console.error(`Error revalidating ${extraction.fieldName}:`, error);
      onProgress({
        total: extractionsWithCitations.length,
        current: i + 1,
        percentage: Math.round(((i + 1) / extractionsWithCitations.length) * 100),
        currentField: extraction.fieldName,
        status: 'running',
        errors: [`Failed to revalidate ${extraction.fieldName}`]
      });
    }
  }
  
  onProgress({
    total: extractionsWithCitations.length,
    current: extractionsWithCitations.length,
    percentage: 100,
    currentField: '',
    status: 'completed',
    errors: []
  });
  
  return {
    updated,
    unchanged,
    errors,
    avgConfidenceChange: changedCitations > 0 ? totalConfidenceChange / changedCitations : 0,
    updatedExtractions
  };
}

export function getRevalidationRecommendations(extractions: ExtractionEntry[]): {
  shouldRevalidate: boolean;
  reasons: string[];
  targetedExtractions: ExtractionEntry[];
} {
  const recommendations = {
    shouldRevalidate: false,
    reasons: [] as string[],
    targetedExtractions: [] as ExtractionEntry[]
  };
  
  const unvalidated = extractions.filter(e => 
    e.sourceCitations && 
    e.sourceCitations.length > 0 && 
    !e.sourceCitations[0].validated
  );
  
  if (unvalidated.length > 0) {
    recommendations.shouldRevalidate = true;
    recommendations.reasons.push(`${unvalidated.length} extractions have unvalidated citations`);
    recommendations.targetedExtractions.push(...unvalidated);
  }
  
  const lowConfidence = extractions.filter(e =>
    e.sourceCitations &&
    e.sourceCitations.length > 0 &&
    e.sourceCitations[0].validated &&
    e.sourceCitations[0].confidence < 0.6
  );
  
  if (lowConfidence.length > 0) {
    recommendations.shouldRevalidate = true;
    recommendations.reasons.push(`${lowConfidence.length} extractions have low confidence scores`);
    recommendations.targetedExtractions.push(...lowConfidence);
  }
  
  const withIssues = extractions.filter(e =>
    e.sourceCitations &&
    e.sourceCitations.some(c => 
      c.validationResult?.issues && 
      c.validationResult.issues.length > 0
    )
  );
  
  if (withIssues.length > 0) {
    recommendations.shouldRevalidate = true;
    recommendations.reasons.push(`${withIssues.length} extractions have validation issues`);
    recommendations.targetedExtractions.push(...withIssues);
  }
  
  const uniqueIds = new Set<string>();
  recommendations.targetedExtractions = recommendations.targetedExtractions.filter(e => {
    if (uniqueIds.has(e.id)) return false;
    uniqueIds.add(e.id);
    return true;
  });
  
  return recommendations;
}
