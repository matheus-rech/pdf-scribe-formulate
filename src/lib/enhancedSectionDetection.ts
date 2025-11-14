/**
 * Enhanced Section Detection
 * 
 * Provides flexible section detection for clinical research papers with support for:
 * - Numbered sections (1.0, 1.1, 1.2, etc.)
 * - Alternative section names (Study Design vs Methods, Findings vs Results)
 * - Subsections and nested headers
 * - Case reports, systematic reviews, and meta-analyses
 */

export interface Section {
  /** Section name (normalized) */
  name: string;
  
  /** Original header text as it appears in document */
  originalHeader: string;
  
  /** Start position in text */
  startIndex: number;
  
  /** End position in text */
  endIndex: number;
  
  /** Section level (1 = main section, 2 = subsection, etc.) */
  level: number;
  
  /** Section number if numbered (e.g., "1.2.3") */
  sectionNumber?: string;
  
  /** Parent section name if this is a subsection */
  parentSection?: string;
}

export interface SectionPattern {
  /** Regex pattern to match section header */
  pattern: RegExp;
  
  /** Normalized section name */
  normalizedName: string;
  
  /** Alternative names for this section */
  aliases: string[];
  
  /** Section level */
  level: number;
}

/**
 * Comprehensive section patterns for clinical research papers
 */
export const CLINICAL_PAPER_SECTIONS: SectionPattern[] = [
  // Abstract
  {
    pattern: /^(?:\d+\.?\s*)?Abstract\s*$/im,
    normalizedName: 'Abstract',
    aliases: ['Summary', 'Synopsis'],
    level: 1,
  },
  
  // Introduction
  {
    pattern: /^(?:\d+\.?\s*)?(Introduction|Background)\s*$/im,
    normalizedName: 'Introduction',
    aliases: ['Background', 'Rationale'],
    level: 1,
  },
  
  // Methods (with many variations)
  {
    pattern: /^(?:\d+\.?\s*)?(Methods?|Materials?\s+and\s+Methods?|Study\s+Design|Methodology|Experimental\s+Design)\s*$/im,
    normalizedName: 'Methods',
    aliases: ['Materials and Methods', 'Study Design', 'Methodology', 'Experimental Design', 'Experimental Procedures'],
    level: 1,
  },
  
  // Results (with variations)
  {
    pattern: /^(?:\d+\.?\s*)?(Results?|Findings?|Observations?)\s*$/im,
    normalizedName: 'Results',
    aliases: ['Findings', 'Observations', 'Data'],
    level: 1,
  },
  
  // Discussion
  {
    pattern: /^(?:\d+\.?\s*)?(Discussion|Clinical\s+Implications?|Interpretation)\s*$/im,
    normalizedName: 'Discussion',
    aliases: ['Clinical Implications', 'Interpretation', 'Analysis'],
    level: 1,
  },
  
  // Conclusion
  {
    pattern: /^(?:\d+\.?\s*)?(Conclusions?|Summary|Final\s+Remarks?)\s*$/im,
    normalizedName: 'Conclusion',
    aliases: ['Summary', 'Final Remarks', 'Concluding Remarks'],
    level: 1,
  },
  
  // References
  {
    pattern: /^(?:\d+\.?\s*)?References?\s*$/im,
    normalizedName: 'References',
    aliases: ['Bibliography', 'Citations', 'Literature Cited'],
    level: 1,
  },
  
  // Common subsections
  {
    pattern: /^(?:\d+\.?\d*\.?\s*)?(Patient\s+Selection|Study\s+Population|Participants?)\s*$/im,
    normalizedName: 'Patient Selection',
    aliases: ['Study Population', 'Participants', 'Subjects', 'Cohort'],
    level: 2,
  },
  
  {
    pattern: /^(?:\d+\.?\d*\.?\s*)?(Statistical\s+Analysis|Data\s+Analysis|Statistics?)\s*$/im,
    normalizedName: 'Statistical Analysis',
    aliases: ['Data Analysis', 'Statistics', 'Statistical Methods'],
    level: 2,
  },
  
  {
    pattern: /^(?:\d+\.?\d*\.?\s*)?(Intervention|Treatment|Procedure)\s*$/im,
    normalizedName: 'Intervention',
    aliases: ['Treatment', 'Procedure', 'Protocol'],
    level: 2,
  },
  
  {
    pattern: /^(?:\d+\.?\d*\.?\s*)?(Outcome\s+Measures?|Endpoints?|Primary\s+Outcome)\s*$/im,
    normalizedName: 'Outcome Measures',
    aliases: ['Endpoints', 'Primary Outcome', 'Secondary Outcomes'],
    level: 2,
  },
];

/**
 * Additional patterns for specific paper types
 */
export const CASE_REPORT_SECTIONS: SectionPattern[] = [
  {
    pattern: /^(?:\d+\.?\s*)?Case\s+Presentation\s*$/im,
    normalizedName: 'Case Presentation',
    aliases: ['Case Description', 'Clinical Presentation'],
    level: 1,
  },
  {
    pattern: /^(?:\d+\.?\s*)?Patient\s+History\s*$/im,
    normalizedName: 'Patient History',
    aliases: ['Medical History', 'Clinical History'],
    level: 2,
  },
];

export const SYSTEMATIC_REVIEW_SECTIONS: SectionPattern[] = [
  {
    pattern: /^(?:\d+\.?\s*)?Search\s+Strategy\s*$/im,
    normalizedName: 'Search Strategy',
    aliases: ['Literature Search', 'Search Methods'],
    level: 2,
  },
  {
    pattern: /^(?:\d+\.?\s*)?(Inclusion|Exclusion)\s+Criteria\s*$/im,
    normalizedName: 'Selection Criteria',
    aliases: ['Inclusion Criteria', 'Exclusion Criteria', 'Eligibility Criteria'],
    level: 2,
  },
  {
    pattern: /^(?:\d+\.?\s*)?Data\s+Extraction\s*$/im,
    normalizedName: 'Data Extraction',
    aliases: ['Data Collection', 'Information Extraction'],
    level: 2,
  },
  {
    pattern: /^(?:\d+\.?\s*)?Quality\s+Assessment\s*$/im,
    normalizedName: 'Quality Assessment',
    aliases: ['Risk of Bias', 'Study Quality', 'Methodological Quality'],
    level: 2,
  },
];

/**
 * Detects sections in text using enhanced pattern matching
 */
export function detectSections(
  text: string,
  additionalPatterns: SectionPattern[] = []
): Section[] {
  const allPatterns = [
    ...CLINICAL_PAPER_SECTIONS,
    ...additionalPatterns,
  ];
  
  const sections: Section[] = [];
  const lines = text.split('\n');
  let currentIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = currentIndex;
    const lineEnd = currentIndex + line.length;
    
    // Check each pattern
    for (const pattern of allPatterns) {
      const match = line.match(pattern.pattern);
      
      if (match) {
        // Extract section number if present
        const numberMatch = line.match(/^(\d+(?:\.\d+)*)\s+/);
        const sectionNumber = numberMatch ? numberMatch[1] : undefined;
        
        sections.push({
          name: pattern.normalizedName,
          originalHeader: line.trim(),
          startIndex: lineStart,
          endIndex: lineEnd,
          level: pattern.level,
          sectionNumber,
        });
        
        break; // Only match one pattern per line
      }
    }
    
    currentIndex = lineEnd + 1; // +1 for newline
  }
  
  // Set end indices based on next section start
  for (let i = 0; i < sections.length - 1; i++) {
    sections[i].endIndex = sections[i + 1].startIndex;
  }
  
  // Last section extends to end of text
  if (sections.length > 0) {
    sections[sections.length - 1].endIndex = text.length;
  }
  
  // Set parent sections for subsections
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].level > 1) {
      // Find the most recent parent section (level 1)
      for (let j = i - 1; j >= 0; j--) {
        if (sections[j].level === 1) {
          sections[i].parentSection = sections[j].name;
          break;
        }
      }
    }
  }
  
  console.log(`📑 Detected ${sections.length} sections in document`);
  console.log(`📊 Sections: ${sections.map(s => s.name).join(', ')}`);
  
  return sections;
}

/**
 * Gets text content for a specific section
 */
export function getSectionContent(
  text: string,
  sections: Section[],
  sectionName: string
): string | null {
  const section = sections.find(s => s.name === sectionName);
  if (!section) return null;
  
  return text.slice(section.startIndex, section.endIndex);
}

/**
 * Gets all subsections of a parent section
 */
export function getSubsections(
  sections: Section[],
  parentSectionName: string
): Section[] {
  return sections.filter(s => s.parentSection === parentSectionName);
}

/**
 * Detects paper type based on sections found
 */
export function detectPaperType(sections: Section[]): 'research' | 'case_report' | 'systematic_review' | 'meta_analysis' | 'unknown' {
  const sectionNames = sections.map(s => s.name);
  
  // Case report indicators
  if (sectionNames.includes('Case Presentation') || sectionNames.includes('Patient History')) {
    return 'case_report';
  }
  
  // Systematic review indicators
  if (sectionNames.includes('Search Strategy') || sectionNames.includes('Selection Criteria')) {
    return 'systematic_review';
  }
  
  // Meta-analysis indicators (similar to systematic review but with specific analysis sections)
  if (sectionNames.includes('Quality Assessment') && sectionNames.includes('Data Extraction')) {
    return 'meta_analysis';
  }
  
  // Research paper (standard IMRAD structure)
  if (sectionNames.includes('Methods') && sectionNames.includes('Results')) {
    return 'research';
  }
  
  return 'unknown';
}

/**
 * Gets section hierarchy as a tree structure
 */
export function getSectionHierarchy(sections: Section[]): {
  section: Section;
  subsections: Section[];
}[] {
  const hierarchy: { section: Section; subsections: Section[] }[] = [];
  
  const mainSections = sections.filter(s => s.level === 1);
  
  for (const mainSection of mainSections) {
    const subsections = sections.filter(
      s => s.level === 2 && s.parentSection === mainSection.name
    );
    
    hierarchy.push({
      section: mainSection,
      subsections,
    });
  }
  
  return hierarchy;
}

/**
 * Validates section order (checks if sections follow logical order)
 */
export function validateSectionOrder(sections: Section[]): {
  isValid: boolean;
  issues: string[];
} {
  const expectedOrder = [
    'Abstract',
    'Introduction',
    'Methods',
    'Results',
    'Discussion',
    'Conclusion',
    'References',
  ];
  
  const issues: string[] = [];
  const mainSections = sections.filter(s => s.level === 1);
  
  let lastExpectedIndex = -1;
  
  for (const section of mainSections) {
    const expectedIndex = expectedOrder.indexOf(section.name);
    
    if (expectedIndex !== -1) {
      if (expectedIndex < lastExpectedIndex) {
        issues.push(`Section "${section.name}" appears out of order`);
      }
      lastExpectedIndex = expectedIndex;
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Gets statistics about detected sections
 */
export function getSectionStats(sections: Section[]): {
  totalSections: number;
  mainSections: number;
  subsections: number;
  paperType: string;
  hasNumberedSections: boolean;
} {
  const mainSections = sections.filter(s => s.level === 1).length;
  const subsections = sections.filter(s => s.level > 1).length;
  const hasNumberedSections = sections.some(s => s.sectionNumber !== undefined);
  const paperType = detectPaperType(sections);
  
  return {
    totalSections: sections.length,
    mainSections,
    subsections,
    paperType,
    hasNumberedSections,
  };
}
