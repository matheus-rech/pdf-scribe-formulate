import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { citation } = await req.json();
    
    if (!citation || citation.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Citation text too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use AI to extract structured metadata from citation
    const prompt = `Extract the following metadata from this citation or title. Return ONLY valid JSON with no markdown formatting:

Citation: "${citation}"

Extract:
- doi (if present, format: "10.xxxx/xxxxx")
- pmid (PubMed ID, if present, numbers only)
- journal (journal name)
- year (publication year, 4 digits)
- country (country of study, if mentioned)

Return JSON in this exact format:
{
  "doi": "value or empty string",
  "pmid": "value or empty string",
  "journal": "value or empty string",
  "year": "value or empty string",
  "country": "value or empty string"
}`;

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
            content: 'You are a metadata extraction assistant. Extract bibliographic information from citations. Always return valid JSON only, no markdown.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '{}';
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Parse extracted metadata
    let metadata;
    try {
      metadata = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse metadata from AI response');
    }

    // Validate and clean metadata
    const cleanMetadata = {
      doi: (metadata.doi || '').trim(),
      pmid: (metadata.pmid || '').trim(),
      journal: (metadata.journal || '').trim(),
      year: (metadata.year || '').trim(),
      country: (metadata.country || '').trim(),
    };

    console.log('Extracted metadata:', cleanMetadata);

    return new Response(
      JSON.stringify({ 
        success: true, 
        metadata: cleanMetadata,
        confidence: 0.8 // Could be calculated based on AI response
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-study-metadata:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
