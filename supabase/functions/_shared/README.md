# Shared Edge Function Utilities

This directory contains shared code used across multiple Supabase Edge Functions.

## Files

### `validation-schemas.ts`

Zod validation schemas and utilities for input validation.

**Common Patterns:**

```typescript
import { 
  uuidSchema,
  pdfTextSchema,
  stepNumberSchema,
  extractionRequestSchema,
  corsHeaders,
  handleCors,
  createValidationErrorResponse
} from '../_shared/validation-schemas.ts';

// Handle CORS
const corsResponse = handleCors(req);
if (corsResponse) return corsResponse;

// Validate input
const body = await req.json();
const result = extractionRequestSchema.safeParse(body);

if (!result.success) {
  return createValidationErrorResponse(result.error, corsHeaders);
}

const { stepNumber, pdfText, studyId } = result.data;
```

**Available Schemas:**

| Schema | Type | Description |
|--------|------|-------------|
| `uuidSchema` | string | RFC 4122 UUID validation |
| `emailSchema` | string | Email address validation |
| `stepNumberSchema` | number | Form step (1-8) |
| `pdfTextSchema` | string | PDF text (max 1MB) |
| `shortTextSchema` | string | Short text (max 1K) |
| `mediumTextSchema` | string | Medium text (max 10K) |
| `largeTextSchema` | string | Large text (max 100K) |
| `confidenceScoreSchema` | number | 0-100 confidence |
| `chunkIndexSchema` | number | Non-negative integer |
| `numReviewersSchema` | number | 2-20 reviewers |
| `aiModelSchema` | string | AI model identifier |

**Composite Schemas:**

- `extractionRequestSchema` - Common extraction request (stepNumber, pdfText, studyId)
- `citationValidationSchema` - Citation validation (extractedText, sourceText, context)
- `batchValidationSchema` - Batch validation (studyId or extractionIds)
- `multiModelExtractSchema` - Multi-reviewer extraction
- `sourceCitationsSchema` - Source citation structure
- `captionMatchSchema` - Figure/table caption matching
- `searchRequestSchema` - Search/metadata queries

**Utilities:**

- `formatValidationErrors(zodError)` - Format errors into array of strings
- `createValidationErrorResponse(zodError, corsHeaders)` - Standard 400 response
- `handleCors(req)` - Handle OPTIONS preflight
- `corsHeaders` - Standard CORS headers

## Usage Guidelines

1. **Always import schemas** rather than redefining validation logic
2. **Use composite schemas** when available for common request patterns
3. **Use helper functions** for consistent error formatting
4. **Extend schemas** when needed using Zod's `.extend()` method

## Example: Migrating Existing Function

**Before:**
```typescript
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MySchema = z.object({
  stepNumber: z.number().int().min(1).max(8),
  pdfText: z.string().min(1).max(1000000),
  studyId: z.string().uuid().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const body = await req.json();
  const validation = MySchema.safeParse(body);
  
  if (!validation.success) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid input', 
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  // ...
});
```

**After:**
```typescript
import { 
  extractionRequestSchema,
  corsHeaders,
  handleCors,
  createValidationErrorResponse
} from '../_shared/validation-schemas.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const body = await req.json();
  const result = extractionRequestSchema.safeParse(body);
  
  if (!result.success) {
    return createValidationErrorResponse(result.error, corsHeaders);
  }
  
  const { stepNumber, pdfText, studyId } = result.data;
  // ...
});
```

## Benefits

✅ **Consistency** - All functions use the same validation logic  
✅ **Maintainability** - Update validation in one place  
✅ **Type Safety** - Inferred TypeScript types from schemas  
✅ **Error Formatting** - Standardized error messages  
✅ **Less Code** - Reduce duplication by 50-70%
