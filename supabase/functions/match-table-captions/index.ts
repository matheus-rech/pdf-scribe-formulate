import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { tables, pageText, pageNumber } = await req.json();
    
    console.log(`Matching captions for ${tables.length} tables on page ${pageNumber}`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const results = [];

    for (const table of tables) {
      const prompt = `Analyze the following page content and find the caption for this table.

Table Details:
- Page: ${pageNumber}
- Position: x:${Math.round(table.x)}, y:${Math.round(table.y)}
- Dimensions: ${table.columnCount} columns × ${table.rowCount || 'unknown'} rows
- Headers: ${table.headers?.join(', ') || 'unknown'}

Page text (first 2000 chars):
${pageText.substring(0, 2000)}

Find the table's caption by looking for:
1. "Table X:" or "TABLE X:" patterns near the table position
2. Text positioned immediately above or below the table coordinates
3. Descriptive text about the data shown in the table
4. Can span multiple lines

Return a JSON object with these fields:
{
  "caption": "full caption text or null if not found",
  "confidence": 0.0-1.0 (how confident you are this is the correct caption),
  "reasoning": "brief explanation of why this caption matches or why no caption was found"
}`;

      console.log(`Processing table ${table.tableId}...`);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: 'You are a medical research document analyzer specializing in table caption extraction. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error(`AI API error for table ${table.tableId}:`, response.status, await response.text());
        results.push({
          tableId: table.tableId,
          caption: null,
          confidence: 0,
          reasoning: 'AI API error',
          error: true
        });
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error(`No content in AI response for table ${table.tableId}`);
        results.push({
          tableId: table.tableId,
          caption: null,
          confidence: 0,
          reasoning: 'No AI response',
          error: true
        });
        continue;
      }

      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        results.push({
          tableId: table.tableId,
          caption: parsed.caption,
          confidence: parsed.confidence || 0,
          reasoning: parsed.reasoning || '',
          error: false
        });

        console.log(`Matched caption for table ${table.tableId}: "${parsed.caption?.substring(0, 50)}..." (confidence: ${parsed.confidence})`);
      } catch (parseError) {
        console.error(`Error parsing AI response for table ${table.tableId}:`, parseError);
        results.push({
          tableId: table.tableId,
          caption: null,
          confidence: 0,
          reasoning: 'Failed to parse AI response',
          error: true
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-table-captions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
