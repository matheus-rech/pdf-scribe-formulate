# Manual Table Extraction Test Plan

**Project**: PDF Scribe Formulate  
**Feature**: Manual Table Extraction using Region Tool  
**Purpose**: Verify the complete workflow for extracting tables from PDF documents  
**Test PDF**: Kim2016.pdf - Table 2 (Clinical Outcomes)

---

## Overview

This test plan outlines the step-by-step process for testing the manual table extraction feature, which is the intended method for extracting structured tabular data from PDF research papers.

**Key Understanding**: The application uses a **two-tier extraction approach**:
1. **AI Text Extraction** - Extracts text-based fields (definitions, descriptions)
2. **Manual Table Extraction** - Extracts structured tabular data using Region tool

---

## Prerequisites

### 1. Environment Setup
- ✅ Development server running (`npm run dev`)
- ✅ Application accessible at http://localhost:8080
- ✅ User authenticated (test@example.com)
- ✅ PDF uploaded (Kim2016.pdf, 9 pages)

### 2. Test Data
- **PDF**: Kim2016.pdf
- **Target Table**: Table 2 - Clinical Outcomes
- **Expected Location**: Page 5 (approximately)
- **Table Structure**:
  - **Headers**: Outcome, Group A (SDC), Group B (No SDC), P-value
  - **Rows**: Mortality at discharge, Mortality at 12 months, mRS 0-2 at discharge, mRS 0-2 at 12 months, etc.

---

## Test Plan

### Phase 1: Preparation

#### Test 1.1: Navigate to Table Page
**Steps**:
1. Open application with Kim2016.pdf loaded
2. Navigate to page 5 using page navigation
3. Verify Table 2 is visible in PDF viewer

**Expected Result**:
- Page 5 displayed
- Table 2 visible with clear headers and data

**Actual Result**: _[To be filled during testing]_

---

### Phase 2: Region Tool Activation

#### Test 2.1: Activate Region Tool
**Steps**:
1. Locate the PDF viewer toolbar
2. Click the "Region" button
3. Observe cursor change

**Expected Result**:
- Region tool activates
- Cursor changes to crosshair or selection cursor
- Visual feedback indicates tool is active

**Actual Result**: _[To be filled during testing]_

---

### Phase 3: Table Selection

#### Test 3.1: Select Table Area
**Steps**:
1. Position cursor at top-left corner of Table 2
2. Click and hold mouse button
3. Drag to bottom-right corner of Table 2
4. Release mouse button

**Expected Result**:
- Selection rectangle appears during drag
- Selected area highlights the entire table
- Visual feedback shows selected region

**Actual Result**: _[To be filled during testing]_

#### Test 3.2: Confirm Table Selection
**Steps**:
1. After releasing mouse, observe any dialogs or prompts
2. If prompted, confirm table extraction
3. Wait for processing

**Expected Result**:
- Dialog appears asking to confirm table extraction
- Processing indicator shows table is being parsed
- Success message appears

**Actual Result**: _[To be filled during testing]_

---

### Phase 4: Table Parsing and Display

#### Test 4.1: Verify Table in Tables Tab
**Steps**:
1. Navigate to right panel
2. Click "Tables" tab
3. Observe table list

**Expected Result**:
- Tables tab shows "Tables (1)" or similar count
- Table 2 appears in the list
- Table metadata displayed:
  - Table ID (e.g., "Table 2")
  - Page number (5)
  - Dimensions (e.g., 4×8 for 4 columns, 8 rows)
  - Caption (if detected)

**Actual Result**: _[To be filled during testing]_

#### Test 4.2: View Table Details
**Steps**:
1. In Tables tab, click "View" button on Table 2
2. Observe table detail dialog

**Expected Result**:
- Dialog opens showing full table
- Headers correctly parsed
- Rows correctly parsed
- Data aligned properly
- Caption displayed (if available)

**Actual Result**: _[To be filled during testing]_

---

### Phase 5: Table Data Verification

#### Test 5.1: Verify Table Structure
**Steps**:
1. In table detail view, verify headers
2. Count rows and columns
3. Check data alignment

**Expected Headers**:
- Column 1: "Outcome"
- Column 2: "Group A (SDC)" or similar
- Column 3: "Group B (No SDC)" or similar
- Column 4: "P-value" or "P"

**Expected Rows** (approximate):
- Mortality at discharge
- Mortality at 12-month follow-up
- mRS 0-2 at discharge
- mRS 0-2 at 12 months
- mRS 3-6 at discharge
- mRS 3-6 at 12 months

**Actual Result**: _[To be filled during testing]_

#### Test 5.2: Verify Table Data Accuracy
**Steps**:
1. Compare extracted table data with PDF
2. Verify at least 3 data points match exactly
3. Check for parsing errors

**Sample Data Points to Verify**:
- Mortality at discharge (Group A): ___ (from PDF)
- Mortality at 12 months (Group B): ___ (from PDF)
- mRS 0-2 at 12 months (P-value): ___ (from PDF)

**Actual Result**: _[To be filled during testing]_

---

### Phase 6: Table Export

#### Test 6.1: Export Table as CSV
**Steps**:
1. In table detail view, click "Download CSV"
2. Verify file downloads
3. Open CSV file in text editor or spreadsheet

**Expected Result**:
- CSV file downloads with table ID as filename
- CSV contains headers as first row
- CSV contains all data rows
- Data properly comma-separated
- No parsing errors

**Actual Result**: _[To be filled during testing]_

#### Test 6.2: Export Table as JSON
**Steps**:
1. In table detail view, click "Download JSON"
2. Verify file downloads
3. Open JSON file in text editor

**Expected Result**:
- JSON file downloads with table ID as filename
- JSON structure includes:
  - `headers`: array of column headers
  - `rows`: array of arrays (row data)
  - `columnCount`: number
  - `rowCount`: number
- Valid JSON format

**Actual Result**: _[To be filled during testing]_

---

### Phase 7: Table-to-Form Mapping (Manual)

#### Test 7.1: Navigate to Step 7 (Outcomes)
**Steps**:
1. Navigate to Step 7 in extraction form
2. Observe Mortality Data and mRS Data sections

**Expected Result**:
- Step 7 form visible
- "Add Mortality Data" button visible
- "Add mRS Data" button visible
- Empty sections (no auto-populated data)

**Actual Result**: _[To be filled during testing]_

#### Test 7.2: Manually Enter Mortality Data from Table
**Steps**:
1. Click "Add Mortality Data"
2. Enter data from Table 2:
   - Timepoint: "At discharge"
   - Overall N: ___ (from table)
   - Overall %: ___ (from table)
3. Click "Add Mortality Data" again
4. Enter data for "12-month follow-up"

**Expected Result**:
- Two mortality data entries created
- Data saved to form
- Quality score increases

**Actual Result**: _[To be filled during testing]_

#### Test 7.3: Manually Enter mRS Data from Table
**Steps**:
1. Click "Add mRS Data"
2. Enter data from Table 2:
   - Timepoint: "At discharge"
   - mRS 0-2: ___ (from table)
   - mRS 3-6: ___ (from table)
3. Repeat for "12-month follow-up"

**Expected Result**:
- Two mRS data entries created
- Data saved to form
- Quality score increases

**Actual Result**: _[To be filled during testing]_

---

### Phase 8: Table Deletion

#### Test 8.1: Delete Extracted Table
**Steps**:
1. Navigate to Tables tab
2. Click delete button (trash icon) on Table 2
3. Confirm deletion if prompted

**Expected Result**:
- Confirmation dialog appears
- After confirmation, table is removed from list
- Tables count decreases to (0)
- Success message appears

**Actual Result**: _[To be filled during testing]_

---

## Edge Cases and Error Scenarios

### Edge Case 1: Selecting Non-Table Region
**Steps**:
1. Activate Region tool
2. Select a region with only text (not a table)
3. Observe behavior

**Expected Result**:
- System attempts to parse as table
- May show error or warning
- Or may create table with single column

**Actual Result**: _[To be filled during testing]_

---

### Edge Case 2: Selecting Partial Table
**Steps**:
1. Activate Region tool
2. Select only part of Table 2 (e.g., first 2 columns)
3. Observe behavior

**Expected Result**:
- Partial table extracted
- Only selected columns/rows included
- No errors

**Actual Result**: _[To be filled during testing]_

---

### Edge Case 3: Overlapping Table Selection
**Steps**:
1. Extract Table 2 successfully
2. Activate Region tool again
3. Select same region (Table 2) again
4. Observe behavior

**Expected Result**:
- New table entry created (duplicate)
- Or system detects duplicate and warns
- Both tables appear in Tables tab

**Actual Result**: _[To be filled during testing]_

---

## Performance Testing

### Performance Test 1: Large Table Extraction
**Steps**:
1. Find largest table in Kim2016.pdf
2. Extract using Region tool
3. Measure time to parse and display

**Expected Result**:
- Parsing completes within 5 seconds
- Table displays correctly
- No performance degradation

**Actual Result**: _[To be filled during testing]_

---

## Accessibility Testing

### Accessibility Test 1: Keyboard Navigation
**Steps**:
1. Attempt to activate Region tool using keyboard only
2. Attempt to select table region using keyboard

**Expected Result**:
- Region tool can be activated via keyboard (Tab + Enter)
- Table selection possible via keyboard (arrow keys, Enter)

**Actual Result**: _[To be filled during testing]_

---

## Integration Testing

### Integration Test 1: Table Extraction with AI Extraction
**Steps**:
1. Perform AI extraction in Step 7 (extracts outcome definitions)
2. Extract Table 2 using Region tool
3. Manually enter data from table into form
4. Verify both AI-extracted and manually-entered data coexist

**Expected Result**:
- AI-extracted outcome definitions preserved
- Manually-entered table data saved separately
- No conflicts or data loss
- Quality score reflects all data

**Actual Result**: _[To be filled during testing]_

---

## Success Criteria

The manual table extraction feature is considered **PASSING** if:

✅ **Core Functionality**:
1. Region tool activates successfully
2. Table can be selected by clicking and dragging
3. Table is parsed and stored in database
4. Table appears in Tables tab
5. Table data is accurate (>95% accuracy)

✅ **Data Quality**:
6. Headers correctly identified
7. Rows correctly parsed
8. Data alignment correct
9. No major parsing errors

✅ **Export Functionality**:
10. CSV export works correctly
11. JSON export works correctly
12. Exported data matches displayed data

✅ **Integration**:
13. Extracted tables persist across sessions
14. Tables can be deleted successfully
15. Multiple tables can be extracted from same PDF

---

## Known Limitations

Based on code review, the following limitations are expected:

1. **No automatic table detection** - Tables must be manually selected
2. **No automatic table-to-form mapping** - Data must be manually entered into form fields
3. **Table parsing quality depends on PDF structure** - Complex tables may not parse perfectly
4. **No OCR for scanned PDFs** - Only works with text-based PDFs

---

## Recommendations for Future Testing

1. **Automated E2E Tests**: Create Playwright tests for table extraction workflow
2. **Table Parsing Accuracy Benchmark**: Test on 10+ different table structures
3. **Performance Benchmarking**: Test with tables of varying sizes (10 rows to 100+ rows)
4. **Cross-browser Testing**: Verify Region tool works in Chrome, Firefox, Safari
5. **Mobile Testing**: Test table extraction on tablet devices

---

## Appendix: Alternative Table Extraction Methods

### Method 1: Copy-Paste from PDF
**Steps**:
1. Select table in PDF viewer (Ctrl+A or click-drag)
2. Copy to clipboard (Ctrl+C)
3. Paste into external tool (Excel, Google Sheets)
4. Manually enter data into form

**Pros**: Works with any PDF viewer  
**Cons**: Manual, error-prone, no integration

---

### Method 2: AI Table Vision (Future Feature)
**Steps**:
1. Extract table using Region tool
2. Click "Enhance with AI" button
3. AI analyzes table structure using vision model
4. AI improves parsing accuracy

**Pros**: Higher accuracy, automated  
**Cons**: Not yet implemented, requires AI API

---

### Method 3: Automatic Table-to-Form Mapping (Future Feature)
**Steps**:
1. Extract table using Region tool
2. Click "Map to Form" button
3. System suggests field mappings (e.g., "Mortality at discharge" → Mortality Data entry)
4. User confirms mappings
5. Data automatically populated in form

**Pros**: Saves time, reduces errors  
**Cons**: Not yet implemented, requires ML model

---

## Test Execution Log

| Test ID | Test Name | Date | Tester | Status | Notes |
|---------|-----------|------|--------|--------|-------|
| 1.1 | Navigate to Table Page | ___ | ___ | ⏳ Pending | |
| 2.1 | Activate Region Tool | ___ | ___ | ⏳ Pending | |
| 3.1 | Select Table Area | ___ | ___ | ⏳ Pending | |
| 3.2 | Confirm Table Selection | ___ | ___ | ⏳ Pending | |
| 4.1 | Verify Table in Tables Tab | ___ | ___ | ⏳ Pending | |
| 4.2 | View Table Details | ___ | ___ | ⏳ Pending | |
| 5.1 | Verify Table Structure | ___ | ___ | ⏳ Pending | |
| 5.2 | Verify Table Data Accuracy | ___ | ___ | ⏳ Pending | |
| 6.1 | Export Table as CSV | ___ | ___ | ⏳ Pending | |
| 6.2 | Export Table as JSON | ___ | ___ | ⏳ Pending | |
| 7.1 | Navigate to Step 7 | ___ | ___ | ⏳ Pending | |
| 7.2 | Manually Enter Mortality Data | ___ | ___ | ⏳ Pending | |
| 7.3 | Manually Enter mRS Data | ___ | ___ | ⏳ Pending | |
| 8.1 | Delete Extracted Table | ___ | ___ | ⏳ Pending | |

---

**Test Plan Status**: ✅ COMPLETE - Ready for Execution  
**Next Step**: Execute tests and document results
