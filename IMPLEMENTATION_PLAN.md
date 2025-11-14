# Implementation Plan: Automated Figure & Table Extraction

## Overview

This document outlines the implementation plan for three major improvements to the PDF Scribe Formulate application:

1. **Automated Figure Extraction** during AI workflow
2. **Automated Table Extraction** during AI workflow  
3. **Enhanced Step 7 Extraction** for numerical outcome data from tables

## Improvement #1: Automated Figure Extraction

### Current State
- Figures are NOT automatically extracted during AI workflow
- Figures count remains at (0) after all AI extractions
- Users must manually use the Image tool to extract figures

### Proposed Implementation
**File**: `src/pages/Index.tsx` (or create new `src/lib/autoFigureExtraction.ts`)

**Approach**:
1. After PDF upload, automatically detect figures using PDF.js
2. Extract figure images and captions
3. Call existing edge functions:
   - `match-figure-captions` - Match figures to captions
   - `enhance-figure-caption` - Enhance figure descriptions
4. Store extracted figures in `pdf_figures` table
5. Update Figures tab count

**Key Functions to Add**:
```typescript
async function autoExtractFigures(pdfFile: File, studyId: string) {
  // 1. Load PDF with PDF.js
  // 2. Iterate through pages
  // 3. Detect images using getOperatorList()
  // 4. Extract image data
  // 5. Detect nearby text for captions
  // 6. Call match-figure-captions edge function
  // 7. Save to pdf_figures table
}
```

**Trigger Point**: 
- After PDF upload completes
- Or as part of "Extract All Steps" workflow

## Improvement #2: Automated Table Extraction

### Current State
- Tables are NOT automatically extracted during AI workflow
- Users must manually use the Region tool to select tables
- Auto Table Parser exists but isn't automatically triggered

### Proposed Implementation
**File**: `src/lib/pdfTableExtraction.ts` (already exists, needs integration)

**Approach**:
1. After PDF upload, automatically detect tables
2. Use existing `pdfTableExtraction.ts` functions
3. Parse table structure and data
4. Call existing edge functions:
   - `match-table-captions` - Match tables to captions
   - `ai-table-vision` - Analyze table structure with AI
5. Store extracted tables in `pdf_tables` table
6. Update Tables tab

**Key Functions to Modify**:
```typescript
// Modify existing autoExtractTables() in pdfTableExtraction.ts
async function autoExtractTablesOnUpload(pdfFile: File, studyId: string) {
  // 1. Detect table regions automatically
  // 2. Extract table data
  // 3. Parse with Auto Table Parser
  // 4. Call edge functions for enhancement
  // 5. Save to pdf_tables table
}
```

**Trigger Point**:
- After PDF upload completes
- Or as part of "Extract All Steps" workflow

## Improvement #3: Enhanced Step 7 Numerical Data Extraction

### Current State
- Step 7 AI extraction only extracts outcome definitions (Primary/Secondary Outcomes)
- Does NOT extract numerical data (mortality rates, mRS scores)
- Mortality Data and mRS Data sections remain empty

### Proposed Implementation
**File**: `supabase/functions/extract-form-step/index.ts`

**Approach**:
1. Modify Step 7 extraction schema to include numerical data
2. Extract data from detected tables (using Improvement #2)
3. Parse mortality and mRS data from Table 2 or similar
4. Populate Mortality Data and mRS Data arrays
5. Return structured data for auto-population

**Enhanced Schema**:
```typescript
// Add to Step 7 (Outcomes) schema
mortalityData: z.array(z.object({
  timepoint: z.string(),
  overallN: z.number().optional(),
  overallPercent: z.number().optional(),
})).optional(),

mrsData: z.array(z.object({
  timepoint: z.string(),
  favorable_n: z.number().optional(),
  favorable_percent: z.number().optional(),
  unfavorable_n: z.number().optional(),
  unfavorable_percent: z.number().optional(),
})).optional(),
```

**Key Functions to Add**:
```typescript
async function extractOutcomeDataFromTables(
  fullText: string,
  tables: any[]
) {
  // 1. Identify results/outcomes table
  // 2. Parse mortality data rows
  // 3. Parse mRS data rows
  // 4. Return structured data
}
```

## Implementation Priority

**Phase 1** (High Priority):
1. Improvement #2: Automated Table Extraction
   - Most impactful for data extraction workflow
   - Enables Improvement #3

**Phase 2** (High Priority):
3. Improvement #3: Enhanced Step 7 Extraction
   - Depends on tables being extracted
   - Core feature for clinical outcome data

**Phase 3** (Medium Priority):
1. Improvement #1: Automated Figure Extraction
   - Supplementary to main data extraction
   - Enhances completeness

## Testing Plan

**Test PDF**: Winslow2023.pdf (12 pages, has Table 1, Figure 1, Figure 2)

**Test Cases**:
1. Upload PDF → Verify tables auto-extracted
2. Upload PDF → Verify figures auto-extracted
3. Navigate to Step 7 → Click "Extract with AI" → Verify mortality/mRS data populated
4. Check Tables tab → Verify Table 1 appears
5. Check Figures tab → Verify Figure 1, Figure 2 appear

## Success Criteria

✅ **Improvement #1**: Figures (0) → Figures (2+) after PDF upload
✅ **Improvement #2**: Tables tab shows extracted tables automatically
✅ **Improvement #3**: Step 7 AI extraction populates Mortality Data and mRS Data sections

## Estimated Effort

- **Improvement #1**: 4-6 hours (figure detection + caption matching)
- **Improvement #2**: 3-4 hours (integrate existing code + auto-trigger)
- **Improvement #3**: 5-7 hours (modify edge function + schema + parsing)

**Total**: 12-17 hours of development time

## Next Steps

1. Implement Improvement #2 (Automated Table Extraction)
2. Implement Improvement #3 (Enhanced Step 7 Extraction)
3. Implement Improvement #1 (Automated Figure Extraction)
4. Test all improvements with Winslow2023.pdf
5. Document changes and update README
6. Prepare Git commit with all improvements
