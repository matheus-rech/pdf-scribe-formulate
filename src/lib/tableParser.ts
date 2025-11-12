export interface TableCell {
  value: string;
  row: number;
  col: number;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
}

/**
 * Detects if text contains a table structure
 */
export const detectTableStructure = (text: string): boolean => {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Check for common table indicators
  const hasMultipleColumns = lines.some(line => {
    // Look for multiple separated values (spaces, tabs, pipes)
    const separatorCount = (line.match(/\s{2,}|\t|\|/g) || []).length;
    return separatorCount >= 2;
  });
  
  const hasConsistentStructure = checkConsistentStructure(lines);
  const hasBorders = lines.some(line => /^[\-+=|]+$/.test(line.trim()));
  
  return hasMultipleColumns || hasConsistentStructure || hasBorders;
};

/**
 * Check if lines have consistent column structure
 */
const checkConsistentStructure = (lines: string[]): boolean => {
  if (lines.length < 3) return false;
  
  const columnCounts = lines.slice(0, 5).map(line => {
    // Count potential columns by significant whitespace
    return (line.match(/\s{2,}|\t|\|/g) || []).length + 1;
  });
  
  // Check if column counts are similar (within 1 of each other)
  const minCols = Math.min(...columnCounts);
  const maxCols = Math.max(...columnCounts);
  
  return maxCols - minCols <= 1 && minCols >= 2;
};

/**
 * Parse text into structured table format
 */
export const parseTableFromText = (text: string): ParsedTable | null => {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return null;
  
  // Try different parsing strategies
  const pipeSeparated = tryParsePipeSeparated(lines);
  if (pipeSeparated) return pipeSeparated;
  
  const tabSeparated = tryParseTabSeparated(lines);
  if (tabSeparated) return tabSeparated;
  
  const whitespaceSeparated = tryParseWhitespaceSeparated(lines);
  if (whitespaceSeparated) return whitespaceSeparated;
  
  return null;
};

/**
 * Parse pipe-separated tables (| col1 | col2 | col3 |)
 */
const tryParsePipeSeparated = (lines: string[]): ParsedTable | null => {
  const dataLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.includes('|') && !/^[\-+=|]+$/.test(trimmed);
  });
  
  if (dataLines.length === 0) return null;
  
  const parsedRows = dataLines.map(line => {
    return line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
  });
  
  // Validate consistent column count
  const columnCounts = parsedRows.map(row => row.length);
  const avgCols = Math.round(columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length);
  
  if (avgCols < 2) return null;
  
  const headers = parsedRows[0];
  const rows = parsedRows.slice(1);
  
  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
};

/**
 * Parse tab-separated tables
 */
const tryParseTabSeparated = (lines: string[]): ParsedTable | null => {
  const dataLines = lines.filter(line => line.includes('\t'));
  
  if (dataLines.length === 0) return null;
  
  const parsedRows = dataLines.map(line => {
    return line.split('\t').map(cell => cell.trim());
  });
  
  const columnCounts = parsedRows.map(row => row.length);
  const avgCols = Math.round(columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length);
  
  if (avgCols < 2) return null;
  
  const headers = parsedRows[0];
  const rows = parsedRows.slice(1);
  
  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
};

/**
 * Parse whitespace-separated tables (multiple spaces as delimiter)
 */
const tryParseWhitespaceSeparated = (lines: string[]): ParsedTable | null => {
  const dataLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !/^[\-+=|]+$/.test(trimmed);
  });
  
  if (dataLines.length === 0) return null;
  
  const parsedRows = dataLines.map(line => {
    // Split by 2+ spaces to handle aligned columns
    return line
      .split(/\s{2,}/)
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
  });
  
  // Check for consistent structure
  const columnCounts = parsedRows.map(row => row.length);
  const avgCols = Math.round(columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length);
  
  if (avgCols < 2) return null;
  
  // Filter rows that don't match the average column count (likely not part of table)
  const validRows = parsedRows.filter(row => Math.abs(row.length - avgCols) <= 1);
  
  if (validRows.length < 2) return null;
  
  const headers = validRows[0];
  const rows = validRows.slice(1);
  
  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
};

/**
 * Convert parsed table to JSON format
 */
export const tableToJSON = (table: ParsedTable): string => {
  const jsonData = table.rows.map(row => {
    const obj: Record<string, string> = {};
    table.headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
  
  return JSON.stringify(jsonData, null, 2);
};

/**
 * Convert parsed table to CSV format
 */
export const tableToCSV = (table: ParsedTable): string => {
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const headerRow = table.headers.map(escapeCSV).join(',');
  const dataRows = table.rows.map(row => 
    row.map(escapeCSV).join(',')
  ).join('\n');
  
  return `${headerRow}\n${dataRows}`;
};

/**
 * Generate table summary statistics
 */
export const getTableStats = (table: ParsedTable) => {
  const totalCells = table.rowCount * table.columnCount;
  const filledCells = table.rows.flat().filter(cell => cell.trim().length > 0).length;
  const fillRate = (filledCells / totalCells) * 100;
  
  return {
    totalRows: table.rowCount,
    totalColumns: table.columnCount,
    totalCells,
    filledCells,
    emptyCells: totalCells - filledCells,
    fillRate: fillRate.toFixed(1),
  };
};
