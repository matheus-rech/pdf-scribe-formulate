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
    const { figureId, pageNumber, pageContext } = await req.json();

    console.log(`🔍 Enhancing caption for figure ${figureId} on page ${pageNumber}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Construct prompt to find figure caption
    const systemPrompt = `You are a scientific document analyzer specializing in identifying figure captions. 
Your task is to locate and extract the complete caption for a figure from the surrounding text.

Figure captions typically:
- Start with patterns like "Figure X:", "Fig. X:", "FIG X:", or "Figure X."
- Include a descriptive title followed by detailed explanation
- May span multiple sentences
- Often contain technical terminology

Return ONLY the caption text without the figure number prefix. If no caption is found, return null.`;

    const userPrompt = `Page ${pageNumber} contains a figure with ID: ${figureId}

Context from this page (first 2000 characters):
${pageContext.substring(0, 2000)}

Extract the complete caption for this figure. Return just the caption text, or null if no caption found.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Low temperature for precise extraction
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            caption: null 
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ 
            error: 'AI credits exhausted. Please add credits to your workspace.',
            caption: null 
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const extractedCaption = data.choices?.[0]?.message?.content?.trim();

    console.log(`✅ Caption extracted: ${extractedCaption ? 'Found' : 'Not found'}`);

    // Clean up the caption
    let cleanCaption = null;
    if (extractedCaption && extractedCaption.toLowerCase() !== 'null') {
      cleanCaption = extractedCaption
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .trim();
      
      // If caption is too short or generic, return null
      if (cleanCaption.length < 10 || cleanCaption.toLowerCase().includes('no caption')) {
        cleanCaption = null;
      }
    }

    return new Response(
      JSON.stringify({ 
        caption: cleanCaption,
        figureId,
        pageNumber,
        enhanced: !!cleanCaption
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in enhance-figure-caption:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        caption: null 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
