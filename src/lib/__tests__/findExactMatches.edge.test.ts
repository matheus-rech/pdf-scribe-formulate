import { describe, it, expect } from 'vitest';
import { findExactMatches } from '../citationDetector';
import type { TextItem } from '../textExtraction';

describe('findExactMatches - edge cases', () => {
  it('handles multiple whitespace characters (spaces, tabs, newlines) by collapsing them', () => {
    // pageText with multiple spaces/tabs/newlines between words
    const pageText = 'Alpha\t  Beta\n\nGamma';
    // TextItems aligned to the tokenized parts (we assume normalized join with single spaces)
    const items: TextItem[] = [
      { text: 'Alpha', x: 0, y: 0, width: 40, height: 10, fontName: '', fontSize: 12, charStart: 0, charEnd: 4 },
      // After normalization, there will be a single space: position for Beta starts at 6 (approx)
      { text: 'Beta', x: 50, y: 0, width: 35, height: 10, fontName: '', fontSize: 12, charStart: 6, charEnd: 9 },
      { text: 'Gamma', x: 92, y: 0, width: 60, height: 10, fontName: '', fontSize: 12, charStart: 11, charEnd: 15 },
    ];

    const matches = findExactMatches('Beta Gamma', items, 1, pageText);
    expect(matches.length).toBeGreaterThan(0);
    const m = matches[0];
    expect(m.page).toBe(1);
    // Context preserves original whitespace from pageText, so we check for Beta and Gamma presence
    expect(m.context.toLowerCase()).toContain('beta');
    expect(m.context.toLowerCase()).toContain('gamma');
  });

  it('finds multiple non-overlapping occurrences', () => {
    // 'a a a a' with items for each 'a'
    const pageText = 'a a a a';
    const items: TextItem[] = [
      { text: 'a', x: 0, y: 0, width: 5, height: 10, fontName: '', fontSize: 12, charStart: 0, charEnd: 0 },
      { text: 'a', x: 6, y: 0, width: 5, height: 10, fontName: '', fontSize: 12, charStart: 2, charEnd: 2 },
      { text: 'a', x: 12, y: 0, width: 5, height: 10, fontName: '', fontSize: 12, charStart: 4, charEnd: 4 },
      { text: 'a', x: 18, y: 0, width: 5, height: 10, fontName: '', fontSize: 12, charStart: 6, charEnd: 6 },
    ];

    const matches = findExactMatches('a a', items, 1, pageText);
    // Expect at least two matches for "a a" (first pair and a later non-overlapping pair)
    expect(matches.length).toBeGreaterThanOrEqual(2);
    // ensure each match has coordinates
    matches.forEach(m => {
      expect(m.coordinates.width).toBeGreaterThan(0);
      expect(m.context).toContain('a a');
    });
  });
});
