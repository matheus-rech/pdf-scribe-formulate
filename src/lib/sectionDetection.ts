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
  
  const sectionPatterns = [
    {
      type: 'abstract' as SectionType,
      patterns: [
        /\n\s*abstract\s*\n/i,
        /\n\s*summary\s*\n/i,
      ],
      priority: 1
    },
    {
      type: 'introduction' as SectionType,
      patterns: [
        /\n\s*(?:1\.?\s*)?introduction\s*\n/i,
        /\n\s*(?:1\.?\s*)?background\s*\n/i,
      ],
      priority: 2
    },
    {
      type: 'methods' as SectionType,
      patterns: [
        /\n\s*(?:\d+\.?\s*)?methods?\s*\n/i,
        /\n\s*(?:\d+\.?\s*)?methodology\s*\n/i,
        /\n\s*(?:\d+\.?\s*)?materials? and methods?\s*\n/i,
        /\n\s*(?:\d+\.?\s*)?study design\s*\n/i,
      ],
      priority: 3
    },
    {
      type: 'results' as SectionType,
      patterns: [
        /\n\s*(?:\d+\.?\s*)?results?\s*\n/i,
        /\n\s*(?:\d+\.?\s*)?findings?\s*\n/i,
      ],
      priority: 4
    },
    {
      type: 'discussion' as SectionType,
      patterns: [
        /\n\s*(?:\d+\.?\s*)?discussion\s*\n/i,
        /\n\s*(?:\d+\.?\s*)?interpretation\s*\n/i,
      ],
      priority: 5
    },
    {
      type: 'conclusion' as SectionType,
      patterns: [
        /\n\s*(?:\d+\.?\s*)?conclusions?\s*\n/i,
        /\n\s*(?:\d+\.?\s*)?concluding remarks?\s*\n/i,
      ],
      priority: 6
    },
    {
      type: 'references' as SectionType,
      patterns: [
        /\n\s*references?\s*\n/i,
        /\n\s*bibliography\s*\n/i,
        /\n\s*works? cited\s*\n/i,
      ],
      priority: 7
    },
  ];
  
  const matches: Array<{
    type: SectionType;
    index: number;
    headingText: string;
    priority: number;
  }> = [];
  
  for (const sectionDef of sectionPatterns) {
    for (const pattern of sectionDef.patterns) {
      const match = pattern.exec(fullText);
      if (match) {
        matches.push({
          type: sectionDef.type,
          index: match.index,
          headingText: match[0].trim(),
          priority: sectionDef.priority
        });
      }
    }
  }
  
  matches.sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const charStart = match.index;
    const charEnd = nextMatch ? nextMatch.index : fullText.length;
    
    sections.push({
      name: capitalizeFirstLetter(match.type),
      type: match.type,
      pageStart: getPageForCharPosition(charStart, pageChunks),
      pageEnd: getPageForCharPosition(charEnd, pageChunks),
      charStart,
      charEnd,
      confidence: 0.9,
      headingText: match.headingText
    });
  }
  
  if (sections.length === 0) {
    sections.push(...createDefaultSections(pageChunks));
  }
  
  return sections;
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
