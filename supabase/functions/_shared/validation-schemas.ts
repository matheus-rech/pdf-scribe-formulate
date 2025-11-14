/**
 * Shared Zod validation schemas for Supabase Edge Functions
 * 
 * This library provides reusable validation patterns to maintain
 * consistency across all edge functions and reduce duplication.
 * 
 * Usage:
 * import { uuidSchema, pdfTextSchema, stepNumberSchema } from '../_shared/validation-schemas.ts';
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// PRIMITIVE SCHEMAS
// ============================================================================

/**
 * UUID validation (RFC 4122)
 * Common for: studyId, extractionId, userId, reviewerId
 */
export const uuidSchema = z.string().uuid({
  message: "Must be a valid UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
});

/**
 * Optional UUID
 */
export const optionalUuidSchema = uuidSchema.optional();

/**
 * Email validation
 */
export const emailSchema = z.string().email({
  message: "Must be a valid email address"
});

/**
 * Confidence score (0-100)
 */
export const confidenceScoreSchema = z.number()
  .min(0, "Confidence must be at least 0")
  .max(100, "Confidence cannot exceed 100");

/**
 * Confidence score as decimal (0.0-1.0)
 */
export const confidenceDecimalSchema = z.number()
  .min(0, "Confidence must be at least 0.0")
  .max(1.0, "Confidence cannot exceed 1.0");

/**
 * Pagination page number (positive integer)
 */
export const pageNumberSchema = z.number()
  .int("Page must be an integer")
  .positive("Page must be positive");

/**
 * Pagination limit
 */
export const limitSchema = z.number()
  .int("Limit must be an integer")
  .min(1, "Limit must be at least 1")
  .max(1000, "Limit cannot exceed 1000")
  .optional()
  .default(50);

// ============================================================================
// DOMAIN-SPECIFIC SCHEMAS
// ============================================================================

/**
 * Extraction form step number (1-8)
 * Steps:
 * 1. Study Identification
 * 2. PICOT
 * 3. Baseline Characteristics
 * 4. Imaging Protocols
 * 5. Interventions
 * 6. Study Arms
 * 7. Outcomes
 * 8. Complications
 */
export const stepNumberSchema = z.number()
  .int("Step must be an integer")
  .min(1, "Step must be between 1 and 8")
  .max(8, "Step must be between 1 and 8");

/**
 * PDF text content (full document or section)
 * Size limits: 1 char to 1MB (1,000,000 chars)
 */
export const pdfTextSchema = z.string()
  .min(1, "PDF text cannot be empty")
  .max(1000000, "PDF text exceeds maximum size (1MB)");

/**
 * Short text field (e.g., titles, names)
 * Max 1000 characters
 */
export const shortTextSchema = z.string()
  .min(1, "Text cannot be empty")
  .max(1000, "Text cannot exceed 1000 characters");

/**
 * Medium text field (e.g., abstracts, descriptions)
 * Max 10,000 characters
 */
export const mediumTextSchema = z.string()
  .min(1, "Text cannot be empty")
  .max(10000, "Text cannot exceed 10,000 characters");

/**
 * Large text field (e.g., full sections, context)
 * Max 100,000 characters
 */
export const largeTextSchema = z.string()
  .min(1, "Text cannot be empty")
  .max(100000, "Text cannot exceed 100,000 characters");

/**
 * Optional text field with max size
 */
export const optionalTextSchema = (maxLength = 50000) => z.string()
  .max(maxLength, `Text cannot exceed ${maxLength} characters`)
  .optional();

/**
 * Citation chunk index (non-negative integer)
 */
export const chunkIndexSchema = z.number()
  .int("Chunk index must be an integer")
  .nonnegative("Chunk index must be non-negative");

/**
 * Array of citation chunk indices
 */
export const chunkIndicesSchema = z.array(chunkIndexSchema)
  .min(1, "At least one chunk index required");

/**
 * Number of AI reviewers for multi-model extraction (2-20)
 */
export const numReviewersSchema = z.number()
  .int("Number of reviewers must be an integer")
  .min(2, "At least 2 reviewers required")
  .max(20, "Maximum 20 reviewers allowed")
  .optional()
  .default(8);

/**
 * AI model name/identifier
 * Examples: "google/gemini-2.5-pro", "openai/gpt-5-mini"
 */
export const aiModelSchema = z.string()
  .min(1, "Model name cannot be empty")
  .regex(/^[a-z0-9\-\/\.]+$/i, "Invalid model name format");

/**
 * Temperature parameter for AI models (0.0-2.0)
 */
export const temperatureSchema = z.number()
  .min(0, "Temperature must be at least 0.0")
  .max(2, "Temperature cannot exceed 2.0")
  .optional();

/**
 * Field type enumeration
 */
export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'boolean',
  'array',
  'object'
]);

// ============================================================================
// COMPOSITE SCHEMAS (Common Request Bodies)
// ============================================================================

/**
 * Common extraction request body
 * Used by: extract-form-step, extract-picot, batch-extract-section
 */
export const extractionRequestSchema = z.object({
  stepNumber: stepNumberSchema,
  pdfText: pdfTextSchema,
  studyId: optionalUuidSchema
});

/**
 * Citation validation request
 * Used by: validate-citation, validate-citations-batch
 */
export const citationValidationSchema = z.object({
  extractedText: mediumTextSchema,
  sourceText: largeTextSchema,
  context: optionalTextSchema(50000)
});

/**
 * Batch validation request
 * Used by: validate-citations-batch
 */
export const batchValidationSchema = z.object({
  studyId: optionalUuidSchema,
  extractionIds: z.array(uuidSchema).optional()
}).refine(
  (data) => data.studyId || (data.extractionIds && data.extractionIds.length > 0),
  {
    message: "Must provide either studyId or extractionIds",
    path: ["studyId"]
  }
);

/**
 * Multi-model extraction request
 * Used by: multi-model-extract
 */
export const multiModelExtractSchema = z.object({
  stepNumber: stepNumberSchema,
  pdfText: pdfTextSchema,
  studyId: uuidSchema,
  extractionId: optionalUuidSchema,
  numReviewers: numReviewersSchema
});

/**
 * Source citations structure
 * Stored in extractions.source_citations JSON field
 */
export const sourceCitationsSchema = z.object({
  chunk_indices: chunkIndicesSchema,
  source_quote: z.string().min(1),
  confidence: confidenceScoreSchema,
  page_number: pageNumberSchema.optional(),
  reasoning: z.string().optional()
});

/**
 * Figure/Table caption matching request
 * Used by: match-figure-captions, match-table-captions
 */
export const captionMatchSchema = z.object({
  studyId: uuidSchema,
  itemType: z.enum(['figure', 'table']),
  pageNumber: pageNumberSchema.optional()
});

/**
 * Search/metadata request
 * Used by: search-study-metadata
 */
export const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  limit: limitSchema,
  offset: pageNumberSchema.optional().default(0)
});

// ============================================================================
// VALIDATION ERROR FORMATTER
// ============================================================================

/**
 * Format Zod validation errors into user-friendly messages
 * 
 * @param zodError - The Zod error object
 * @returns Array of formatted error messages
 * 
 * @example
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   return new Response(
 *     JSON.stringify({ 
 *       error: 'Invalid input', 
 *       details: formatValidationErrors(result.error)
 *     }),
 *     { status: 400, headers: corsHeaders }
 *   );
 * }
 */
export function formatValidationErrors(zodError: z.ZodError): string[] {
  return zodError.errors.map(e => 
    `${e.path.join('.')}: ${e.message}`
  );
}

/**
 * Create a standardized validation error response
 * 
 * @param zodError - The Zod error object
 * @param corsHeaders - CORS headers to include
 * @returns Response object with 400 status
 */
export function createValidationErrorResponse(
  zodError: z.ZodError,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Invalid input', 
      details: formatValidationErrors(zodError)
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// ============================================================================
// CORS HEADERS (Standard)
// ============================================================================

/**
 * Standard CORS headers for all edge functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle OPTIONS preflight request
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
