import type { ExtractionEntry } from "@/pages/Index";
import type { DetectedSection } from "./sectionDetection";

// Define which fields are expected in each section type
const SECTION_FIELD_MAPPING: Record<string, string[]> = {
  abstract: ['population', 'intervention', 'outcomes', 'timing'],
  introduction: ['population', 'intervention', 'comparator'],
  methods: [
    'population', 'intervention', 'comparator', 'outcomes', 'timing',
    'sampleSize', 'age', 'gender', 'comorbidities',
    'surgicalProcedures', 'medicalManagement',
    'controlGroup', 'treatmentGroup'
  ],
  results: [
    'mortality', 'mrsDistribution', 'volumeMeasurements', 
    'swellingIndices', 'adverseEvents'
  ],
  discussion: ['predictors'],
  references: ['citation', 'doi', 'pmid', 'journal', 'year'],
  conclusion: [],
  title: ['citation', 'journal', 'year'],
  appendix: [],
  unknown: []
};

/**
 * Calculate extraction completion percentage for a section
 */
export function calculateSectionCompletion(
  section: DetectedSection,
  extractions: ExtractionEntry[]
): number {
  const expectedFields = SECTION_FIELD_MAPPING[section.type] || [];
  
  if (expectedFields.length === 0) {
    return 0;
  }

  // Count how many expected fields have extractions from this section's page range
  const extractedFields = new Set<string>();
  
  for (const extraction of extractions) {
    if (
      extraction.page >= section.pageStart && 
      extraction.page <= section.pageEnd &&
      expectedFields.includes(extraction.fieldName)
    ) {
      extractedFields.add(extraction.fieldName);
    }
  }

  return Math.round((extractedFields.size / expectedFields.length) * 100);
}

/**
 * Get fields that should be extracted from a section
 */
export function getExpectedFieldsForSection(sectionType: string): string[] {
  return SECTION_FIELD_MAPPING[sectionType] || [];
}

/**
 * Get all field names that can be extracted
 */
export function getAllExtractableFields(): string[] {
  return [
    // Study ID
    'citation', 'doi', 'pmid', 'journal', 'year',
    // PICO-T
    'population', 'intervention', 'comparator', 'outcomes', 'timing',
    // Baseline
    'sampleSize', 'age', 'gender', 'comorbidities',
    // Imaging
    'volumeMeasurements', 'swellingIndices',
    // Interventions
    'surgicalProcedures', 'medicalManagement',
    // Study Arms
    'controlGroup', 'treatmentGroup',
    // Outcomes
    'mortality', 'mrsDistribution',
    // Complications
    'adverseEvents', 'predictors'
  ];
}

/**
 * Check if a section has any extractions
 */
export function hasExtractionsInSection(
  section: DetectedSection,
  extractions: ExtractionEntry[]
): boolean {
  return extractions.some(
    e => e.page >= section.pageStart && e.page <= section.pageEnd
  );
}
