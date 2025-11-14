import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  extraction_id: string;
  field_name: string;
  isValid: boolean;
  confidence: number;
  matchType: 'exact' | 'paraphrase' | 'semantic' | 'weak' | 'no-match';
  reasoning: string;
  issues?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { studyId, extractionIds } = await req.json();

    console.log('Starting batch citation validation', { studyId, extractionIds });

    // Fetch extractions to validate
    let query = supabase
      .from('extractions')
      .select('id, field_name, text, source_citations, study_id, confidence_score');

    if (extractionIds && extractionIds.length > 0) {
      query = query.in('id', extractionIds);
    } else if (studyId) {
      query = query.eq('study_id', studyId);
    } else {
      throw new Error('Must provide either studyId or extractionIds');
    }

    // Only validate extractions that have citations
    query = query.not('source_citations', 'is', null);

    const { data: extractions, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!extractions || extractions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No extractions with citations found',
          validated: 0,
          results: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${extractions.length} extractions to validate`);

    const results: ValidationResult[] = [];

    // Validate each extraction
    for (const extraction of extractions) {
      try {
        const citations = extraction.source_citations as any;
        
        if (!citations || !citations.chunk_indices || citations.chunk_indices.length === 0) {
          console.log(`Extraction ${extraction.id} has no chunk indices, skipping`);
          continue;
        }

        // Fetch the cited text chunks
        const { data: textChunks, error: chunksError } = await supabase
          .from('pdf_text_chunks')
          .select('chunk_index, text, page_number')
          .eq('study_id', extraction.study_id)
          .in('chunk_index', citations.chunk_indices);

        if (chunksError || !textChunks || textChunks.length === 0) {
          console.error(`Failed to fetch chunks for extraction ${extraction.id}:`, chunksError);
          continue;
        }

        // Combine cited text
        const citedText = textChunks
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map(c => c.text)
          .join(' ');

        // Validate with AI
        const validationResult = await validateWithAI(
          extraction.text,
          citedText,
          extraction.field_name
        );

        results.push({
          extraction_id: extraction.id,
          field_name: extraction.field_name,
          ...validationResult,
        });

        // Update extraction with new confidence score
        const newConfidence = validationResult.confidence / 100;
        const validationStatus = validationResult.isValid
          ? 'validated'
          : validationResult.confidence > 50
          ? 'questionable'
          : 'pending';

        await supabase
          .from('extractions')
          .update({
            confidence_score: newConfidence,
            validation_status: validationStatus,
            source_citations: {
              ...citations,
              confidence: validationResult.confidence,
              validated: true,
              validation_result: {
                isValid: validationResult.isValid,
                matchType: validationResult.matchType,
                reasoning: validationResult.reasoning,
                issues: validationResult.issues,
              },
            },
          })
          .eq('id', extraction.id);

        console.log(
          `Validated extraction ${extraction.id}: confidence=${validationResult.confidence}%, match=${validationResult.matchType}`
        );
      } catch (error) {
        console.error(`Error validating extraction ${extraction.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          extraction_id: extraction.id,
          field_name: extraction.field_name,
          isValid: false,
          confidence: 0,
          matchType: 'no-match',
          reasoning: `Validation error: ${errorMessage}`,
          issues: [errorMessage],
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        validated: results.length,
        results,
        summary: {
          total: results.length,
          valid: results.filter(r => r.isValid).length,
          questionable: results.filter(r => !r.isValid && r.confidence > 50).length,
          invalid: results.filter(r => r.confidence <= 50).length,
          avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function validateWithAI(
  extractedText: string,
  sourceText: string,
  fieldName: string
): Promise<{
  isValid: boolean;
  confidence: number;
  matchType: 'exact' | 'paraphrase' | 'semantic' | 'weak' | 'no-match';
  reasoning: string;
  issues?: string[];
}> {
  const prompt = `You are validating extracted data against source text from a medical research paper.

FIELD NAME: ${fieldName}
EXTRACTED VALUE: "${extractedText}"

SOURCE TEXT (from cited sections):
${sourceText}

TASK:
1. Determine if the extracted value is supported by the source text
2. Assess the strength of the match
3. Identify any issues or discrepancies

MATCH TYPES:
- exact: The source contains the exact text
- paraphrase: The source says the same thing in different words
- semantic: The source implies or supports the extraction logically
- weak: The source loosely relates but doesn't directly support it
- no-match: The source doesn't support the extraction

Respond with JSON only:
{
  "isValid": true/false,
  "confidence": 0-100,
  "matchType": "exact|paraphrase|semantic|weak|no-match",
  "reasoning": "Brief explanation",
  "issues": ["list any problems"] or null
}

Examples:
- If source says "35 patients" and extracted "35", that's exact match, 100% confidence
- If source says "approximately one third" and extracted "33%", that's paraphrase, 90% confidence
- If source doesn't mention it at all, that's no-match, 0% confidence`;

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://api.lovable.app/v1/ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);
    
    return {
      isValid: result.isValid ?? false,
      confidence: Math.max(0, Math.min(100, result.confidence ?? 0)),
      matchType: result.matchType ?? 'no-match',
      reasoning: result.reasoning ?? 'No reasoning provided',
      issues: result.issues || undefined,
    };
  } catch (error) {
    console.error('AI validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      confidence: 0,
      matchType: 'no-match',
      reasoning: `Validation failed: ${errorMessage}`,
      issues: [errorMessage],
    };
  }
}
