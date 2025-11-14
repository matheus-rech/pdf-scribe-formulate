# Testing Guide: Automatic Table Extraction

## 1. Objective

This document provides a detailed testing guide for the new **automatic table extraction** feature in the PDF Scribe Formulate application. The goal is to ensure that the feature works correctly and reliably.

## 2. Prerequisites

- The application is running in a development environment (`npm run dev`).
- You have a PDF file with tables (e.g., `Winslow2023.pdf`).
- You have access to the application in your browser.

## 3. Test Cases

### Test Case 1: Successful Table Extraction

**Objective**: Verify that tables are automatically extracted from a PDF with tables.

**Steps**:
1. Open the application in your browser.
2. Upload a PDF file that contains tables (e.g., `Winslow2023.pdf`).
3. Observe the notifications. You should see a toast message: `Automatically extracted X table(s) from PDF`.
4. Navigate to the **Tables tab** in the right-hand panel.
5. Verify that the extracted tables are listed.
6. Click on an extracted table to view its details.
7. Verify that the table headers and rows are correct.
8. Verify that the table caption is correctly matched (if available).

**Expected Result**: Tables are automatically extracted and displayed correctly in the Tables tab.

### Test Case 2: PDF with No Tables

**Objective**: Verify that the application handles PDFs with no tables gracefully.

**Steps**:
1. Open the application in your browser.
2. Upload a PDF file that does not contain any tables.
3. Observe the notifications. You should NOT see a toast message about table extraction.
4. Navigate to the **Tables tab**.
5. Verify that the empty state message is displayed: `No tables extracted yet. Use the Region tool to extract tables from the PDF.`

**Expected Result**: The application does not attempt to extract tables and displays the correct empty state message.

### Test Case 3: PDF with Complex Tables

**Objective**: Verify that the application can handle complex table structures (e.g., merged cells, multi-line rows).

**Steps**:
1. Open the application in your browser.
2. Upload a PDF file with complex tables.
3. Navigate to the **Tables tab**.
4. Verify that the extracted tables are listed.
5. Click on an extracted table to view its details.
6. Verify that the table structure is correctly parsed, even with complex layouts.

**Expected Result**: The application correctly parses and displays complex tables.

## 4. Known Limitations

- The geometric table detection may not work for all table structures, especially those without clear borders or with very complex layouts.
- Caption matching is based on regex patterns and may not always be accurate.

## 5. Conclusion

This testing guide provides a comprehensive set of test cases to verify the functionality of the automatic table extraction feature. By following these steps, you can ensure that the feature is working correctly and reliably before deploying it to production.
