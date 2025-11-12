import { supabase } from "@/integrations/supabase/client";
import type { SourceCitation } from "./citationDetector";

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  matchType: 'exact' | 'paraphrase' | 'semantic' | 'related' | 'no-match' | 'unknown';
  reasoning: string;
  issues?: string[];
  suggestions?: string;
}

export async function validateCitation(
  extractedText: string,
  citation: SourceCitation
): Promise<SourceCitation> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-citation', {
      body: {
        extractedText,
        sourceText: citation.sourceText,
        context: citation.context
      }
    });

    if (error) {
      console.error('Error validating citation:', error);
      return {
        ...citation,
        validated: false
      };
    }

    const result = data as ValidationResult;

    // Update citation with validation results
    return {
      ...citation,
      validated: true,
      confidence: result.confidence / 100, // Convert to 0-1 scale
      validationResult: {
        isValid: result.isValid,
        matchType: result.matchType,
        reasoning: result.reasoning,
        issues: result.issues
      }
    };
  } catch (error) {
    console.error('Failed to validate citation:', error);
    return {
      ...citation,
      validated: false
    };
  }
}

export async function validateAllCitations(
  extractedText: string,
  citations: SourceCitation[]
): Promise<SourceCitation[]> {
  const validatedCitations: SourceCitation[] = [];

  for (const citation of citations) {
    const validated = await validateCitation(extractedText, citation);
    validatedCitations.push(validated);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Sort by confidence (highest first)
  return validatedCitations.sort((a, b) => b.confidence - a.confidence);
}

export function getCitationConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  if (confidence >= 0.4) return 'text-orange-600';
  return 'text-red-600';
}

export function getCitationConfidenceBadge(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}
