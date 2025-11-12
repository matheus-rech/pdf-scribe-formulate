import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const MultiModelExtractSchema = z.object({
  stepNumber: z.number().int().min(1).max(8),
  pdfText: z.string().min(1).max(1000000),
  studyId: z.string().uuid(),
  extractionId: z.string().uuid().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = MultiModelExtractSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { stepNumber, pdfText, studyId, extractionId } = validation.data;
    
    // Generate a valid UUID for extraction_id if not provided or if invalid format
    const validExtractionId = extractionId && extractionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
      ? extractionId 
      : crypto.randomUUID();

    console.log(`Multi-model extraction started for step ${stepNumber} with extraction ID: ${validExtractionId}`);

    // Use authenticated client to respect RLS policies
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Create authenticated client that respects RLS
    const supabase = createClient(
      supabaseUrl, 
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get active reviewer configurations
    const { data: reviewers, error: reviewerError } = await supabase
      .from('reviewer_configs')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });

    if (reviewerError || !reviewers || reviewers.length === 0) {
      console.error('Reviewer config error:', reviewerError);
      throw new Error('No active reviewers configured');
    }

    console.log(`Found ${reviewers.length} active reviewers`);

    // Get study chunks for section-aware extraction - RLS will enforce ownership
    const { data: study, error: studyError } = await supabase
      .from('studies')
      .select('pdf_chunks')
      .eq('id', studyId)
      .single();
    
    if (studyError) {
      console.error('Study access denied:', studyError);
      return new Response(
        JSON.stringify({ error: 'Study not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get extraction schema based on step
    const schema = getExtractionSchema(stepNumber);
    const relevantSections = getSectionMapping(stepNumber);
    
    // Extract relevant text from sections
    let targetText = pdfText;
    if (study?.pdf_chunks?.sections) {
      const sectionTexts = study.pdf_chunks.sections
        .filter((s: any) => relevantSections.includes(s.type))
        .map((s: any) => pdfText.substring(s.charStart, s.charEnd));
      
      if (sectionTexts.length > 0) {
        targetText = sectionTexts.join("\n\n");
      }
    }

    // Run extractions in parallel across all reviewers
    const reviewPromises = reviewers.map(async (reviewer) => {
      const startTime = Date.now();
      
      try {
        const extraction = await performExtraction(
          reviewer,
          schema,
          targetText,
          stepNumber,
          lovableApiKey
        );

        const processingTime = Date.now() - startTime;

        // Store individual review
        const { data: reviewData, error: reviewInsertError } = await supabase
          .from('ai_reviews')
          .insert({
            extraction_id: validExtractionId,
            reviewer_config_id: reviewer.id,
            field_name: `step_${stepNumber}_full`,
            extracted_value: JSON.stringify(extraction.data),
            confidence_score: extraction.confidence,
            reasoning: extraction.reasoning,
            source_section: relevantSections.join(', '),
            source_text: extraction.sourceText,
            processing_time_ms: processingTime
          })
          .select()
          .single();

        if (reviewInsertError) {
          console.error('Error storing review:', reviewInsertError);
        }

        console.log(`${reviewer.name} completed in ${processingTime}ms with confidence ${extraction.confidence}%`);

        return {
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
          data: extraction.data,
          confidence: extraction.confidence,
          reasoning: extraction.reasoning,
          sourceText: extraction.sourceText,
          processingTime
        };
      } catch (error) {
        console.error(`Error in ${reviewer.name}:`, error);
        return {
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          confidence: 0
        };
      }
    });

    const reviews = await Promise.all(reviewPromises);
    const successfulReviews = reviews.filter(r => !r.error);

    console.log(`${successfulReviews.length}/${reviews.length} reviewers completed successfully`);

    // Calculate consensus for each field
    const consensus = calculateConsensus(successfulReviews, schema);
    
    // Detect conflicts
    const conflicts = detectConflicts(successfulReviews, consensus);

    // Store consensus metadata
    for (const [fieldName, consensusData] of Object.entries(consensus)) {
      const consensusValue = consensusData as any;
      
      await supabase
        .from('extraction_consensus')
        .upsert({
          extraction_id: validExtractionId,
          field_name: fieldName,
          consensus_value: consensusValue.value,
          agreement_level: consensusValue.agreementLevel,
          total_reviewers: successfulReviews.length,
          agreeing_reviewers: consensusValue.agreeingCount,
          conflict_detected: consensusValue.hasConflict,
          conflict_types: consensusValue.conflictTypes || [],
          requires_human_review: consensusValue.hasConflict && consensusValue.agreementLevel < 60
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reviews,
        consensus,
        conflicts,
        summary: {
          totalReviewers: reviews.length,
          successfulReviewers: successfulReviews.length,
          averageConfidence: successfulReviews.reduce((sum, r) => sum + r.confidence, 0) / successfulReviews.length,
          conflictsDetected: conflicts.length,
          requiresHumanReview: conflicts.some(c => c.severity === 'high')
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Multi-model extraction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performExtraction(reviewer: any, schema: any, text: string, stepNumber: number, apiKey: string) {
  const prompt = `Extract the following data from this clinical study text for Step ${stepNumber}:

${JSON.stringify(schema, null, 2)}

Text to extract from:
${text.substring(0, 8000)}

Extract all available data. For any field you cannot find, use null. Provide your overall confidence (0-100) and reasoning.`;

  // Build request body - only include temperature for Google models
  const requestBody: any = {
    model: reviewer.model,
    messages: [
      { role: 'system', content: reviewer.system_prompt },
      { role: 'user', content: prompt }
    ],
    tools: [{
      type: "function",
      function: {
        name: "extract_clinical_data",
        description: "Extract structured clinical study data",
        parameters: {
          type: "object",
          properties: {
            data: {
              type: "object",
              description: "Extracted field values",
              properties: schema
            },
            confidence: {
              type: "number",
              description: "Overall confidence score 0-100"
            },
            reasoning: {
              type: "string",
              description: "Explanation of confidence level and extraction decisions"
            },
            sourceText: {
              type: "string",
              description: "Relevant excerpt supporting the extraction"
            }
          },
          required: ["data", "confidence", "reasoning"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "extract_clinical_data" } }
  };

  // Only add temperature for Google models (OpenAI models only support default temperature)
  const modelString = String(reviewer.model);
  if (modelString.startsWith('google/')) {
    requestBody.temperature = reviewer.temperature;
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  const toolCall = result.choices[0].message.tool_calls?.[0];
  
  if (!toolCall) {
    throw new Error('No tool call in AI response');
  }

  return JSON.parse(toolCall.function.arguments);
}

function calculateConsensus(reviews: any[], schema: any): Record<string, any> {
  const consensus: Record<string, any> = {};
  const fieldNames = Object.keys(schema);

  for (const fieldName of fieldNames) {
    const values: any[] = [];
    const confidences: number[] = [];

    reviews.forEach(review => {
      const value = review.data?.[fieldName];
      if (value !== null && value !== undefined) {
        values.push(value);
        confidences.push(review.confidence);
      }
    });

    if (values.length === 0) {
      consensus[fieldName] = {
        value: null,
        agreementLevel: 0,
        agreeingCount: 0,
        hasConflict: false
      };
      continue;
    }

    // Count occurrences
    const valueCounts = new Map<string, number>();
    values.forEach(v => {
      const key = JSON.stringify(v);
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    });

    // Find most common value
    let maxCount = 0;
    let consensusValue = null;
    for (const [value, count] of valueCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        consensusValue = JSON.parse(value);
      }
    }

    const agreementLevel = (maxCount / values.length) * 100;
    const hasConflict = agreementLevel < 80 || valueCounts.size > 2;

    consensus[fieldName] = {
      value: consensusValue,
      agreementLevel,
      agreeingCount: maxCount,
      totalCount: values.length,
      hasConflict,
      allValues: Array.from(valueCounts.keys()).map(k => JSON.parse(k)),
      confidences
    };
  }

  return consensus;
}

function detectConflicts(reviews: any[], consensus: Record<string, any>): any[] {
  const conflicts: any[] = [];

  for (const [fieldName, consensusData] of Object.entries(consensus)) {
    const data = consensusData as any;
    
    if (!data.hasConflict) continue;

    const conflictTypes: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Value disagreement
    if (data.allValues && data.allValues.length > 2) {
      conflictTypes.push('value_disagreement');
      severity = 'medium';
    }

    // Confidence variance
    if (data.confidences) {
      const avgConfidence = data.confidences.reduce((a: number, b: number) => a + b, 0) / data.confidences.length;
      const variance = data.confidences.reduce((sum: number, c: number) => sum + Math.pow(c - avgConfidence, 2), 0) / data.confidences.length;
      
      if (variance > 400) {
        conflictTypes.push('confidence_variance');
        severity = 'high';
      }
    }

    // Split vote
    if (data.agreementLevel < 60) {
      conflictTypes.push('split_vote');
      severity = 'high';
    }

    conflicts.push({
      fieldName,
      conflictTypes,
      severity,
      agreementLevel: data.agreementLevel,
      values: data.allValues,
      requiresHumanReview: severity === 'high'
    });
  }

  return conflicts;
}

function getExtractionSchema(stepNumber: number): any {
  const schemas: Record<number, any> = {
    1: {
      citation: { type: "string", description: "Full citation" },
      doi: { type: "string", description: "DOI if found" },
      pmid: { type: "string", description: "PMID if found" },
      journal: { type: "string", description: "Journal name" },
      year: { type: "number", description: "Publication year" },
      country: { type: "string", description: "Country where study conducted" },
      centers: { type: "string", description: "Single-center or multi-center" },
      funding: { type: "string", description: "Funding sources" }
    },
    3: {
      totalN: { type: "number", description: "Total sample size" },
      surgicalN: { type: "number", description: "Surgical group size" },
      controlN: { type: "number", description: "Control group size" },
      ageMean: { type: "number", description: "Mean age" },
      ageSD: { type: "number", description: "Age standard deviation" },
      malePercent: { type: "number", description: "Percentage of males" }
    },
    4: {
      volumeMean: { type: "number", description: "Mean volume in mL" },
      location: { type: "string", description: "Anatomical location" },
      laterality: { type: "string", description: "Left, right, bilateral" }
    },
    5: {
      surgicalProcedures: { type: "string", description: "Surgical interventions" },
      medicalManagement: { type: "string", description: "Medical management" }
    },
    6: {
      studyArms: { type: "array", description: "List of study arms" }
    },
    7: {
      mortalityTimepoints: { type: "array", description: "Mortality data" }
    },
    8: {
      complications: { type: "array", description: "Complications data" }
    }
  };

  return schemas[stepNumber] || schemas[1];
}

function getSectionMapping(stepNumber: number): string[] {
  const mappings: Record<number, string[]> = {
    1: ['title', 'abstract'],
    3: ['methods', 'abstract'],
    4: ['methods', 'results'],
    5: ['methods'],
    6: ['methods'],
    7: ['results'],
    8: ['results', 'discussion']
  };

  return mappings[stepNumber] || ['abstract', 'methods', 'results'];
}
