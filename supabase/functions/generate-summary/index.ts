import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_AI_URL = "https://api.lovable.app/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const { formData } = await req.json();

    if (!formData) {
      return new Response(
        JSON.stringify({ error: 'Form data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Construct comprehensive summary prompt
    const summaryPrompt = `You are a medical research data analyst. Generate a comprehensive summary of this clinical study based on the extracted data.

Study Data:
${JSON.stringify(formData, null, 2)}

Generate a structured summary (200-500 words) that includes:
1. Study design and population characteristics (sample size, demographics, baseline characteristics)
2. Interventions performed (surgical indications and specific procedures)
3. Primary outcomes and mortality data at different timepoints
4. Key complications and their rates
5. Critical predictors of outcome with statistical measures
6. Overall conclusions and clinical implications

Format: Professional medical research summary style. Be concise but comprehensive.`;

    // Call Lovable AI for summary generation
    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`Lovable AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || '';

    // Extract key points from summary
    const keyPoints = summary
      .split('\n')
      .filter((line: string) => line.trim().match(/^[\d\-\•\*]/))
      .map((line: string) => line.trim());

    return new Response(
      JSON.stringify({
        summary,
        keyPoints,
        confidence: 0.85
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error in generate-summary function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
});
