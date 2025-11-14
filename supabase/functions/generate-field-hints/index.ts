import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fieldName, currentValue, pdfText, fieldContext } = await req.json();

    if (!fieldName || !currentValue || !pdfText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating hints for field: ${fieldName}, value: ${currentValue}`);

    // Split PDF into chunks for better semantic search
    const chunks = splitIntoChunks(pdfText, 1000);
    
    // Find most relevant chunks
    const relevantChunks = await findRelevantChunks(chunks, currentValue, fieldContext);
    
    // Generate suggestions using Lovable AI
    const hints = await generateHintsWithAI(fieldName, currentValue, relevantChunks, fieldContext);

    return new Response(
      JSON.stringify({ hints }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-field-hints:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function splitIntoChunks(text: string, chunkSize: number): Array<{ text: string; index: number }> {
  const chunks = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push({ text: chunk, index: i });
  }
  
  return chunks;
}

async function findRelevantChunks(
  chunks: Array<{ text: string; index: number }>,
  query: string,
  context: string
): Promise<Array<{ text: string; score: number; location: string }>> {
  // Simple keyword-based relevance scoring
  const queryWords = query.toLowerCase().split(/\s+/);
  const contextWords = context.toLowerCase().split(/\s+/);
  
  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    
    // Score based on query word matches
    queryWords.forEach(word => {
      if (word.length > 2) {
        const matches = (chunkLower.match(new RegExp(word, 'g')) || []).length;
        score += matches * 2;
      }
    });
    
    // Score based on context word matches
    contextWords.forEach(word => {
      if (word.length > 3) {
        const matches = (chunkLower.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      }
    });
    
    return {
      text: chunk.text,
      score,
      location: `Section ${Math.floor(chunk.index / 1000) + 1}`
    };
  });
  
  // Sort by score and return top 3
  return scoredChunks
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

async function generateHintsWithAI(
  fieldName: string,
  currentValue: string,
  relevantChunks: Array<{ text: string; score: number; location: string }>,
  fieldContext: string
): Promise<Array<{ suggestion: string; confidence: number; sourceLocation: string; sourceText: string }>> {
  if (relevantChunks.length === 0) {
    return [];
  }

  const prompt = `You are a medical research data extraction assistant. The user is typing in the "${fieldName}" field (context: ${fieldContext}) and has entered: "${currentValue}".

Based on the following relevant excerpts from the research paper, suggest 1-3 possible completions or corrections for this field. Focus on extracting precise data.

Relevant excerpts:
${relevantChunks.map((chunk, i) => `[${chunk.location}]: ${chunk.text.substring(0, 500)}`).join('\n\n')}

Provide suggestions that:
1. Complete or correct the current input
2. Are factually grounded in the text
3. Are concise and precise
4. Match the expected format for the field

Return ONLY a JSON array (no markdown formatting) with 1-3 suggestions, each having:
- suggestion: the suggested value
- confidence: a number between 0 and 1
- sourceLocation: which section it came from
- sourceText: a brief excerpt (max 100 chars) supporting the suggestion

Example format:
[{"suggestion":"New England Journal of Medicine","confidence":0.95,"sourceLocation":"Section 1","sourceText":"published in N Engl J Med 2023"}]`;

  try {
    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('Lovable AI error:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Remove markdown code blocks if present
    const jsonContent = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const hints = JSON.parse(jsonContent);
    
    // Validate and return
    return Array.isArray(hints) ? hints.slice(0, 3) : [];
  } catch (error) {
    console.error('Error generating hints with AI:', error);
    return [];
  }
}
