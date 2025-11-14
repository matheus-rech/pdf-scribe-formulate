/**
 * Adaptive Chunking System
 * 
 * Provides configurable text chunking with adaptive sizing based on content type.
 * Optimized for clinical research papers with complex tables and figures.
 */

export interface ChunkingConfig {
  /** Maximum chunk size in tokens (default: 1000) */
  maxChunkSize: number;
  
  /** Overlap size in tokens to prevent context loss (default: 200) */
  overlapSize: number;
  
  /** Whether to respect section boundaries (default: true) */
  respectSections: boolean;
  
  /** Whether to use adaptive sizing based on content type (default: true) */
  adaptiveSizing: boolean;
  
  /** Minimum chunk size in tokens (default: 100) */
  minChunkSize: number;
}

export interface TextChunk {
  /** Chunk content */
  text: string;
  
  /** Starting position in original text */
  startIndex: number;
  
  /** Ending position in original text */
  endIndex: number;
  
  /** Chunk number (0-indexed) */
  chunkNumber: number;
  
  /** Estimated token count */
  tokenCount: number;
  
  /** Content type detected */
  contentType: 'text' | 'table' | 'figure' | 'references' | 'mixed';
  
  /** Section name if detected */
  section?: string;
}

/** Default chunking configuration */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  maxChunkSize: 1000,
  overlapSize: 200,
  respectSections: true,
  adaptiveSizing: true,
  minChunkSize: 100,
};

/**
 * Estimates token count for text (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Detects content type based on text patterns
 */
function detectContentType(text: string): TextChunk['contentType'] {
  const tablePattern = /Table\s+\d+|^\s*\|.*\|/i;
  const figurePattern = /Figure\s+\d+|Fig\.\s+\d+/i;
  const referencesPattern = /^\s*\d+\.\s+[A-Z]/m;
  
  const hasTable = tablePattern.test(text);
  const hasFigure = figurePattern.test(text);
  const hasReferences = referencesPattern.test(text);
  
  if (hasTable && hasFigure) return 'mixed';
  if (hasTable) return 'table';
  if (hasFigure) return 'figure';
  if (hasReferences) return 'references';
  return 'text';
}

/**
 * Detects section boundaries in text
 */
function detectSections(text: string): Array<{ start: number; end: number; name: string }> {
  const sections: Array<{ start: number; end: number; name: string }> = [];
  
  // Enhanced section patterns (supports numbered sections and variations)
  const sectionPatterns = [
    { pattern: /^(?:\d+\.?\s*)?Abstract\s*$/im, name: 'Abstract' },
    { pattern: /^(?:\d+\.?\s*)?Introduction\s*$/im, name: 'Introduction' },
    { pattern: /^(?:\d+\.?\s*)?(Methods?|Materials?\s+and\s+Methods?|Study\s+Design)\s*$/im, name: 'Methods' },
    { pattern: /^(?:\d+\.?\s*)?(Results?|Findings?)\s*$/im, name: 'Results' },
    { pattern: /^(?:\d+\.?\s*)?(Discussion|Clinical\s+Implications?)\s*$/im, name: 'Discussion' },
    { pattern: /^(?:\d+\.?\s*)?(Conclusions?|Summary)\s*$/im, name: 'Conclusion' },
    { pattern: /^(?:\d+\.?\s*)?References?\s*$/im, name: 'References' },
  ];
  
  sectionPatterns.forEach(({ pattern, name }) => {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      sections.push({
        start: match.index,
        end: match.index + match[0].length,
        name,
      });
    }
  });
  
  // Sort by start position
  sections.sort((a, b) => a.start - b.start);
  
  return sections;
}

/**
 * Gets adaptive chunk size based on content type
 */
function getAdaptiveChunkSize(
  contentType: TextChunk['contentType'],
  config: ChunkingConfig
): number {
  if (!config.adaptiveSizing) {
    return config.maxChunkSize;
  }
  
  // Larger chunks for tables and figures to preserve structure
  switch (contentType) {
    case 'table':
      return Math.min(config.maxChunkSize * 1.5, 1500);
    case 'figure':
      return Math.min(config.maxChunkSize * 1.3, 1300);
    case 'references':
      return Math.min(config.maxChunkSize * 0.8, 800);
    default:
      return config.maxChunkSize;
  }
}

/**
 * Chunks text with adaptive sizing and section awareness
 */
export function chunkText(
  text: string,
  config: Partial<ChunkingConfig> = {}
): TextChunk[] {
  const fullConfig: ChunkingConfig = { ...DEFAULT_CHUNKING_CONFIG, ...config };
  const chunks: TextChunk[] = [];
  
  // Detect sections if configured
  const sections = fullConfig.respectSections ? detectSections(text) : [];
  
  let currentIndex = 0;
  let chunkNumber = 0;
  
  while (currentIndex < text.length) {
    // Determine current section
    const currentSection = sections.find(
      s => currentIndex >= s.start && currentIndex < s.end
    );
    
    // Extract a portion of text for analysis
    const sampleText = text.slice(currentIndex, currentIndex + 500);
    const contentType = detectContentType(sampleText);
    
    // Get adaptive chunk size
    const targetChunkSize = getAdaptiveChunkSize(contentType, fullConfig);
    const targetCharCount = targetChunkSize * 4; // Convert tokens to chars
    
    // Find chunk end position
    let endIndex = Math.min(currentIndex + targetCharCount, text.length);
    
    // If respecting sections, don't cross section boundaries
    if (fullConfig.respectSections && currentSection) {
      const nextSection = sections.find(s => s.start > currentIndex);
      if (nextSection && nextSection.start < endIndex) {
        endIndex = nextSection.start;
      }
    }
    
    // Try to break at sentence boundary
    if (endIndex < text.length) {
      const sentenceEnd = text.lastIndexOf('.', endIndex);
      const paragraphEnd = text.lastIndexOf('\n\n', endIndex);
      
      if (sentenceEnd > currentIndex + (targetCharCount * 0.5)) {
        endIndex = sentenceEnd + 1;
      } else if (paragraphEnd > currentIndex + (targetCharCount * 0.5)) {
        endIndex = paragraphEnd + 2;
      }
    }
    
    // Extract chunk
    const chunkText = text.slice(currentIndex, endIndex);
    const tokenCount = estimateTokenCount(chunkText);
    
    // Only create chunk if it meets minimum size (except for last chunk)
    if (tokenCount >= fullConfig.minChunkSize || endIndex === text.length) {
      chunks.push({
        text: chunkText,
        startIndex: currentIndex,
        endIndex,
        chunkNumber,
        tokenCount,
        contentType,
        section: currentSection?.name,
      });
      
      chunkNumber++;
    }
    
    // Move to next chunk with overlap
    const overlapChars = fullConfig.overlapSize * 4;
    currentIndex = Math.max(currentIndex + 1, endIndex - overlapChars);
    
    // Prevent infinite loop
    if (currentIndex >= text.length) break;
  }
  
  console.log(`📝 Created ${chunks.length} adaptive chunks from ${text.length} characters`);
  console.log(`📊 Content types: ${chunks.map(c => c.contentType).join(', ')}`);
  
  return chunks;
}

/**
 * Merges overlapping chunks if needed (for retrieval)
 */
export function mergeOverlappingChunks(chunks: TextChunk[]): string {
  if (chunks.length === 0) return '';
  if (chunks.length === 1) return chunks[0].text;
  
  // Sort by start index
  const sorted = [...chunks].sort((a, b) => a.startIndex - b.startIndex);
  
  const firstChunk = sorted[0];
  if (!firstChunk) return '';
  
  let merged = firstChunk.text;
  let lastEnd = firstChunk.endIndex;
  
  for (let i = 1; i < sorted.length; i++) {
    const chunk = sorted[i];
    if (!chunk) continue;
    
    if (chunk.startIndex < lastEnd) {
      // Overlapping - only add the non-overlapping part
      const overlapStart = lastEnd - chunk.startIndex;
      merged += chunk.text.slice(overlapStart);
    } else {
      // Non-overlapping - add full chunk
      merged += chunk.text;
    }
    
    lastEnd = chunk.endIndex;
  }
  
  return merged;
}

/**
 * Gets chunks for a specific section
 */
export function getChunksForSection(
  chunks: TextChunk[],
  sectionName: string
): TextChunk[] {
  return chunks.filter(chunk => chunk.section === sectionName);
}

/**
 * Gets statistics about chunking
 */
export function getChunkingStats(chunks: TextChunk[]): {
  totalChunks: number;
  avgTokensPerChunk: number;
  contentTypeDistribution: Record<string, number>;
  sectionDistribution: Record<string, number>;
} {
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
  const avgTokensPerChunk = chunks.length > 0 ? totalTokens / chunks.length : 0;
  
  const contentTypeDistribution: Record<string, number> = {};
  const sectionDistribution: Record<string, number> = {};
  
  chunks.forEach(chunk => {
    contentTypeDistribution[chunk.contentType] = 
      (contentTypeDistribution[chunk.contentType] || 0) + 1;
    
    if (chunk.section) {
      sectionDistribution[chunk.section] = 
        (sectionDistribution[chunk.section] || 0) + 1;
    }
  });
  
  return {
    totalChunks: chunks.length,
    avgTokensPerChunk,
    contentTypeDistribution,
    sectionDistribution,
  };
}
