import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ValidateExtractionSchema = z.object({
  fieldName: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  fieldValue: z.string().max(10000),
  pdfText: z.string().min(1).max(1000000)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = ValidateExtractionSchema.safeParse(body);
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

    const { fieldName, fieldValue, pdfText } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are validating data extracted from a medical research paper about cerebellar stroke.

Field being validated: ${fieldName}
Extracted value: ${fieldValue}

PDF Content Context (first 3000 chars):
${pdfText.substring(0, 3000)}

Task: Validate if the extracted value is accurate, complete, and consistent with the PDF content.

Respond in JSON format:
{
  "isValid": true/false,
  "confidence": 0-100,
  "issues": ["list of specific issues found, if any"],
  "suggestions": "what should be corrected or added",
  "sourceText": "relevant excerpt from PDF that supports or contradicts the extraction"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a medical research data validation assistant. Provide precise, evidence-based validation." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI validation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    let validation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      validation = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      validation = {
        isValid: false,
        confidence: 0,
        issues: ["Unable to parse validation response"],
        suggestions: "Please try again",
        sourceText: ""
      };
    }

    return new Response(JSON.stringify(validation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
