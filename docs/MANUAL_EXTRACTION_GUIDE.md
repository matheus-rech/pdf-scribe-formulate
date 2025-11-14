# Manual Table and Figure Extraction Guide

**PDF Scribe Formulate** - Clinical Study Extraction System  
**Version**: 1.0  
**Last Updated**: November 14, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Understanding the Extraction Workflow](#understanding-the-extraction-workflow)
3. [Manual Table Extraction](#manual-table-extraction)
4. [Manual Figure Extraction](#manual-figure-extraction)
5. [Working with Extracted Data](#working-with-extracted-data)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

PDF Scribe Formulate uses a **two-tier extraction approach** to extract data from clinical research PDFs:

### Tier 1: AI Text Extraction
- **Purpose**: Extract text-based structured fields
- **Method**: AI-powered extraction using OpenAI function calling
- **Triggers**: "Extract with AI" buttons in each step
- **Extracts**: Metadata, definitions, descriptions, summary values

### Tier 2: Manual Table and Figure Extraction
- **Purpose**: Extract structured tabular data and images
- **Method**: Manual selection using Region and Image tools
- **Triggers**: User interaction with PDF viewer tools
- **Extracts**: Tables, figures, charts, diagrams

**Why this approach?**
- Tables vary widely in structure across studies
- AI table extraction is complex and error-prone
- Manual verification ensures data quality for clinical research
- User control over what gets extracted

---

## Understanding the Extraction Workflow

### The 8-Step Extraction Process

The application guides you through 8 steps to extract comprehensive study data:

| Step | Name | AI Extraction | Manual Extraction |
|------|------|---------------|-------------------|
| 1 | Study ID | ✅ Metadata (DOI, Journal, Year, etc.) | ❌ Not applicable |
| 2 | PICO-T | ✅ Study framework | ❌ Not applicable |
| 3 | Baseline | ✅ Demographics | ⚠️ Optional (demographic tables) |
| 4 | Imaging | ✅ Imaging characteristics | ⚠️ Optional (imaging tables) |
| 5 | Interventions | ✅ Procedure descriptions | ❌ Not applicable |
| 6 | Study Arms | ✅ Group definitions | ❌ Not applicable |
| 7 | Outcomes | ✅ Outcome definitions | ✅ **Results tables required** |
| 8 | Complications | ✅ Adverse events | ⚠️ Optional (complication tables) |

**Key Insight**: Step 7 (Outcomes) is where you'll most commonly need to extract tables manually, as this step contains the primary results data.

---

## Manual Table Extraction

### When to Extract Tables Manually

Extract tables manually when:
- ✅ You need numerical results data (mortality rates, outcome scores, etc.)
- ✅ The table contains structured data not captured by AI extraction
- ✅ You want to preserve the exact table structure from the PDF
- ✅ You need to export table data for further analysis

### Step-by-Step Guide

#### Step 1: Locate the Table

1. **Navigate to the page** containing the table in the PDF viewer
   - Use the page navigation input (e.g., type "5" to go to page 5)
   - Or use the scroll functionality to browse pages

2. **Identify the table** you want to extract
   - Common tables in clinical studies:
     - **Table 1**: Baseline characteristics / Demographics
     - **Table 2**: Primary outcomes / Results
     - **Table 3**: Secondary outcomes / Subgroup analysis
     - **Table 4**: Adverse events / Complications

#### Step 2: Activate the Region Tool

1. **Locate the PDF viewer toolbar** at the top of the PDF panel
2. **Click the "Region" button**
   - Icon: Rectangle selection tool
   - Location: Between "Text" and "Image" buttons

3. **Observe the cursor change**
   - Cursor should change to a crosshair or selection cursor
   - This indicates the Region tool is active

#### Step 3: Select the Table Area

1. **Position your cursor** at the **top-left corner** of the table
   - Include the table caption if present
   - Include column headers

2. **Click and hold** the left mouse button

3. **Drag diagonally** to the **bottom-right corner** of the table
   - Include all rows and columns
   - Include any footnotes or notes below the table

4. **Release the mouse button**
   - A selection rectangle should appear
   - The selected area should highlight the entire table

#### Step 4: Confirm and Process

1. **Wait for processing**
   - The application will parse the table structure
   - This may take a few seconds for large tables

2. **Check for success notification**
   - A toast notification should appear: "Table extracted successfully"
   - If no notification appears, check the console for errors

#### Step 5: Verify the Extracted Table

1. **Navigate to the Tables tab** in the right panel
   - Click "Tables" tab
   - You should see "Tables (1)" or the updated count

2. **View the extracted table**
   - Click the "View" button on the table card
   - A dialog will open showing the full table

3. **Verify the data**
   - Check that headers are correctly identified
   - Verify that rows are correctly parsed
   - Ensure data alignment is correct

4. **If the table is incorrect**:
   - Delete the table using the trash icon
   - Re-extract using a more precise selection
   - Or adjust the selection area

---

## Manual Figure Extraction

### When to Extract Figures Manually

Extract figures manually when:
- ✅ You need to reference specific images (flowcharts, diagrams, graphs)
- ✅ You want to include figures in your meta-analysis documentation
- ✅ You need to verify imaging findings mentioned in the text
- ✅ You want to export figures for presentations or reports

### Step-by-Step Guide

#### Step 1: Locate the Figure

1. **Navigate to the page** containing the figure
2. **Identify the figure** you want to extract
   - Common figures in clinical studies:
     - **Figure 1**: Study flowchart / CONSORT diagram
     - **Figure 2**: Kaplan-Meier survival curves
     - **Figure 3**: Forest plots / Meta-analysis results
     - **Figure 4**: Imaging examples (CT, MRI scans)

#### Step 2: Activate the Image Tool

1. **Locate the PDF viewer toolbar**
2. **Click the "Image" button**
   - Icon: Image/picture icon
   - Location: Next to "Region" button

3. **Observe the cursor change**
   - Cursor should change to indicate image selection mode

#### Step 3: Select the Figure Area

1. **Position your cursor** at the **top-left corner** of the figure
   - Include the figure caption
   - Include the figure label (e.g., "Fig. 1")

2. **Click and drag** to select the entire figure area

3. **Release the mouse button**

#### Step 4: Verify the Extracted Figure

1. **Navigate to the Figures tab** in the right panel
   - Click "Figures" tab
   - You should see "Figures (1)" or the updated count

2. **View the extracted figure**
   - Click on the figure card to view details
   - Verify the image quality and caption

---

## Working with Extracted Data

### Using Extracted Tables in Step 7 (Outcomes)

After extracting a results table (e.g., Table 2 with mortality and mRS data), you need to manually enter the data into the form fields:

#### Example: Entering Mortality Data

**From the extracted table**:
| Outcome | Group A (SDC) | Group B (No SDC) | P-value |
|---------|---------------|------------------|---------|
| Mortality at discharge | 12 (44.4%) | 37 (17.1%) | 0.001 |
| Mortality at 12 months | 12 (44.4%) | 41 (18.9%) | 0.002 |

**To the form**:

1. **Navigate to Step 7 (Outcomes)**
2. **Click "Add Mortality Data"**
3. **Enter the first timepoint**:
   - Timepoint: "At discharge"
   - Overall N: 49 (12 + 37)
   - Overall %: 24.4% (calculated)

4. **Click "Add Mortality Data" again**
5. **Enter the second timepoint**:
   - Timepoint: "12-month follow-up"
   - Overall N: 53 (12 + 41)
   - Overall %: 26.4% (calculated)

#### Example: Entering mRS Data

**From the extracted table**:
| Outcome | Group A (SDC) | Group B (No SDC) | P-value |
|---------|---------------|------------------|---------|
| mRS 0-2 at discharge | 4.3 | 2.8 | <0.001 |
| mRS 0-2 at 12 months | 4.3 | 2.9 | 0.001 |

**To the form**:

1. **Click "Add mRS Data"**
2. **Enter the first timepoint**:
   - Timepoint: "At discharge"
   - (Additional mRS fields will appear based on the form structure)

3. **Repeat for additional timepoints**

### Exporting Extracted Tables

You can export extracted tables in two formats:

#### CSV Export
- **Use case**: Import into Excel, Google Sheets, or statistical software
- **How**: Click the CSV icon on the table card
- **File format**: Comma-separated values with headers

#### JSON Export
- **Use case**: Programmatic access, data pipelines, API integration
- **How**: Click the JSON icon on the table card
- **File format**: Structured JSON with headers and rows arrays

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Table Not Extracted After Selection

**Symptoms**:
- Selected table area but no table appears in Tables tab
- No success notification

**Possible Causes**:
- Selection area too small
- PDF table is an image (scanned PDF)
- Table structure is too complex

**Solutions**:
1. **Ensure you selected the entire table** including headers and all rows
2. **Check if the PDF is text-based** (not scanned)
   - Try selecting text in the PDF
   - If text can't be selected, the PDF may be scanned
3. **Try a smaller section** of the table first
4. **Check the browser console** for error messages

#### Issue 2: Table Parsed Incorrectly

**Symptoms**:
- Headers misaligned
- Rows merged or split incorrectly
- Data in wrong columns

**Possible Causes**:
- Complex table structure (merged cells, nested headers)
- Selection area included non-table content
- Table has irregular formatting

**Solutions**:
1. **Delete the incorrectly parsed table**
2. **Re-select with more precision**
   - Exclude table footnotes
   - Exclude surrounding text
3. **For complex tables**: Consider manual data entry instead

#### Issue 3: Region Tool Not Activating

**Symptoms**:
- Clicking "Region" button has no effect
- Cursor doesn't change

**Possible Causes**:
- PDF not fully loaded
- Browser compatibility issue
- JavaScript error

**Solutions**:
1. **Wait for PDF to fully load** (check page count indicator)
2. **Refresh the page** and try again
3. **Check browser console** for errors
4. **Try a different browser** (Chrome recommended)

#### Issue 4: Figures Tab Empty After Extraction

**Symptoms**:
- Selected figure area but nothing appears in Figures tab

**Possible Causes**:
- Image tool not properly activated
- Figure is vector graphics (not raster image)
- Selection area didn't capture the image

**Solutions**:
1. **Verify the Image tool is active** before selecting
2. **Try selecting a larger area** around the figure
3. **Check if the figure is embedded** or just referenced

---

## Best Practices

### For Table Extraction

1. **Extract tables in order** (Table 1, Table 2, Table 3, etc.)
   - This helps maintain organization
   - Easier to reference later

2. **Include table captions** in your selection
   - Helps identify the table later
   - Provides context for the data

3. **Verify data accuracy immediately** after extraction
   - Compare at least 3 data points with the PDF
   - Check that headers match the PDF

4. **Use consistent naming** if you manually label tables
   - Follow the PDF's table numbering
   - Add descriptive suffixes if needed (e.g., "Table 2 - Outcomes")

5. **Export tables as soon as extracted**
   - Backup in case of browser crash
   - Allows offline analysis

### For Figure Extraction

1. **Extract key figures only**
   - Focus on figures referenced in your extraction
   - Don't extract every figure in the PDF

2. **Include figure labels and captions**
   - Helps identify the figure later
   - Provides context

3. **Check image quality** after extraction
   - Ensure text in the figure is readable
   - Re-extract if quality is poor

### For Data Entry

1. **Cross-reference with extracted tables**
   - Keep the Tables tab open while entering data
   - Verify each value as you enter it

2. **Use the validation features**
   - Click checkmark buttons to validate fields
   - Review the Quality Score regularly

3. **Save frequently**
   - The application auto-saves, but manual saves are recommended
   - Use "Save & Export" button periodically

4. **Create citations for all extracted data**
   - Link data back to the PDF source
   - Enables verification and audit trails

---

## Advanced Tips

### Batch Table Extraction

For PDFs with many tables:

1. **Extract all tables first** before entering data
2. **Review all extracted tables** in the Tables tab
3. **Delete any incorrectly parsed tables**
4. **Then proceed with data entry**

This workflow is more efficient than extracting and entering data table-by-table.

### Handling Complex Tables

For tables with merged cells, nested headers, or irregular formatting:

1. **Extract the table as-is**
2. **Export to CSV**
3. **Clean up in Excel or Google Sheets**
4. **Manually enter cleaned data into the form**

This hybrid approach combines automation with manual quality control.

### Using AI Table Vision (Future Feature)

**Note**: This feature is not yet implemented, but is planned for future releases.

Once available, you'll be able to:
1. Extract a table using the Region tool
2. Click "Enhance with AI" button
3. AI will analyze the table structure using vision models
4. Improved parsing accuracy for complex tables

---

## Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Highlight text | `Ctrl+H` | Highlight selected text in PDF |
| Next page | `→` | Navigate to next page |
| Previous page | `←` | Navigate to previous page |
| Zoom in | `Ctrl++` | Increase PDF zoom |
| Zoom out | `Ctrl+-` | Decrease PDF zoom |
| Search | `Ctrl+F` | Search within PDF |

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the browser console** for error messages
2. **Review the application logs** in the Debug panel
3. **Contact support** at [support email]
4. **Submit a bug report** with:
   - PDF file (if possible)
   - Screenshot of the issue
   - Steps to reproduce
   - Browser and version

---

## Changelog

### Version 1.0 (November 14, 2025)
- Initial documentation
- Added comprehensive table extraction guide
- Added figure extraction guide
- Added troubleshooting section
- Added best practices

---

**End of Manual Extraction Guide**
