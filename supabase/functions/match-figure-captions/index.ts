import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Figure {
  id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  figure_id: string;
}

interface CaptionMatch {
  figure_id: string;
  caption: string;
  confidence: number;
  match_reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { figures, pageText, pageNumber } = await req.json();

    if (!figures || !Array.isArray(figures) || figures.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Matching captions for ${figures.length} figures on page ${pageNumber}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context for AI
    const figureContext = figures.map((fig: Figure, idx: number) => 
      `Figure ${idx + 1} (${fig.figure_id}): Located at coordinates (x: ${fig.x}, y: ${fig.y}), size ${fig.width}x${fig.height}px`
    ).join('\n');

    const prompt = `You are analyzing a scientific paper to match figure captions with their corresponding figures.

Page Number: ${pageNumber}
Page Text:
${pageText}

Figures on this page:
${figureContext}

Task: Identify and extract the caption for each figure. Look for:
1. Text patterns like "Figure X:", "Fig. X:", "Figure X.", where X matches the figure number
2. Text that appears spatially near the figure coordinates (considering y-coordinates especially)
3. Descriptive text that follows figure references
4. Multi-line captions that may span several sentences

For each figure, extract:
- The complete caption text (including the "Figure X:" prefix if present)
- Your confidence level (0.0 to 1.0)
- Brief reasoning for the match (e.g., "Found 'Figure 1:' pattern 50px below figure position")

If no caption is found for a figure, return confidence 0.0 and empty caption.

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "figure_id": "fig-1-1",
      "caption": "Figure 1: Description text here",
      "confidence": 0.95,
      "match_reason": "Direct pattern match 'Figure 1:' found 45px below figure"
    }
  ]
}`;

    console.log('Calling Lovable AI for caption matching...');

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
            content: 'You are a scientific document analysis expert specializing in figure caption extraction. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return new Response(
        JSON.stringify({ matches: [], error: 'Failed to parse AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const matches = parsedResponse.matches || [];
    console.log(`Successfully matched ${matches.length} captions`);
    
    // Log matches for debugging
    matches.forEach((match: CaptionMatch) => {
      console.log(`  ${match.figure_id}: "${match.caption.substring(0, 50)}..." (confidence: ${match.confidence})`);
    });

    return new Response(
      JSON.stringify({ matches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-figure-captions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        matches: [] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
