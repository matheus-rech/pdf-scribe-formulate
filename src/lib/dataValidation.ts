import type { ParsedTable } from "./tableParser";

export interface ValidationIssue {
  row: number;
  col: number;
  field: string;
  issue: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedFix?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  statistics: {
    totalCells: number;
    validCells: number;
    invalidCells: number;
    emptyCells: number;
    validationRate: number;
  };
}

/**
 * Detect column data types
 */
export const detectColumnTypes = (table: ParsedTable): Record<string, string> => {
  const columnTypes: Record<string, string> = {};

  table.headers.forEach((header, colIndex) => {
    const columnValues = table.rows.map(row => row[colIndex] || "").filter(v => v.trim());
    
    if (columnValues.length === 0) {
      columnTypes[header] = "empty";
      return;
    }

    // Check if numeric
    const numericCount = columnValues.filter(v => /^-?\d+\.?\d*$/.test(v.trim())).length;
    const percentageCount = columnValues.filter(v => /^-?\d+\.?\d*%$/.test(v.trim())).length;
    const pValueCount = columnValues.filter(v => /^[<>]?\s*0?\.\d+$/.test(v.trim())).length;
    const dateCount = columnValues.filter(v => /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/.test(v.trim())).length;

    const total = columnValues.length;

    if (numericCount / total > 0.8) {
      columnTypes[header] = "numeric";
    } else if (percentageCount / total > 0.7) {
      columnTypes[header] = "percentage";
    } else if (pValueCount / total > 0.7) {
      columnTypes[header] = "p-value";
    } else if (dateCount / total > 0.7) {
      columnTypes[header] = "date";
    } else {
      columnTypes[header] = "text";
    }
  });

  return columnTypes;
};

/**
 * Validate numeric ranges for clinical data
 */
const validateNumericRange = (value: string, columnName: string): ValidationIssue | null => {
  const num = parseFloat(value);
  if (isNaN(num)) return null;

  // Clinical data validation rules
  const rules: Record<string, { min: number; max: number; unit?: string }> = {
    age: { min: 0, max: 120, unit: "years" },
    temperature: { min: 35, max: 42, unit: "°C" },
    "heart rate": { min: 30, max: 250, unit: "bpm" },
    "blood pressure": { min: 50, max: 250, unit: "mmHg" },
    mortality: { min: 0, max: 100, unit: "%" },
    percentage: { min: 0, max: 100, unit: "%" },
  };

  const lowerColumn = columnName.toLowerCase();
  
  for (const [key, range] of Object.entries(rules)) {
    if (lowerColumn.includes(key)) {
      if (num < range.min || num > range.max) {
        return {
          row: -1,
          col: -1,
          field: columnName,
          issue: `Value ${num} is outside expected range (${range.min}-${range.max} ${range.unit || ""})`,
          severity: "high",
          suggestedFix: `Check if value should be within ${range.min}-${range.max}`,
        };
      }
    }
  }

  return null;
};

/**
 * Detect outliers using IQR method
 */
const detectOutliers = (values: number[]): Set<number> => {
  if (values.length < 4) return new Set();

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return new Set(values.filter(v => v < lowerBound || v > upperBound));
};

/**
 * Validate table data
 */
export const validateTableData = (table: ParsedTable): ValidationResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  
  const columnTypes = detectColumnTypes(table);
  let validCells = 0;
  let invalidCells = 0;
  let emptyCells = 0;

  // Validate each cell
  table.rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const header = table.headers[colIndex];
      const columnType = columnTypes[header];

      // Check for empty cells
      if (!cell || cell.trim() === "") {
        emptyCells++;
        warnings.push({
          row: rowIndex,
          col: colIndex,
          field: header,
          issue: "Empty cell",
          severity: "low",
        });
        return;
      }

      // Validate based on column type
      if (columnType === "numeric") {
        const num = parseFloat(cell);
        if (isNaN(num)) {
          invalidCells++;
          errors.push({
            row: rowIndex,
            col: colIndex,
            field: header,
            issue: `Expected numeric value but got "${cell}"`,
            severity: "high",
            suggestedFix: "Convert to number or check data entry",
          });
        } else {
          validCells++;
          // Check range
          const rangeIssue = validateNumericRange(cell, header);
          if (rangeIssue) {
            rangeIssue.row = rowIndex;
            rangeIssue.col = colIndex;
            warnings.push(rangeIssue);
          }
        }
      } else if (columnType === "percentage") {
        const match = cell.match(/^(-?\d+\.?\d*)%?$/);
        if (!match) {
          invalidCells++;
          errors.push({
            row: rowIndex,
            col: colIndex,
            field: header,
            issue: `Expected percentage but got "${cell}"`,
            severity: "medium",
            suggestedFix: "Format as percentage (e.g., 45.5%)",
          });
        } else {
          const num = parseFloat(match[1]);
          if (num < 0 || num > 100) {
            warnings.push({
              row: rowIndex,
              col: colIndex,
              field: header,
              issue: `Percentage value ${num}% is outside 0-100 range`,
              severity: "medium",
            });
          }
          validCells++;
        }
      } else if (columnType === "p-value") {
        const match = cell.match(/^[<>]?\s*(0?\.\d+)$/);
        if (!match) {
          invalidCells++;
          errors.push({
            row: rowIndex,
            col: colIndex,
            field: header,
            issue: `Expected p-value but got "${cell}"`,
            severity: "medium",
            suggestedFix: "Format as p-value (e.g., 0.001 or <0.001)",
          });
        } else {
          const num = parseFloat(match[1]);
          if (num > 1) {
            errors.push({
              row: rowIndex,
              col: colIndex,
              field: header,
              issue: `P-value ${num} is greater than 1`,
              severity: "critical",
            });
          }
          validCells++;
        }
      } else {
        validCells++;
      }
    });
  });

  // Check for outliers in numeric columns
  table.headers.forEach((header, colIndex) => {
    if (columnTypes[header] === "numeric") {
      const values = table.rows
        .map((row, rowIndex) => ({ value: parseFloat(row[colIndex]), rowIndex }))
        .filter(({ value }) => !isNaN(value));

      const nums = values.map(v => v.value);
      const outliers = detectOutliers(nums);

      values.forEach(({ value, rowIndex }) => {
        if (outliers.has(value)) {
          warnings.push({
            row: rowIndex,
            col: colIndex,
            field: header,
            issue: `Potential outlier: ${value}`,
            severity: "low",
            suggestedFix: "Verify this value is correct",
          });
        }
      });
    }
  });

  const totalCells = table.rowCount * table.columnCount;
  const validationRate = ((validCells / (totalCells - emptyCells)) * 100);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      totalCells,
      validCells,
      invalidCells,
      emptyCells,
      validationRate: isNaN(validationRate) ? 0 : validationRate,
    },
  };
};

/**
 * Format validation issue for display
 */
export const formatValidationIssue = (issue: ValidationIssue, table: ParsedTable): string => {
  const location = `Row ${issue.row + 1}, Column "${issue.field}"`;
  return `[${issue.severity.toUpperCase()}] ${location}: ${issue.issue}`;
};
