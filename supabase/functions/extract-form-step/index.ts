import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  extractionRequestSchema,
  corsHeaders,
  handleCors,
  createValidationErrorResponse
} from '../_shared/validation-schemas.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    
    // Validate input using shared schema
    const result = extractionRequestSchema.safeParse(body);
    if (!result.success) {
      return createValidationErrorResponse(result.error, corsHeaders);
    }

    const { stepNumber, pdfText, studyId } = result.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Section mapping for intelligent text targeting
    const getSectionMapping = (step: number): string[] => {
      switch (step) {
        case 1: return ['title', 'abstract']; // Study ID
        case 2: return ['abstract', 'introduction', 'methods']; // PICO-T
        case 3: return ['methods', 'abstract']; // Baseline
        case 4: return ['methods', 'results']; // Imaging
        case 5: return ['methods']; // Interventions
        case 6: return ['methods']; // Study Arms
        case 7: return ['results']; // Outcomes
        case 8: return ['results', 'discussion']; // Complications
        default: return ['abstract', 'methods', 'results'];
      }
    };

    // Load section-aware text with citation support if studyId provided
    let targetText = pdfText;
    let sourceSection = "full_document";
    let citableDocument = pdfText;
    let relevantChunkIndices: number[] = [];
    
    if (studyId) {
      // Use authenticated client to respect RLS policies
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      
      // Fetch text chunks for citation-based extraction
      const { data: textChunks, error: chunksError } = await supabase
        .from("pdf_text_chunks")
        .select("chunk_index, text, section_name, page_number")
        .eq("study_id", studyId)
        .order("chunk_index");
      
      if (!chunksError && textChunks && textChunks.length > 0) {
        // Filter chunks by relevant sections
        const relevantSections = getSectionMapping(stepNumber);
        const filteredChunks = textChunks.filter(
          (chunk: any) => !chunk.section_name || relevantSections.includes(chunk.section_name)
        );
        
        if (filteredChunks.length > 0) {
          // Create citable document format: "[0] Text. [1] More text."
          citableDocument = filteredChunks
            .map((chunk: any) => `[${chunk.chunk_index}] ${chunk.text}`)
            .join('\n');
          
          relevantChunkIndices = filteredChunks.map((c: any) => c.chunk_index);
          targetText = citableDocument;
          sourceSection = relevantSections.join(", ");
          
          console.log(`Step ${stepNumber} - Using ${filteredChunks.length} citation-indexed chunks from sections: ${sourceSection}`);
        }
      } else {
        // Fallback to old method if no chunks available
        const { data: study, error: studyError } = await supabase
          .from("studies")
          .select("pdf_chunks")
          .eq("id", studyId)
          .single();
        
        if (studyError) {
          console.error("Study access denied:", studyError);
          return new Response(
            JSON.stringify({ error: 'Study not found or access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (study?.pdf_chunks?.sections) {
          const relevantSections = getSectionMapping(stepNumber);
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
            
            sourceSection = relevantSections.join(", ");
            console.log(`Step ${stepNumber} - Using sections: ${sourceSection}, text length: ${targetText.length}`);
          }
        }
      }
    }

    // Dynamic schema generation based on step
    const getExtractionSchema = (step: number) => {
      switch (step) {
        case 1: // Study ID
          return {
            name: "extract_study_id",
            description: "Extract study identification and metadata",
            parameters: {
              type: "object",
              properties: {
                citation: { type: "string", description: "Full citation" },
                doi: { type: "string", description: "DOI if found" },
                pmid: { type: "string", description: "PMID if found" },
                journal: { type: "string", description: "Journal name" },
                year: { type: "string", description: "Publication year" },
                country: { type: "string", description: "Country where study was conducted" },
                centers: { type: "string", description: "Single-center or multi-center" },
                funding: { type: "string", description: "Funding sources" }
              },
              required: ["citation", "journal", "year"],
              additionalProperties: false
            }
          };
        
        case 3: // Baseline
          return {
            name: "extract_baseline",
            description: "Extract baseline characteristics and demographics",
            parameters: {
              type: "object",
              properties: {
                totalN: { type: "string", description: "Total sample size" },
                surgicalN: { type: "string", description: "Surgical group size" },
                controlN: { type: "string", description: "Control group size" },
                ageMean: { type: "string", description: "Mean age" },
                ageSD: { type: "string", description: "Age standard deviation" },
                ageMedian: { type: "string", description: "Median age" },
                ageIQRLower: { type: "string", description: "Age IQR lower quartile" },
                ageIQRUpper: { type: "string", description: "Age IQR upper quartile" },
                maleN: { type: "string", description: "Number of males" },
                malePercent: { type: "string", description: "Percentage of males" },
                femaleN: { type: "string", description: "Number of females" },
                femalePercent: { type: "string", description: "Percentage of females" }
              },
              required: ["totalN"],
              additionalProperties: false
            }
          };
        
        case 4: // Imaging
          return {
            name: "extract_imaging",
            description: "Extract imaging findings and characteristics",
            parameters: {
              type: "object",
              properties: {
                volumeMean: { type: "string", description: "Mean volume in mL or cc" },
                volumeSD: { type: "string", description: "Volume standard deviation" },
                volumeMedian: { type: "string", description: "Median volume" },
                volumeRange: { type: "string", description: "Volume range" },
                location: { type: "string", description: "Anatomical location" },
                laterality: { type: "string", description: "Left, right, bilateral" },
                imagingModality: { type: "string", description: "CT, MRI, etc" },
                hydrocephalusN: { type: "string", description: "Patients with hydrocephalus" },
                hydrocephalusPercent: { type: "string", description: "Hydrocephalus percentage" }
              },
              required: [],
              additionalProperties: false
            }
          };
        
        case 5: // Interventions
          return {
            name: "extract_interventions",
            description: "Extract interventions and procedures",
            parameters: {
              type: "object",
              properties: {
                surgicalProcedure: { type: "string", description: "Primary surgical procedure performed" },
                medicalManagement: { type: "string", description: "Medical management details" },
                anesthesiaType: { type: "string", description: "Type of anesthesia used" },
                additionalProcedures: { type: "string", description: "Any additional procedures" }
              },
              required: [],
              additionalProperties: false
            }
          };
        
        case 6: // Study Arms
          return {
            name: "extract_study_arms",
            description: "Extract study arms and groups",
            parameters: {
              type: "object",
              properties: {
                studyDesign: { type: "string", description: "Overall study design (RCT, cohort, etc)" },
                numberOfArms: { type: "string", description: "Number of study arms" },
                armNames: { type: "string", description: "Names of all study arms, comma-separated" },
                armDescriptions: { type: "string", description: "Brief descriptions of each arm" }
              },
              required: [],
              additionalProperties: false
            }
          };
        
        case 7: // Outcomes
          return {
            name: "extract_outcomes",
            description: "Extract outcome measures and results",
            parameters: {
              type: "object",
              properties: {
                primaryOutcome: { type: "string", description: "Primary outcome measure" },
                secondaryOutcomes: { type: "string", description: "Secondary outcome measures" },
                mortalityRate: { type: "string", description: "Overall mortality rate" },
                followUpDuration: { type: "string", description: "Length of follow-up" },
                timepoints: { type: "string", description: "Timepoints at which outcomes were measured" }
              },
              required: [],
              additionalProperties: false
            }
          };
        
        case 8: // Complications
          return {
            name: "extract_complications",
            description: "Extract complications and adverse events",
            parameters: {
              type: "object",
              properties: {
                overallComplicationRate: { type: "string", description: "Overall complication rate" },
                majorComplications: { type: "string", description: "List of major complications" },
                minorComplications: { type: "string", description: "List of minor complications" },
                adverseEvents: { type: "string", description: "Adverse events reported" },
                predictorsOfOutcome: { type: "string", description: "Key predictors identified" }
              },
              required: [],
              additionalProperties: false
            }
          };
        
        default:
          throw new Error(`Invalid step number: ${step}`);
      }
    };

    const schema = getExtractionSchema(stepNumber);
    const systemPrompt = `You are a clinical research data extraction specialist. Extract ONLY the specific data fields requested for this section of a clinical study extraction form.

CRITICAL INSTRUCTIONS:
- Each sentence in the document is indexed with [number] for citation tracking
- Extract only factual data explicitly stated in the text
- Use "Not specified" or leave empty if information is not found
- For numeric values, extract the number only (no units unless requested)
- For percentages, include the % symbol
- Be precise and conservative - do not extrapolate or infer
- If multiple values exist, use the most relevant or first mentioned

CITATION REQUIREMENT:
- After extracting each field, note the chunk indices [X, Y, Z] that support your extraction
- Include an exact quote from the source text for verification

Extract data for: ${schema.name.replace('extract_', '').replace('_', ' ')}`;

    console.log(`Step ${stepNumber} - Calling AI for extraction with ${relevantChunkIndices.length} citation chunks`);

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
            content: `DOCUMENT WITH CITATION INDICES:\n\n${targetText.substring(0, 50000)}\n\nExtract the requested data and provide citation indices for each field.` 
          }
        ],
        tools: [
          {
            type: "function",
            function: schema
          }
        ],
        tool_choice: { type: "function", function: { name: schema.name } }
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log(`Step ${stepNumber} - Extracted:`, extractedData);

    // Generate confidence scores for each field
    const confidencePrompt = `You extracted the following data from a clinical study. For each field, assess the confidence (0-100) based on:
- How explicitly the information was stated (higher = more explicit)
- How certain you are about the extraction accuracy
- Whether the value required interpretation vs direct extraction

Respond ONLY with a JSON object mapping field names to confidence scores (0-100).

Extracted data: ${JSON.stringify(extractedData)}`;

    const confidenceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: confidencePrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_confidence",
              description: "Assess confidence scores for extracted fields",
              parameters: {
                type: "object",
                properties: {
                  confidenceScores: {
                    type: "object",
                    description: "Map of field names to confidence scores (0-100)",
                    additionalProperties: {
                      type: "number",
                      minimum: 0,
                      maximum: 100
                    }
                  }
                },
                required: ["confidenceScores"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "assess_confidence" } }
      }),
    });

    let confidenceScores: Record<string, number> = {};
    
    if (confidenceResponse.ok) {
      const confidenceData = await confidenceResponse.json();
      const confidenceToolCall = confidenceData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (confidenceToolCall?.function?.arguments) {
        const parsed = JSON.parse(confidenceToolCall.function.arguments);
        confidenceScores = parsed.confidenceScores || {};
        console.log(`Step ${stepNumber} - Confidence scores:`, confidenceScores);
      }
    } else {
      console.warn("Confidence scoring failed, using default scores");
      // Default confidence scores
      Object.keys(extractedData).forEach(key => {
        confidenceScores[key] = extractedData[key] && extractedData[key] !== "Not specified" ? 75 : 50;
      });
    }

    // Build confidence metadata
    const confidenceMetadata: Record<string, any> = {};
    Object.keys(extractedData).forEach(field => {
      confidenceMetadata[field] = {
        confidence: confidenceScores[field] || 70,
        sourceSection,
        sourceText: targetText.substring(0, 200) + "..." // Preview
      };
    });

    return new Response(
      JSON.stringify({ 
        extractedData,
        confidenceScores: confidenceMetadata,
        stepNumber
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in extract-form-step function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
