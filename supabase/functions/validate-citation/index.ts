import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ValidateCitationSchema = z.object({
  extractedText: z.string().min(1).max(10000),
  sourceText: z.string().min(1).max(100000),
  context: z.string().max(50000).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = ValidateCitationSchema.safeParse(body);
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

    const { extractedText, sourceText, context } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const prompt = `You are validating whether extracted data matches its source text from a PDF.

EXTRACTED TEXT:
"${extractedText}"

SOURCE TEXT FROM PDF:
"${sourceText}"

CONTEXT (surrounding text):
${context || 'N/A'}

Task: Determine if the extracted text accurately represents the source text.

Consider:
1. Exact match (100% confidence)
2. Paraphrasing or abbreviation (70-90% confidence)
3. Same semantic meaning but different wording (50-70% confidence)
4. Related but not accurate extraction (30-50% confidence)
5. No match or incorrect (0-30% confidence)

Return ONLY a JSON object (no markdown, no code blocks):
{
  "isValid": true/false,
  "confidence": 0-100,
  "matchType": "exact" | "paraphrase" | "semantic" | "related" | "no-match",
  "reasoning": "brief explanation",
  "issues": ["any concerns about accuracy"],
  "suggestions": "how to improve if needed"
}`;

    console.log('Calling Lovable AI for citation validation...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a citation validation expert. Analyze text matches and return structured JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to validate citation', details: errorText }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    let resultText = aiData.choices?.[0]?.message?.content || '';
    
    // Remove markdown code blocks if present
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let validationResult;
    try {
      validationResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', resultText);
      // Fallback: create basic validation result
      validationResult = {
        isValid: false,
        confidence: 50,
        matchType: 'unknown',
        reasoning: 'Could not parse AI response',
        issues: ['Failed to validate citation automatically'],
        suggestions: 'Manual review recommended'
      };
    }

    return new Response(
      JSON.stringify(validationResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in validate-citation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
