import * as pdfjsLib from 'pdfjs-dist';

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

export interface TableRegion {
  startRow: number;
  rows: TextItem[][];
  columnPositions: number[];
}

export interface ExtractedTable {
  id: string;
  pageNum: number;
  headers: string[];
  rows: string[][];
  columnPositions: number[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  extractionMethod: string;
}

/**
 * Extract text items with coordinates from a PDF page
 */
async function extractTextItems(page: any): Promise<TextItem[]> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  const items: TextItem[] = [];
  
  for (const item of textContent.items) {
    if ('str' in item && item.str.trim().length > 0) {
      const [, , , , x, y] = item.transform;
      
      items.push({
        text: item.str,
        x: x,
        y: viewport.height - y, // Flip Y axis to top-down
        width: item.width,
        height: item.height,
        fontName: item.fontName || '',
      });
    }
  }
  
  return items;
}

/**
 * Group text items into rows based on Y coordinate
 */
export function groupItemsByRow(items: TextItem[], tolerance: number = 5): TextItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  
  const rows: TextItem[][] = [];
  let currentRow: TextItem[] = [];
  let lastY = -Infinity;
  
  sorted.forEach(item => {
    if (Math.abs(item.y - lastY) > tolerance) {
      // New row
      if (currentRow.length > 0) {
        rows.push(currentRow.sort((a, b) => a.x - b.x)); // Sort by X
      }
      currentRow = [item];
      lastY = item.y;
    } else {
      // Same row
      currentRow.push(item);
    }
  });
  
  if (currentRow.length > 0) {
    rows.push(currentRow.sort((a, b) => a.x - b.x));
  }
  
  return rows;
}

/**
 * Detect column positions from a row of text items
 */
export function detectColumnPositions(row: TextItem[], tolerance: number = 10): number[] {
  const positions = row.map(item => item.x);
  
  // Cluster nearby X positions
  const clusters: number[][] = [];
  
  positions.forEach(pos => {
    const existingCluster = clusters.find(cluster =>
      cluster.some(p => Math.abs(p - pos) < tolerance)
    );
    
    if (existingCluster) {
      existingCluster.push(pos);
    } else {
      clusters.push([pos]);
    }
  });
  
  // Return average of each cluster
  return clusters
    .map(cluster => cluster.reduce((sum, val) => sum + val, 0) / cluster.length)
    .sort((a, b) => a - b);
}

/**
 * Check if row's columns align with table's column structure
 */
function alignsWithColumns(
  positions: number[], 
  tableColumns: number[], 
  tolerance: number = 15
): boolean {
  // Check if at least 70% of positions align with existing columns
  const aligned = positions.filter(pos =>
    tableColumns.some(col => Math.abs(pos - col) < tolerance)
  );
  
  return aligned.length >= Math.max(positions.length * 0.7, Math.min(positions.length, tableColumns.length - 1));
}

/**
 * Detect table regions in the grouped rows
 */
export function detectTableRegions(rows: TextItem[][]): TableRegion[] {
  const tableRegions: TableRegion[] = [];
  let currentTable: TableRegion | null = null;
  
  rows.forEach((row, rowIndex) => {
    const columnPositions = detectColumnPositions(row);
    
    // Check if row is part of a table
    const hasMultipleColumns = columnPositions.length >= 3;
    const alignsWithTable = currentTable && 
      alignsWithColumns(columnPositions, currentTable.columnPositions);
    
    if (alignsWithTable) {
      // Continue existing table
      currentTable!.rows.push(row);
      // Update column positions with more data
      const allPositions = [...currentTable!.columnPositions, ...columnPositions];
      currentTable!.columnPositions = detectColumnPositions(
        allPositions.map(x => ({ text: '', x, y: 0, width: 0, height: 0, fontName: '' })),
        15
      );
    } else if (hasMultipleColumns) {
      // Start new table
      if (currentTable && currentTable.rows.length >= 2) {
        tableRegions.push(currentTable);
      }
      currentTable = {
        startRow: rowIndex,
        rows: [row],
        columnPositions: columnPositions,
      };
    } else {
      // Not a table row
      if (currentTable && currentTable.rows.length >= 2) {
        tableRegions.push(currentTable);
      }
      currentTable = null;
    }
  });
  
  // Don't forget the last table
  if (currentTable && currentTable.rows.length >= 2) {
    tableRegions.push(currentTable);
  }
  
  return tableRegions;
}

/**
 * Find the closest column index for a given X position
 */
function findClosestColumn(x: number, columns: number[]): number {
  let minDist = Infinity;
  let closestIdx = 0;
  
  columns.forEach((col, idx) => {
    const dist = Math.abs(x - col);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  });
  
  return closestIdx;
}

/**
 * Calculate bounding box for a list of text items
 */
function calculateBoundingBox(items: TextItem[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (items.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const xs = items.map(i => i.x);
  const ys = items.map(i => i.y);
  const rights = items.map(i => i.x + i.width);
  const bottoms = items.map(i => i.y + i.height);
  
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...rights);
  const maxY = Math.max(...bottoms);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert table region to structured grid format
 */
export function convertToStructuredTable(tableRegion: TableRegion): Omit<ExtractedTable, 'id' | 'pageNum' | 'extractionMethod'> {
  const rows = tableRegion.rows;
  const columnPositions = tableRegion.columnPositions;
  
  // Create empty grid
  const grid: string[][] = [];
  
  rows.forEach(row => {
    const gridRow: string[] = new Array(columnPositions.length).fill('');
    
    row.forEach((item: TextItem) => {
      // Find which column this item belongs to
      const colIndex = findClosestColumn(item.x, columnPositions);
      
      // Concatenate text if multiple items in same cell
      if (gridRow[colIndex]) {
        gridRow[colIndex] = (gridRow[colIndex] + ' ' + item.text).trim();
      } else {
        gridRow[colIndex] = item.text.trim();
      }
    });
    
    grid.push(gridRow);
  });
  
  // First row is typically headers
  const headers = grid[0] || [];
  const dataRows = grid.slice(1);
  
  return {
    headers,
    rows: dataRows,
    columnPositions,
    boundingBox: calculateBoundingBox(rows.flat()),
  };
}

/**
 * Extract all tables from a PDF page
 */
export async function extractTablesFromPage(
  page: any,
  pageNum: number
): Promise<ExtractedTable[]> {
  try {
    // 1. Get text with positions
    const textItems = await extractTextItems(page);
    
    if (textItems.length === 0) {
      return [];
    }
    
    // 2. Group into rows
    const rows = groupItemsByRow(textItems);
    
    if (rows.length < 2) {
      return [];
    }
    
    // 3. Detect table regions
    const tableRegions = detectTableRegions(rows);
    
    // 4. Convert to structured format
    const tables = tableRegions.map((region, idx) => {
      const structured = convertToStructuredTable(region);
      
      return {
        id: `table-${pageNum}-${idx + 1}`,
        pageNum,
        ...structured,
        extractionMethod: 'geometric_detection',
      };
    });
    
    return tables;
  } catch (error) {
    console.error(`Error extracting tables from page ${pageNum}:`, error);
    return [];
  }
}
