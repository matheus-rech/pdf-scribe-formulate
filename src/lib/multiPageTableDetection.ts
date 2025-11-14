/**
 * Multi-Page Table Detection and Merging
 * 
 * Detects when tables span multiple pages and merges them into single cohesive tables.
 * Handles continuation patterns like "Table 1 (continued)" and preserves metadata.
 */

export interface TableWithMetadata {
  /** Table number/identifier */
  tableNumber: string;
  
  /** Page number where table starts */
  pageNumber: number;
  
  /** Table caption */
  caption: string;
  
  /** Table rows (array of arrays) */
  rows: string[][];
  
  /** Total row count */
  rowCount: number;
  
  /** Whether this is a continuation of a previous table */
  isContinuation: boolean;
  
  /** Original table number if this is a continuation */
  originalTableNumber?: string;
  
  /** Page numbers if table spans multiple pages */
  pageNumbers?: number[];
}

export interface MultiPageTable {
  /** Main table (first page) */
  mainTable: TableWithMetadata;
  
  /** Continuation tables (subsequent pages) */
  continuations: TableWithMetadata[];
  
  /** Merged table with all rows */
  mergedTable: TableWithMetadata;
  
  /** Total pages spanned */
  totalPages: number;
}

/**
 * Continuation patterns to detect multi-page tables
 */
const CONTINUATION_PATTERNS = [
  /Table\s+(\d+)\s+\(continued\)/i,
  /Table\s+(\d+)\s+\(cont(?:'d|inued)?\)/i,
  /Table\s+(\d+)\s*-\s*Continued/i,
  /Table\s+([A-Z]?\d+)\s+\(continued\)/i,
  /Table\s+([A-Z]?\d+)\s+\(cont(?:'d|inued)?\)/i,
];

/**
 * Detects if a table caption indicates a continuation
 */
export function isContinuationCaption(caption: string): {
  isContinuation: boolean;
  originalTableNumber?: string;
} {
  for (const pattern of CONTINUATION_PATTERNS) {
    const match = caption.match(pattern);
    if (match) {
      return {
        isContinuation: true,
        originalTableNumber: match[1],
      };
    }
  }
  
  return { isContinuation: false };
}

/**
 * Groups tables by their table number (including continuations)
 */
export function groupTablesByNumber(
  tables: TableWithMetadata[]
): Map<string, TableWithMetadata[]> {
  const grouped = new Map<string, TableWithMetadata[]>();
  
  for (const table of tables) {
    // Check if this is a continuation
    const continuationInfo = isContinuationCaption(table.caption);
    
    if (continuationInfo.isContinuation && continuationInfo.originalTableNumber) {
      // This is a continuation - add to the original table's group
      const existing = grouped.get(continuationInfo.originalTableNumber) || [];
      existing.push({
        ...table,
        isContinuation: true,
        originalTableNumber: continuationInfo.originalTableNumber,
      });
      grouped.set(continuationInfo.originalTableNumber, existing);
    } else {
      // This is a main table
      const existing = grouped.get(table.tableNumber) || [];
      existing.push({
        ...table,
        isContinuation: false,
      });
      grouped.set(table.tableNumber, existing);
    }
  }
  
  return grouped;
}

/**
 * Merges multiple table pages into a single table
 */
export function mergeTables(tables: TableWithMetadata[]): TableWithMetadata {
  if (tables.length === 0) {
    throw new Error('Cannot merge empty table array');
  }
  
  if (tables.length === 1) {
    return tables[0];
  }
  
  // Sort by page number
  const sorted = [...tables].sort((a, b) => a.pageNumber - b.pageNumber);
  
  // Start with the first table
  const mainTable = sorted[0];
  const allRows: string[][] = [...mainTable.rows];
  const pageNumbers: number[] = [mainTable.pageNumber];
  
  // Merge rows from continuation tables
  for (let i = 1; i < sorted.length; i++) {
    const continuation = sorted[i];
    allRows.push(...continuation.rows);
    pageNumbers.push(continuation.pageNumber);
  }
  
  // Create merged table
  const merged: TableWithMetadata = {
    tableNumber: mainTable.tableNumber,
    pageNumber: mainTable.pageNumber,
    caption: mainTable.caption,
    rows: allRows,
    rowCount: allRows.length,
    isContinuation: false,
    pageNumbers,
  };
  
  console.log(`🔗 Merged table ${mainTable.tableNumber} from ${pageNumbers.length} pages`);
  
  return merged;
}

/**
 * Detects and groups multi-page tables
 */
export function detectMultiPageTables(
  tables: TableWithMetadata[]
): MultiPageTable[] {
  const grouped = groupTablesByNumber(tables);
  const multiPageTables: MultiPageTable[] = [];
  
  for (const [tableNumber, tableParts] of grouped.entries()) {
    if (tableParts.length > 1) {
      // This table spans multiple pages
      const mainTable = tableParts.find(t => !t.isContinuation);
      const continuations = tableParts.filter(t => t.isContinuation);
      
      if (!mainTable) {
        console.warn(`⚠️ No main table found for table ${tableNumber}`);
        continue;
      }
      
      const mergedTable = mergeTables(tableParts);
      
      multiPageTables.push({
        mainTable,
        continuations,
        mergedTable,
        totalPages: tableParts.length,
      });
      
      console.log(`📊 Detected multi-page table ${tableNumber} spanning ${tableParts.length} pages`);
    }
  }
  
  return multiPageTables;
}

/**
 * Merges all multi-page tables in a collection
 */
export function mergeMultiPageTables(
  tables: TableWithMetadata[]
): TableWithMetadata[] {
  const grouped = groupTablesByNumber(tables);
  const merged: TableWithMetadata[] = [];
  
  for (const [, tableParts] of grouped.entries()) {
    if (tableParts.length > 1) {
      // Multi-page table - merge it
      merged.push(mergeTables(tableParts));
    } else {
      // Single-page table - keep as is
      merged.push(tableParts[0]);
    }
  }
  
  console.log(`✅ Merged ${tables.length} tables into ${merged.length} (removed ${tables.length - merged.length} continuations)`);
  
  return merged;
}

/**
 * Gets statistics about multi-page tables
 */
export function getMultiPageTableStats(tables: TableWithMetadata[]): {
  totalTables: number;
  singlePageTables: number;
  multiPageTables: number;
  maxPagesSpanned: number;
  avgRowsPerTable: number;
} {
  const multiPageTables = detectMultiPageTables(tables);
  const singlePageTables = tables.length - multiPageTables.reduce(
    (sum, mpt) => sum + mpt.totalPages,
    0
  );
  
  const maxPagesSpanned = multiPageTables.length > 0
    ? Math.max(...multiPageTables.map(mpt => mpt.totalPages))
    : 0;
  
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  const avgRowsPerTable = tables.length > 0 ? totalRows / tables.length : 0;
  
  return {
    totalTables: tables.length,
    singlePageTables,
    multiPageTables: multiPageTables.length,
    maxPagesSpanned,
    avgRowsPerTable,
  };
}
