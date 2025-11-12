import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const BatchExtractSectionSchema = z.object({
  sectionText: z.string().min(1).max(500000),
  sectionType: z.string().min(1).max(50).regex(/^[a-zA-Z_-]+$/),
  sectionName: z.string().min(1).max(200).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = BatchExtractSectionSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sectionText, sectionType, sectionName } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Define extraction schema based on section type
    const getExtractionSchema = (type: string) => {
      switch (type) {
        case 'abstract':
          return {
            population: "string - describe the patient population",
            intervention: "string - primary intervention or exposure",
            outcomes: "string - main outcomes measured",
            timing: "string - study duration or follow-up period"
          };
        
        case 'methods':
          return {
            population: "string - detailed patient population",
            intervention: "string - intervention details",
            comparator: "string - control or comparison group",
            outcomes: "string - outcome measures",
            timing: "string - study timeline",
            sampleSize: "string - number of participants",
            age: "string - age range or mean age",
            gender: "string - gender distribution",
            surgicalProcedures: "string - surgical interventions",
            medicalManagement: "string - medical treatments",
            controlGroup: "string - control group description",
            treatmentGroup: "string - treatment group description"
          };
        
        case 'results':
          return {
            mortality: "string - mortality rates and statistics",
            mrsDistribution: "string - modified Rankin Scale distribution",
            volumeMeasurements: "string - volume measurements",
            swellingIndices: "string - swelling measurements",
            adverseEvents: "string - complications and adverse events"
          };
        
        case 'introduction':
          return {
            population: "string - population of interest",
            intervention: "string - intervention being studied",
            comparator: "string - comparison or standard care"
          };
        
        case 'discussion':
          return {
            predictors: "string - prognostic predictors discussed"
          };
        
        case 'references':
        case 'title':
          return {
            citation: "string - full citation",
            doi: "string - DOI if available",
            pmid: "string - PubMed ID if available",
            journal: "string - journal name",
            year: "string - publication year"
          };
        
        default:
          return {
            summary: "string - key information from this section"
          };
      }
    };

    const schema = getExtractionSchema(sectionType);
    const fieldDescriptions = Object.entries(schema)
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join('\n');

    const systemPrompt = `You are a medical research data extraction assistant. Extract structured data from clinical study sections.

SECTION TYPE: ${sectionName} (${sectionType})

Extract the following fields:
${fieldDescriptions}

INSTRUCTIONS:
- Extract only information explicitly stated in the text
- Use "Not reported" if information is not found
- Be precise and include relevant numbers, percentages, and statistics
- For ranges, include both min and max values
- Preserve medical terminology exactly as written
- If a field is not applicable to this section, use "N/A"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract data from this ${sectionName} section:\n\n${sectionText}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_section_data",
            description: `Extract structured data from the ${sectionName} section`,
            parameters: {
              type: "object",
              properties: schema,
              required: Object.keys(schema),
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_section_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    // Filter out N/A and Not reported values
    const filteredData: Record<string, string> = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (
        typeof value === 'string' && 
        value.trim() !== '' &&
        value.toLowerCase() !== 'n/a' &&
        value.toLowerCase() !== 'not reported' &&
        value.toLowerCase() !== 'not applicable'
      ) {
        filteredData[key] = value;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        extractedData: filteredData,
        fieldsExtracted: Object.keys(filteredData).length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Batch extraction error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error during batch extraction" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
