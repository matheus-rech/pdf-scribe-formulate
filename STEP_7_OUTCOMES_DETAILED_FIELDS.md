# Step 7: Outcomes - Detailed Field Documentation

**Test Date**: November 14, 2025  
**Purpose**: Document all specific fields in Step 7 (Outcomes) where tables with clinical results are expected to be extracted

---

## Overview

**Step 7: Outcomes** is the critical step where **clinical outcome data** is extracted from results tables in the PDF. This step focuses on:
1. **Mortality Data** (death rates at various timepoints)
2. **Modified Rankin Scale (mRS) Data** (functional outcomes at various timepoints)

Both sections use a **repeatable entry model** where users can add multiple timepoint measurements.

---

## Section 1: Mortality Data

### Purpose
Extract mortality/death rates at different follow-up timepoints (e.g., 30-day mortality, 90-day mortality, 12-month mortality).

### Structure
**Repeatable Section**: Users can click "Add Mortality Data" button to add multiple mortality measurements at different timepoints.

### Fields Per Entry

| Field Name | Type | Required | Placeholder/Example | Description |
|------------|------|----------|---------------------|-------------|
| **Timepoint** | Text | Yes | "e.g., 30 days, 90 days..." | The follow-up timepoint when mortality was measured (e.g., "30 days", "90 days", "12 months", "at discharge") |
| **Overall N** | Number | Yes | - | Total number of deaths at this timepoint across all study groups |
| **Overall %** | Number | Yes | - | Overall mortality percentage at this timepoint |

### Additional Features
- **Delete Button**: Red trash icon to remove a mortality data entry
- **Add Mortality Data Button**: Blue button to add another mortality timepoint entry

### Expected Data from Kim2016.pdf

Based on the PDF content, the expected mortality data includes:

**Table 2 - Clinical Outcomes**:
- **At Discharge**:
  - Group A (SDC): ? deaths / 28 patients
  - Group B (No SDC): ? deaths / 56 patients
  
- **12-Month Follow-up**:
  - Group A: ? deaths / 28 patients
  - Group B: ? deaths / 56 patients

**Note**: The application currently only captures **Overall** mortality (combined across groups), not stratified by treatment arm. For stratified data, users would need to add separate entries or the schema would need arm-specific fields.

---

## Section 2: Modified Rankin Scale (mRS) Data

### Purpose
Extract functional outcome data using the Modified Rankin Scale (mRS), a widely used scale for measuring disability after stroke (0 = no symptoms, 6 = death).

### Structure
**Repeatable Section**: Users can click "Add mRS Data" button to add multiple mRS measurements at different timepoints.

### Fields Per Entry (Partially Visible)

| Field Name | Type | Required | Placeholder/Example | Description |
|------------|------|----------|---------------------|-------------|
| **Timepoint** | Text | Yes | "e.g., 90 days, 6 months..." | The follow-up timepoint when mRS was measured (e.g., "90 days", "6 months", "12 months") |

**Note**: Additional fields not yet visible in current scroll position. Need to scroll down further to see:
- mRS score distribution fields (mRS 0, 1, 2, 3, 4, 5, 6)
- Favorable outcome fields (mRS 0-2 or 0-3)
- Unfavorable outcome fields (mRS 3-6 or 4-6)
- Treatment arm stratification (Group A vs Group B)

### Expected Data from Kim2016.pdf

Based on the PDF content, the expected mRS data includes:

**Table 2 - Clinical Outcomes**:
- **At Discharge**:
  - mRS 0-2 (favorable outcome): Group A vs Group B
  - mRS 3-6 (unfavorable outcome): Group A vs Group B
  
- **12-Month Follow-up**:
  - mRS 0-2 (favorable outcome): Group A vs Group B
  - mRS 3-6 (unfavorable outcome): Group A vs Group B
  - Individual mRS scores (0, 1, 2, 3, 4, 5, 6) distribution

**From PDF Abstract**:
> "At 12-month follow-up, favorable outcomes (modified Rankin Scale score, 0–2) were more frequent in group A (log-rank, P=0.009), and the absence of severe disability (modified Rankin Scale score, 4–6) was more common in group A (log-rank, P=0.009)."

---

## AI Extraction Features for Step 7

### Available AI Extraction Methods

1. **"Extract with AI" Button**
   - Single AI model extraction
   - Analyzes the PDF to extract mortality and mRS data
   - Expected to populate both Mortality Data and mRS Data sections

2. **"Multi-AI Review" Button**
   - Multiple AI models extract data independently
   - Conflict detection and consensus building
   - Higher confidence in extracted values

### Expected AI Extraction Behavior

When "Extract with AI" is clicked for Step 7, the AI should:

1. **Locate Results Tables** in the PDF (typically Table 2 or Table 3)
2. **Extract Mortality Data**:
   - Identify timepoints (discharge, 30 days, 90 days, 12 months, etc.)
   - Extract death counts (N) and percentages (%)
   - Create separate entries for each timepoint

3. **Extract mRS Data**:
   - Identify timepoints (discharge, 90 days, 6 months, 12 months, etc.)
   - Extract mRS score distributions (0, 1, 2, 3, 4, 5, 6)
   - Extract favorable outcome data (mRS 0-2)
   - Extract unfavorable outcome data (mRS 3-6)
   - Create separate entries for each timepoint

4. **Create Citations**:
   - Link each extracted value to its source location in the PDF
   - Include page number, table number, and coordinates
   - Enable "Find Source" functionality for verification

---

## Relationship to Tables

### Why Step 7 is Critical for Table Extraction

**Step 7 (Outcomes)** is where **results tables** are most likely to be extracted because:

1. **Results tables contain outcome data**: Mortality rates, mRS scores, functional outcomes
2. **Structured data format**: Tables are the primary way clinical outcomes are reported
3. **Multiple timepoints**: Outcomes are measured at various follow-up periods
4. **Comparative data**: Treatment vs Control group comparisons

### Expected Tables in Kim2016.pdf

**Table 1: Baseline Characteristics**
- Demographics (age, gender)
- Clinical characteristics (GCS, NIHSS, infarct volume)
- **Extracted in Step 3 (Baseline)**, not Step 7

**Table 2: Clinical Outcomes** ← **PRIMARY TABLE FOR STEP 7**
- Mortality at discharge and 12-month follow-up
- mRS scores at discharge and 12-month follow-up
- Favorable outcomes (mRS 0-2)
- Unfavorable outcomes (mRS 3-6)
- **Should be extracted in Step 7 (Outcomes)**

**Table 3: Logistic Regression Analysis**
- Odds ratios for favorable outcomes
- Confidence intervals
- P-values
- **May be extracted in Step 7 or Step 8**

**Table 4: Complications** (if present)
- Adverse events
- Complication rates
- **Extracted in Step 8 (Complications)**, not Step 7

---

## Current Status

### What We've Confirmed

✅ **Mortality Data Section**:
- Structure: Repeatable entries
- Fields: Timepoint, Overall N, Overall %
- Add/Delete functionality: Working

✅ **mRS Data Section**:
- Structure: Repeatable entries
- Fields: Timepoint (confirmed), additional fields not yet visible
- Add/Delete functionality: Working

### What We Need to Explore

❓ **Complete mRS Fields**:
- Need to scroll down to see all mRS score fields
- Expected: mRS 0, 1, 2, 3, 4, 5, 6 distribution fields
- Expected: Favorable/unfavorable outcome groupings
- Expected: Treatment arm stratification

❓ **AI Extraction for Step 7**:
- Need to click "Extract with AI" to test if it populates Mortality and mRS data
- Need to check if Tables tab is populated after AI extraction
- Need to verify if citations link to results tables

❓ **Table Extraction**:
- Need to check if "Tables" tab shows extracted tables after AI extraction
- Need to verify if table data is automatically parsed into form fields
- Need to test manual table extraction using "Region" tool

---

## Next Steps for Testing

### 1. Complete mRS Field Documentation
```
Action: Scroll down in Step 7 to see all mRS fields
Expected: mRS score distribution fields (0-6)
Expected: Favorable/unfavorable outcome groupings
Expected: Treatment arm fields (Group A vs Group B)
```

### 2. Test AI Extraction for Step 7
```
Action: Click "Extract with AI" button in Step 7
Expected: AI extracts mortality data from Table 2
Expected: AI extracts mRS data from Table 2
Expected: Multiple entries created for different timepoints
Expected: Citations created linking to Table 2
Result: Check if Tables tab is populated
```

### 3. Check Tables Tab After Extraction
```
Action: Navigate to Tables tab after AI extraction
Expected: Table 2 (Clinical Outcomes) appears in Tables tab
Expected: Table structure is preserved (rows, columns, headers)
Expected: Table data is linked to extracted form fields
```

### 4. Test Manual Table Extraction
```
Action: Navigate to page with Table 2 in PDF viewer
Action: Click "Region" tool in toolbar
Action: Select Table 2 by clicking and dragging
Expected: Table is extracted and parsed
Expected: Table appears in Tables tab
Result: Verify if table data auto-populates form fields
```

---

## Hypothesis: How Tables Are Extracted

Based on the application architecture and Step 7 structure, here's the likely table extraction workflow:

### Automatic Table Extraction (via AI)

1. **User clicks "Extract with AI" in Step 7**
2. **AI analyzes the PDF** to locate results tables (Table 2, Table 3)
3. **AI extracts structured data** from tables:
   - Mortality rates at different timepoints
   - mRS scores at different timepoints
   - Treatment arm comparisons
4. **AI populates form fields** in Step 7:
   - Creates multiple "Mortality Data" entries (one per timepoint)
   - Creates multiple "mRS Data" entries (one per timepoint)
5. **AI creates citations** linking each value to its source table
6. **Tables are stored** in the Tables tab for reference
7. **User reviews and accepts** the extracted data

### Manual Table Extraction (via Region Tool)

1. **User navigates to page with table** in PDF viewer
2. **User clicks "Region" tool** in toolbar
3. **User selects table area** by clicking and dragging
4. **Application parses table structure** using Auto Table Parser
5. **Table is added to Tables tab** with structure preserved
6. **User can manually map table cells to form fields**
7. **Citations are created** linking form fields to table cells

### Edge Functions Involved

Based on the Supabase edge functions list:

- **`match-table-captions`**: Matches tables to their captions (e.g., "Table 2. Clinical Outcomes")
- **`ai-table-vision`**: Uses AI vision to analyze table structure and extract data
- **`extract-outcomes`**: Dedicated function for extracting outcome data from results tables
- **`create-citation`**: Creates citation records linking extracted data to source tables

---

## Conclusion

**Step 7 (Outcomes)** is the **primary step for results table extraction** in the PDF Scribe Formulate application. The step is designed to extract:

1. **Mortality data** at multiple timepoints
2. **mRS functional outcome data** at multiple timepoints
3. **Comparative data** between treatment arms
4. **Statistical results** (p-values, confidence intervals)

The extraction can be performed:
- **Automatically** via "Extract with AI" button (recommended)
- **Manually** via "Region" tool for table selection
- **Semi-automatically** via "Multi-AI Review" for higher confidence

The extracted data is:
- **Structured** into repeatable form entries
- **Cited** with links to source tables in the PDF
- **Validated** by users before committing to the database
- **Exportable** to JSON/CSV formats

**Key Insight**: The Tables tab likely populates **during or after** AI extraction in Step 7, not before. Tables are extracted **as part of the data extraction workflow**, not as a separate preliminary step.

---

**Status**: ✅ **Mortality Data fields documented**  
**Status**: ⏳ **mRS Data fields partially documented** (need to scroll to see all fields)  
**Next Action**: Scroll down to see complete mRS fields, then test AI extraction
