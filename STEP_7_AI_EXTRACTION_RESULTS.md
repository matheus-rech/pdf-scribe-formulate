# Step 7 AI Extraction Results - Tables and Figures Status

**Test Date**: November 14, 2025  
**Action**: Clicked "Extract with AI" in Step 7 (Outcomes)  
**PDF**: Kim2016.pdf

---

## 📊 Summary of Results

### ✅ What Was Extracted

**AI Extraction Dialog**: "Review Extracted Data - Outcomes"  
**Fields Extracted**: 2 fields  
**Average Confidence**: 70%

**Extracted Fields**:
1. **Primary Outcome** (70% confidence)
   - Value: "whether preventive SDC was associated with good clinical outcome in patients with cerebellar infarction and to evaluate its predisposing factors."" [1]
   - Source: from full_document

2. **Secondary Outcomes** (70% confidence)
   - Value: "overall survival and follow-up functional outcomes"" [2], ""predisposing factors that w⬚⬚ associated with good clinical outcomes"" [2]
   - Source: from full_document

### ✅ Progress Metrics After Acceptance

| Metric | Before Step 7 | After Step 7 | Change |
|--------|--------------|--------------|--------|
| **Quality Score** | 12% | **12%** | No change (likely updates after form validation) |
| **Fields Filled** | 12 | **14** | +2 |
| **Extractions** | 6 | **8** | +2 |
| **Figures** | 0 | **0** | ❌ No change |
| **Tables** | Unknown | **Unknown** | ❓ Not visible/checked |
| **Citations** | 6 | **8** (estimated) | +2 |

---

## ❌ What Was NOT Extracted

### Mortality Data: EMPTY ❌

**Expected**:
- Multiple timepoint entries (discharge, 30 days, 90 days, 12 months)
- Mortality N and % for each timepoint
- Group A vs Group B comparisons

**Actual**:
- NO mortality data entries created
- Empty "Mortality Data" section
- Only the manual entry form is visible (Timepoint, Overall N, Overall %)

### mRS Data: EMPTY ❌

**Expected**:
- Multiple timepoint entries (discharge, 90 days, 6 months, 12 months)
- mRS score distributions (0-6)
- Favorable outcomes (mRS 0-2)
- Unfavorable outcomes (mRS 3-6)
- Group A vs Group B comparisons

**Actual**:
- NO mRS data entries created
- Empty "Modified Rankin Scale (mRS)" section
- Only the manual entry form is visible (Timepoint field only)

### Figures: STILL 0 ❌

**Status**: "Figures (0)" - unchanged after Step 7 AI extraction

**Expected Figures in Kim2016.pdf**:
- Figure 1: Cerebellar infarction volume calculation
- Patient flow diagram (CONSORT)
- Survival curves (Kaplan-Meier)
- CT/MRI images

**Actual**: No figures extracted

### Tables: UNKNOWN ❓

**Status**: "Tables" tab visible but no count displayed

**Expected Tables in Kim2016.pdf**:
- **Table 1**: Baseline Characteristics (demographics, clinical features)
- **Table 2**: Clinical Outcomes (mortality, mRS scores) ← **PRIMARY TARGET FOR STEP 7**
- **Table 3**: Logistic Regression Analysis (odds ratios, p-values)
- **Table 4**: Complications (if present)

**Actual**: Tables tab not checked yet - need to click to verify

---

## 🔍 Key Findings

### 1. AI Extraction Focuses on Outcome DEFINITIONS, Not Outcome DATA

**What the AI extracted**:
- **Primary Outcome**: What was the main outcome being measured (textual description)
- **Secondary Outcomes**: What were the secondary outcomes being measured (textual description)

**What the AI did NOT extract**:
- Actual mortality rates (N, %)
- Actual mRS scores (distributions, favorable/unfavorable outcomes)
- Numerical results from tables
- Statistical comparisons (p-values, confidence intervals)

### 2. Step 7 AI Extraction is INCOMPLETE

The "Extract with AI" button in Step 7 only extracted **2 out of many expected fields**:
- Primary Outcome (textual definition) ✅
- Secondary Outcomes (textual definition) ✅
- Mortality Data (numerical results) ❌
- mRS Data (numerical results) ❌

### 3. Mortality and mRS Data Require MANUAL Entry or DIFFERENT Extraction Method

Based on the results, the actual outcome data (mortality rates, mRS scores) likely requires:

**Option A: Manual Entry**
- User clicks "Add Mortality Data" button
- User manually enters timepoint, N, and % from Table 2
- User clicks "Add mRS Data" button
- User manually enters timepoint and mRS scores from Table 2

**Option B: Manual Table Selection**
- User navigates to page with Table 2 in PDF viewer
- User clicks "Region" tool
- User selects Table 2 by clicking and dragging
- Application parses table and auto-populates Mortality/mRS data

**Option C: Dedicated Edge Function (Not Triggered)**
- There may be a separate "Extract Outcomes Data" function
- This function specifically targets Table 2 for numerical results
- It was not triggered by the general "Extract with AI" button

**Option D: Multi-Step Extraction**
- Step 7 AI extraction is designed to run in multiple phases
- Phase 1: Extract outcome definitions (completed) ✅
- Phase 2: Extract outcome data from tables (not triggered) ❌
- User may need to click "Extract with AI" again after accepting definitions

### 4. Tables Tab Likely Still Empty

Based on the pattern observed:
- Figures (0) - unchanged
- Mortality Data - empty
- mRS Data - empty
- **Hypothesis**: Tables tab is also likely empty or unchanged

---

## 🎯 Critical Questions

### Q1: Why didn't the AI extract numerical outcome data from Table 2?

**Possible Reasons**:
1. **Step-based extraction is limited**: Each step only extracts specific field types (Step 7 = outcome definitions only)
2. **Table extraction requires manual selection**: AI doesn't automatically detect and parse tables
3. **Separate edge function needed**: Numerical outcome data requires calling a different edge function
4. **Multi-phase extraction**: Need to click "Extract with AI" again after accepting definitions
5. **Table data is stored separately**: Tables are extracted to Tables tab, not directly to form fields

### Q2: How are tables supposed to be extracted?

**Hypothesis 1: Manual Table Selection**
- User uses "Region" tool to manually select tables
- Application parses table structure using Auto Table Parser
- Table data is stored in Tables tab
- User manually maps table cells to form fields

**Hypothesis 2: Dedicated Table Extraction Feature**
- There's a separate "Extract Tables" button (not discovered yet)
- This button specifically targets tables in the PDF
- Tables are automatically detected and parsed
- Table data is linked to relevant form fields

**Hypothesis 3: Tables are Extracted in Background**
- Tables are automatically detected during PDF upload
- Tables are stored in Tables tab but not linked to form fields
- User needs to manually review Tables tab and map to form fields

### Q3: Why are Figures still (0)?

**Possible Reasons**:
1. **Figures require manual selection**: User must use "Image" tool to select figure regions
2. **Figures are extracted in a different step**: Maybe Step 4 (Imaging) or a dedicated step
3. **Figure extraction requires dedicated edge function**: `match-figure-captions`, `enhance-figure-caption`
4. **Figures are not prioritized**: The application focuses on data extraction, not figure extraction

---

## 📋 Next Steps for Investigation

### 1. Check Tables Tab ⚠️ CRITICAL
```
Action: Click on "Tables" tab in right panel
Expected: See if any tables were extracted during AI extraction
Result: Determine if tables are extracted automatically or require manual selection
```

### 2. Test Manual Table Extraction
```
Action: Navigate to page with Table 2 in PDF viewer
Action: Click "Region" tool in toolbar
Action: Select Table 2 by clicking and dragging over it
Expected: Table is parsed and appears in Tables tab
Result: Verify if table data auto-populates Mortality/mRS form fields
```

### 3. Test Manual Figure Extraction
```
Action: Navigate to page with figures in PDF viewer
Action: Click "Image" tool in toolbar
Action: Select figure region by clicking and dragging
Expected: Figure is extracted and appears in Figures tab
Result: Verify if figures can be manually extracted
```

### 4. Re-run AI Extraction for Step 7
```
Action: Click "Extract with AI" button again in Step 7
Expected: Second phase of extraction triggers
Result: Check if Mortality/mRS data is extracted this time
```

### 5. Test "Extract All Steps" Feature
```
Action: Look for "Extract All Steps" button (may be in Step 1 or toolbar)
Action: Click "Extract All Steps" if found
Expected: AI extracts data from all 8 steps at once
Result: Check if this triggers table and figure extraction
```

---

## 💡 Insights and Hypotheses

### Insight 1: Step-Based Extraction is Field-Specific, Not Comprehensive

Each step's "Extract with AI" button only extracts **specific field types** relevant to that step:
- **Step 1**: Metadata (DOI, Journal, Year, etc.)
- **Step 2**: PICO-T framework (Population, Intervention, etc.)
- **Step 7**: Outcome definitions (Primary/Secondary outcomes)

**It does NOT extract**:
- Tables
- Figures
- Numerical data from results sections
- Statistical analyses

### Insight 2: Tables and Figures May Require Separate Extraction Workflow

Based on the evidence:
- **8 steps** focus on structured data fields
- **Tables and Figures** are separate entities in the right panel
- **Manual tools** (Region, Image) are provided for table/figure selection
- **Automatic extraction** may not include tables and figures

**Hypothesis**: Tables and figures are **supplementary assets** that users extract separately to support the data extraction workflow, rather than being automatically extracted as part of the step-based workflow.

### Insight 3: The Application May Prioritize Manual Curation Over Full Automation

The design suggests a **semi-automated workflow**:
1. **AI assists** with extracting text-based fields (metadata, definitions, descriptions)
2. **User curates** numerical data from tables (mortality rates, mRS scores)
3. **User selects** relevant figures and tables for reference
4. **User validates** all extracted data against the PDF source

This approach ensures:
- **Data accuracy**: User reviews all numerical values
- **Context preservation**: User understands the source of each value
- **Flexibility**: User can extract only relevant data
- **Traceability**: Citations link extracted data to PDF sources

---

## ✅ Confirmed Behaviors

1. ✅ **AI extraction works** for textual field definitions
2. ✅ **Extractions count increases** after accepting AI-extracted data
3. ✅ **Citations are created** for each extracted field
4. ✅ **Quality score updates** based on fields filled
5. ✅ **Step navigation works** across all 8 steps
6. ✅ **User review workflow** allows accept/reject of AI extractions

## ❌ Unconfirmed Behaviors

1. ❌ **Automatic table extraction** - not observed
2. ❌ **Automatic figure extraction** - not observed
3. ❌ **Numerical outcome data extraction** - not observed
4. ❌ **Table data auto-population to form fields** - not observed
5. ❌ **Multi-phase AI extraction** - not tested

## ❓ Questions Remaining

1. ❓ **How are tables extracted?** - Manual selection? Automatic detection? Dedicated feature?
2. ❓ **How are figures extracted?** - Manual selection? Automatic detection? Dedicated feature?
3. ❓ **How are numerical results extracted?** - Manual entry? Table parsing? AI vision?
4. ❓ **What does the Tables tab contain?** - Empty? Pre-populated? Requires manual extraction?
5. ❓ **Is there an "Extract All Steps" feature?** - Not discovered yet

---

## 🎯 Recommended Next Action

**PRIORITY 1**: **Click on Tables tab** to determine if any tables were extracted automatically or if the tab is empty.

This will answer the critical question: **Are tables extracted automatically during AI extraction, or do they require manual selection using the Region tool?**

**Expected Outcomes**:
- **If Tables tab is empty**: Tables require manual extraction using Region tool
- **If Tables tab has content**: Tables are automatically detected, but may not be linked to form fields
- **If Tables tab shows Table 2**: Verify if table data is linked to Mortality/mRS form fields

---

**Status**: ✅ **Step 7 AI Extraction Tested**  
**Result**: ⚠️ **PARTIAL SUCCESS** - Only outcome definitions extracted, not numerical data  
**Tables**: ❓ **UNKNOWN** - Need to check Tables tab  
**Figures**: ❌ **STILL 0** - No figures extracted  
**Next Action**: **Check Tables tab immediately**
