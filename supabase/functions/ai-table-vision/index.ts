import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const AITableVisionSchema = z.object({
  imageData: z.string().min(1).max(10000000), // ~10MB base64 image
  analysisType: z.enum(["table", "validation"]).optional().default("table")
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = AITableVisionSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageData, analysisType } = validation.data;

    console.log(`Starting AI vision analysis for type: ${analysisType}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Determine prompt based on analysis type
    let systemPrompt = "";
    let userPrompt = "";

    if (analysisType === "table") {
      systemPrompt = `You are an expert at analyzing clinical research tables and extracting structured data. 
You must identify:
1. All cell boundaries including merged cells
2. Header rows and column headers
3. Data types in each column (text, numeric, percentage, p-value, etc.)
4. Row groupings and hierarchical structures
5. Any footnotes or special notations

Return your analysis in JSON format with the following structure:
{
  "headers": ["column1", "column2", ...],
  "rows": [
    ["cell1", "cell2", ...],
    ...
  ],
  "mergedCells": [
    {"row": 0, "col": 0, "rowspan": 2, "colspan": 1}
  ],
  "columnTypes": {
    "column1": "text",
    "column2": "numeric",
    "column3": "percentage"
  },
  "notes": "Any important observations about the table structure"
}`;

      userPrompt = "Extract the complete table structure from this image, including all merged cells and data types.";
    } else if (analysisType === "validation") {
      systemPrompt = `You are a clinical data validation expert. Analyze this table for:
1. Data entry errors (inconsistent formatting, outliers)
2. Missing values
3. Statistical anomalies (values outside expected ranges)
4. Column data type consistency
5. Calculation errors in totals or percentages

Return your findings in JSON format:
{
  "errors": [
    {"row": 1, "col": 2, "issue": "Value outside expected range", "severity": "high"},
    ...
  ],
  "warnings": [
    {"row": 2, "col": 3, "issue": "Inconsistent formatting", "severity": "medium"},
    ...
  ],
  "suggestions": ["Consider checking row 5 for calculation errors", ...],
  "dataQuality": {
    "completeness": 95.5,
    "consistency": 88.2,
    "accuracy": 92.0
  }
}`;

      userPrompt = "Validate this clinical data table for errors, inconsistencies, and quality issues.";
    }

    // Call Lovable AI Gateway with vision model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Using Pro for better vision analysis
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData, // base64 data URL
                },
              },
            ],
          },
        ],
        temperature: 0.1, // Low temperature for accurate data extraction
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment." 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI credits depleted. Please add credits to continue." 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log("AI vision analysis completed");

    // Try to parse JSON response
    let parsedResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      parsedResult = {
        rawResponse: aiResponse,
        parseError: true,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysisType,
        result: parsedResult,
        rawResponse: aiResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in AI table vision:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
