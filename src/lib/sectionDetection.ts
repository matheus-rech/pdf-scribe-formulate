import type { PageChunk } from './pdfChunking';

export interface DetectedSection {
  name: string;
  type: SectionType;
  pageStart: number;
  pageEnd: number;
  charStart: number;
  charEnd: number;
  confidence: number;
  headingText?: string;
  subsections?: string[];
}

export type SectionType =
  | 'title'
  | 'abstract'
  | 'introduction'
  | 'methods'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'references'
  | 'appendix'
  | 'unknown';

/**
 * Detect document sections using pattern matching and heuristics
 */
export function detectSections(pageChunks: PageChunk[]): DetectedSection[] {
  const sections: DetectedSection[] = [];
  const fullText = pageChunks.map(c => c.text).join('\n\n');
  
  // Enhanced patterns with more variations and context
  const sectionPatterns = [
    {
      type: 'title' as SectionType,
      patterns: [
        /^.{0,100}$/m,  // Very short first page content often contains title
      ],
      priority: 0,
      maxPage: 1
    },
    {
      type: 'abstract' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?abstract\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?summary\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?synopsis\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?executive summary\s*[:.]?\s*\n/i,
      ],
      priority: 1
    },
    {
      type: 'introduction' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?introduction\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?background\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?rationale\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?objectives?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?aims?\s*[:.]?\s*\n/i,
      ],
      priority: 2
    },
    {
      type: 'methods' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?methods?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?methodology\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?materials? and methods?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?study design\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?experimental (?:design|procedure|setup)\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?patient(?:s)? and methods?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?study (?:population|participants|subjects)\s*[:.]?\s*\n/i,
      ],
      priority: 3
    },
    {
      type: 'results' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?results?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?findings?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?outcomes?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?data analysis\s*[:.]?\s*\n/i,
      ],
      priority: 4
    },
    {
      type: 'discussion' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?discussion\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?interpretation\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?results? and discussion\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?clinical implications?\s*[:.]?\s*\n/i,
      ],
      priority: 5
    },
    {
      type: 'conclusion' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?conclusions?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?concluding remarks?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?summary and conclusions?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?implications?\s*[:.]?\s*\n/i,
      ],
      priority: 6
    },
    {
      type: 'references' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?references?\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?bibliography\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?works? cited\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?literature cited\s*[:.]?\s*\n/i,
      ],
      priority: 7
    },
    {
      type: 'appendix' as SectionType,
      patterns: [
        /\n\s*(?:[\dA-Z]+\.?\s*)?appendi(?:x|ces)\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?supplementary (?:material|data|information)\s*[:.]?\s*\n/i,
        /\n\s*(?:[\dA-Z]+\.?\s*)?supporting information\s*[:.]?\s*\n/i,
      ],
      priority: 8
    }
  ];
  
  const matches: Array<{
    type: SectionType;
    index: number;
    headingText: string;
    priority: number;
  }> = [];
  
  // Use global regex to find all matches, not just the first
  for (const sectionDef of sectionPatterns) {
    for (const pattern of sectionDef.patterns) {
      const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      let match;
      
      while ((match = regex.exec(fullText)) !== null) {
        // Check page restriction if specified
        if (sectionDef.maxPage) {
          const matchPage = getPageForCharPosition(match.index, pageChunks);
          if (matchPage > sectionDef.maxPage) continue;
        }
        
        matches.push({
          type: sectionDef.type,
          index: match.index,
          headingText: match[0].trim(),
          priority: sectionDef.priority
        });
      }
    }
  }
  
  // Remove duplicate matches (same type at similar positions)
  const uniqueMatches = matches.filter((match, idx, arr) => {
    const duplicate = arr.find((m, i) => 
      i < idx && 
      m.type === match.type && 
      Math.abs(m.index - match.index) < 100
    );
    return !duplicate;
  });
  
  uniqueMatches.sort((a, b) => a.index - b.index);
  
  // Build sections from matches
  for (let i = 0; i < uniqueMatches.length; i++) {
    const match = uniqueMatches[i];
    const nextMatch = uniqueMatches[i + 1];
    
    const charStart = match.index;
    const charEnd = nextMatch ? nextMatch.index : fullText.length;
    
    // Calculate confidence based on pattern clarity and position
    const confidence = calculateConfidence(match, i, uniqueMatches.length, pageChunks);
    
    sections.push({
      name: formatSectionName(match.type),
      type: match.type,
      pageStart: getPageForCharPosition(charStart, pageChunks),
      pageEnd: getPageForCharPosition(charEnd, pageChunks),
      charStart,
      charEnd,
      confidence,
      headingText: match.headingText
    });
  }
  
  // If no sections detected, create intelligent defaults
  if (sections.length === 0) {
    console.log('No sections detected, using default structure');
    sections.push(...createDefaultSections(pageChunks));
  } else {
    console.log(`Detected ${sections.length} sections:`, sections.map(s => s.name));
  }
  
  return sections;
}

function calculateConfidence(
  match: { type: SectionType; index: number; headingText: string },
  position: number,
  totalSections: number,
  pageChunks: PageChunk[]
): number {
  let confidence = 0.7; // Base confidence
  
  // Higher confidence for clear headings with colons or periods
  if (match.headingText.includes(':') || match.headingText.includes('.')) {
    confidence += 0.1;
  }
  
  // Higher confidence for expected ordering
  const expectedOrder: SectionType[] = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion', 'references'];
  const expectedPosition = expectedOrder.indexOf(match.type);
  if (expectedPosition !== -1 && position === expectedPosition) {
    confidence += 0.1;
  }
  
  // Higher confidence for typical page positions
  const page = getPageForCharPosition(match.index, pageChunks);
  const totalPages = pageChunks.length;
  const relativePosition = page / totalPages;
  
  if (match.type === 'abstract' && relativePosition < 0.1) confidence += 0.1;
  if (match.type === 'methods' && relativePosition >= 0.2 && relativePosition <= 0.5) confidence += 0.1;
  if (match.type === 'results' && relativePosition >= 0.4 && relativePosition <= 0.7) confidence += 0.1;
  if (match.type === 'references' && relativePosition > 0.8) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function formatSectionName(type: SectionType): string {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getPageForCharPosition(charPos: number, pageChunks: PageChunk[]): number {
  let currentPos = 0;
  
  for (const chunk of pageChunks) {
    if (charPos >= currentPos && charPos < currentPos + chunk.text.length) {
      return chunk.page;
    }
    currentPos += chunk.text.length + 2;
  }
  
  return pageChunks[pageChunks.length - 1]?.page || 1;
}

function createDefaultSections(pageChunks: PageChunk[]): DetectedSection[] {
  const totalPages = pageChunks.length;
  const fullText = pageChunks.map(c => c.text).join('\n\n');
  
  const introEnd = Math.floor(totalPages * 0.2);
  const methodsEnd = Math.floor(totalPages * 0.8);
  
  return [
    {
      name: 'Introduction',
      type: 'introduction',
      pageStart: 1,
      pageEnd: introEnd,
      charStart: 0,
      charEnd: pageChunks[introEnd - 1]?.charEnd || 0,
      confidence: 0.5
    },
    {
      name: 'Methods & Results',
      type: 'methods',
      pageStart: introEnd + 1,
      pageEnd: methodsEnd,
      charStart: pageChunks[introEnd]?.charStart || 0,
      charEnd: pageChunks[methodsEnd - 1]?.charEnd || 0,
      confidence: 0.5
    },
    {
      name: 'Discussion',
      type: 'discussion',
      pageStart: methodsEnd + 1,
      pageEnd: totalPages,
      charStart: pageChunks[methodsEnd]?.charStart || 0,
      charEnd: fullText.length,
      confidence: 0.5
    }
  ];
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get text from specific section type
 */
export function getTextForSection(
  sections: DetectedSection[],
  sectionType: SectionType,
  pageChunks: PageChunk[]
): string {
  const section = sections.find(s => s.type === sectionType);
  if (!section) return '';
  
  const fullText = pageChunks.map(c => c.text).join('\n\n');
  return fullText.substring(section.charStart, section.charEnd);
}

/**
 * Get multiple sections as combined text
 */
export function getTextForSections(
  sections: DetectedSection[],
  sectionTypes: SectionType[],
  pageChunks: PageChunk[]
): string {
  const fullText = pageChunks.map(c => c.text).join('\n\n');
  
  return sections
    .filter(s => sectionTypes.includes(s.type))
    .map(s => fullText.substring(s.charStart, s.charEnd))
    .join('\n\n');
}
