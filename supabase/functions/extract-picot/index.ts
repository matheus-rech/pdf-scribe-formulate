import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, studyId } = await req.json();
    
    if (!pdfText || pdfText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No PDF text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load pre-processed chunks if studyId provided
    let targetText = pdfText;
    
    if (studyId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      
      const { data: study } = await supabase
        .from("studies")
        .select("pdf_chunks")
        .eq("id", studyId)
        .single();
      
      if (study?.pdf_chunks?.sections) {
        const relevantSections = ["abstract", "introduction", "methods", "results"];
        const sections = study.pdf_chunks.sections.filter(
          (s: any) => relevantSections.includes(s.type)
        );
        
        if (sections.length > 0) {
          const fullText = study.pdf_chunks.pageChunks
            .map((c: any) => c.text)
            .join("\n\n");
          
          targetText = sections
            .map((s: any) => fullText.substring(s.charStart, s.charEnd))
            .join("\n\n---\n\n");
          
          console.log("Using section-aware extraction, text length:", targetText.length);
        }
      }
    }
    
    console.log("Analyzing PDF text for PICO-T extraction, length:", targetText.length);

    const systemPrompt = `You are a clinical research data extraction specialist. Analyze the provided clinical study text and extract the PICO-T framework components with high precision.

PICO-T Framework:
- Population (P): Who are the study participants? Include demographics, conditions, sample size
- Intervention (I): What treatment, procedure, or exposure is being tested?
- Comparator (C): What is the intervention being compared against? (control, placebo, standard care)
- Outcomes (O): What are the measured endpoints? Include primary and secondary outcomes
- Timing (T): Study duration, follow-up periods, measurement timepoints

Extract detailed, specific information from the study text. If information is not clearly stated, use "Not specified" rather than guessing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Extract the PICO-T framework from this clinical study:\n\n${targetText.substring(0, 50000)}` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_picot",
              description: "Extract PICO-T framework components from clinical study text",
              parameters: {
                type: "object",
                properties: {
                  population: {
                    type: "string",
                    description: "Description of study participants including demographics, conditions, and sample size"
                  },
                  intervention: {
                    type: "string",
                    description: "Description of the treatment, procedure, or exposure being tested"
                  },
                  comparator: {
                    type: "string",
                    description: "Description of what the intervention is compared against"
                  },
                  outcomes: {
                    type: "string",
                    description: "Description of primary and secondary measured outcomes"
                  },
                  timing: {
                    type: "string",
                    description: "Study duration, follow-up periods, and measurement timepoints"
                  }
                },
                required: ["population", "intervention", "comparator", "outcomes", "timing"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_picot" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const picotData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted PICO-T data:", picotData);

    return new Response(
      JSON.stringify({ picot: picotData }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in extract-picot function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
