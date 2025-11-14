/**
 * Enhanced Table Caption Detection
 * 
 * Provides flexible table caption matching for various formats including:
 * - Standard tables (Table 1, Table 2)
 * - Supplementary tables (Supplementary Table 1, Table S1)
 * - Appendix tables (Appendix Table A1)
 * - Online-only tables (eTable 1)
 * - Multi-page tables (Table 1 (continued))
 */

export interface TableCaption {
  /** Full caption text */
  fullText: string;
  
  /** Table number (e.g., "1", "S1", "A1") */
  tableNumber: string;
  
  /** Table type (standard, supplementary, appendix, etc.) */
  tableType: 'standard' | 'supplementary' | 'appendix' | 'online' | 'continued';
  
  /** Caption title (text after the table number) */
  title: string;
  
  /** Position in text where caption was found */
  position: number;
  
  /** Whether this is a continuation of a previous table */
  isContinuation: boolean;
  
  /** Original table number if this is a continuation */
  originalTableNumber?: string;
}

export interface TableCaptionPattern {
  /** Regex pattern to match caption */
  pattern: RegExp;
  
  /** Table type this pattern matches */
  type: TableCaption['tableType'];
  
  /** Priority (higher = checked first) */
  priority: number;
}

/**
 * Comprehensive table caption patterns
 */
export const TABLE_CAPTION_PATTERNS: TableCaptionPattern[] = [
  // Multi-page continuations (highest priority)
  {
    pattern: /Table\s+(\d+)\s+\(continued\)(?:\s*[:.]\s*(.+))?/i,
    type: 'continued',
    priority: 100,
  },
  {
    pattern: /Table\s+([A-Z]?\d+)\s+\(cont(?:'d|inued)?\)(?:\s*[:.]\s*(.+))?/i,
    type: 'continued',
    priority: 99,
  },
  
  // Supplementary tables
  {
    pattern: /Supplementary\s+Table\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'supplementary',
    priority: 90,
  },
  {
    pattern: /Table\s+S(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'supplementary',
    priority: 89,
  },
  {
    pattern: /Suppl\.\s+Table\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'supplementary',
    priority: 88,
  },
  {
    pattern: /S\s+Table\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'supplementary',
    priority: 87,
  },
  
  // Appendix tables
  {
    pattern: /Appendix\s+Table\s+([A-Z]?\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'appendix',
    priority: 80,
  },
  {
    pattern: /Table\s+A(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'appendix',
    priority: 79,
  },
  {
    pattern: /Table\s+([A-Z]\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'appendix',
    priority: 78,
  },
  
  // Online-only tables
  {
    pattern: /eTable\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'online',
    priority: 70,
  },
  {
    pattern: /Online\s+Table\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'online',
    priority: 69,
  },
  
  // Standard tables (lowest priority to avoid false matches)
  {
    pattern: /Table\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'standard',
    priority: 50,
  },
  {
    pattern: /Tab\.\s+(\d+)(?:\s*[:.]\s*(.+))?/i,
    type: 'standard',
    priority: 49,
  },
];

/**
 * Detects all table captions in text
 */
export function detectTableCaptions(text: string): TableCaption[] {
  const captions: TableCaption[] = [];
  
  // Sort patterns by priority (highest first)
  const sortedPatterns = [...TABLE_CAPTION_PATTERNS].sort(
    (a, b) => b.priority - a.priority
  );
  
  // Track positions we've already matched to avoid duplicates
  const matchedPositions = new Set<number>();
  
  for (const { pattern, type } of sortedPatterns) {
    let match;
    const regex = new RegExp(pattern, 'gi'); // Global + case insensitive
    
    while ((match = regex.exec(text)) !== null) {
      const position = match.index;
      
      // Skip if we've already matched this position
      if (matchedPositions.has(position)) continue;
      
      const tableNumber = match[1];
      const title = match[2]?.trim() || '';
      const fullText = match[0];
      
      // Check if this is a continuation
      const isContinuation = type === 'continued';
      let originalTableNumber: string | undefined;
      
      if (isContinuation) {
        // Extract original table number from continuation
        originalTableNumber = tableNumber;
      }
      
      captions.push({
        fullText,
        tableNumber,
        tableType: type,
        title,
        position,
        isContinuation,
        originalTableNumber,
      });
      
      matchedPositions.add(position);
    }
  }
  
  // Sort by position
  captions.sort((a, b) => a.position - b.position);
  
  console.log(`📊 Detected ${captions.length} table captions`);
  console.log(`📋 Types: ${captions.map(c => `${c.tableType}:${c.tableNumber}`).join(', ')}`);
  
  return captions;
}

/**
 * Finds a specific table caption by number
 */
export function findTableCaption(
  captions: TableCaption[],
  tableNumber: string,
  tableType?: TableCaption['tableType']
): TableCaption | null {
  return captions.find(
    c => c.tableNumber === tableNumber && (!tableType || c.tableType === tableType)
  ) || null;
}

/**
 * Gets all continuation captions for a table
 */
export function getTableContinuations(
  captions: TableCaption[],
  tableNumber: string
): TableCaption[] {
  return captions.filter(
    c => c.isContinuation && c.originalTableNumber === tableNumber
  );
}

/**
 * Merges multi-page table captions
 */
export function mergeMultiPageCaptions(captions: TableCaption[]): TableCaption[] {
  const merged: TableCaption[] = [];
  const continuationMap = new Map<string, TableCaption[]>();
  
  // Group continuations by original table number
  for (const caption of captions) {
    if (caption.isContinuation && caption.originalTableNumber) {
      const existing = continuationMap.get(caption.originalTableNumber) || [];
      existing.push(caption);
      continuationMap.set(caption.originalTableNumber, existing);
    }
  }
  
  // Process each caption
  for (const caption of captions) {
    if (caption.isContinuation) {
      // Skip continuations (they'll be merged into main table)
      continue;
    }
    
    // Check if this table has continuations
    const continuations = continuationMap.get(caption.tableNumber) || [];
    
    if (continuations.length > 0) {
      // Merge title with continuation info
      const mergedTitle = caption.title + 
        ` (${continuations.length} continuation${continuations.length > 1 ? 's' : ''})`;
      
      merged.push({
        ...caption,
        title: mergedTitle,
      });
    } else {
      merged.push(caption);
    }
  }
  
  return merged;
}

/**
 * Extracts table content between captions
 */
export function extractTableContent(
  text: string,
  caption: TableCaption,
  nextCaption?: TableCaption
): string {
  const startIndex = caption.position + caption.fullText.length;
  const endIndex = nextCaption ? nextCaption.position : text.length;
  
  return text.slice(startIndex, endIndex).trim();
}

/**
 * Validates table caption format
 */
export function validateTableCaption(caption: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if caption has a table number
  if (!/Table\s+[A-Z]?\d+/i.test(caption)) {
    issues.push('Caption does not contain a valid table number');
  }
  
  // Check if caption has a title
  if (!/[:.]\s*.+/.test(caption)) {
    issues.push('Caption does not contain a title after the table number');
  }
  
  // Check caption length
  if (caption.length < 10) {
    issues.push('Caption is too short (minimum 10 characters)');
  }
  
  if (caption.length > 500) {
    issues.push('Caption is too long (maximum 500 characters)');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Normalizes table number for comparison
 */
export function normalizeTableNumber(tableNumber: string): string {
  // Remove leading zeros and whitespace
  return tableNumber.replace(/^0+/, '').trim();
}

/**
 * Gets table caption statistics
 */
export function getTableCaptionStats(captions: TableCaption[]): {
  total: number;
  byType: Record<string, number>;
  hasContinuations: boolean;
  continuationCount: number;
} {
  const byType: Record<string, number> = {};
  let continuationCount = 0;
  
  for (const caption of captions) {
    byType[caption.tableType] = (byType[caption.tableType] || 0) + 1;
    
    if (caption.isContinuation) {
      continuationCount++;
    }
  }
  
  return {
    total: captions.length,
    byType,
    hasContinuations: continuationCount > 0,
    continuationCount,
  };
}

/**
 * Matches extracted tables with their captions
 */
export function matchTablesWithCaptions(
  extractedTables: Array<{ pageNumber: number; rowCount: number }>,
  captions: TableCaption[]
): Array<{
  table: { pageNumber: number; rowCount: number };
  caption: TableCaption | null;
  confidence: number;
}> {
  const matches: Array<{
    table: { pageNumber: number; rowCount: number };
    caption: TableCaption | null;
    confidence: number;
  }> = [];
  
  // Simple matching: assume tables and captions are in the same order
  for (let i = 0; i < extractedTables.length; i++) {
    const table = extractedTables[i];
    const caption = captions[i] || null;
    
    // Calculate confidence based on proximity
    let confidence = 0.5; // Default confidence
    
    if (caption) {
      // Higher confidence if we have a caption
      confidence = 0.8;
      
      // Even higher if it's not a continuation
      if (!caption.isContinuation) {
        confidence = 0.9;
      }
    }
    
    matches.push({
      table,
      caption,
      confidence,
    });
  }
  
  return matches;
}

/**
 * Formats table caption for display
 */
export function formatTableCaptionForDisplay(caption: TableCaption): string {
  let formatted = `**${caption.fullText}**`;
  
  if (caption.title) {
    formatted += `\n${caption.title}`;
  }
  
  if (caption.isContinuation) {
    formatted += '\n*(Continuation of previous table)*';
  }
  
  return formatted;
}
