import { describe, it, expect } from 'vitest';
import { findExactMatches } from '../citationDetector';

describe('findExactMatches', () => {
  it('finds a multi-word exact match and returns bounding box', () => {
    const pageText = 'This is a test document.';
    // Items with positions aligned to pageText indices
    const items = [
      { text: 'This', x: 0, y: 0, width: 40, height: 10, fontName: '', fontSize: 12, charStart: 0, charEnd: 3 },
      { text: 'is', x: 41, y: 0, width: 20, height: 10, fontName: '', fontSize: 12, charStart: 5, charEnd: 6 },
      { text: 'a', x: 62, y: 0, width: 10, height: 10, fontName: '', fontSize: 12, charStart: 8, charEnd: 8 },
      { text: 'test', x: 73, y: 0, width: 40, height: 10, fontName: '', fontSize: 12, charStart: 10, charEnd: 13 },
      { text: 'document.', x: 114, y: 0, width: 80, height: 10, fontName: '', fontSize: 12, charStart: 15, charEnd: 23 },
    ];

    const matches = findExactMatches('is a test', items as any, 1, pageText);
    expect(matches.length).toBeGreaterThan(0);
    const m = matches[0];
    expect(m.page).toBe(1);
    expect(m.coordinates.width).toBeGreaterThan(0);
    expect(m.context).toContain('is a test');
  });

  it('returns empty when there is no exact match', () => {
    const pageText = 'Alpha beta gamma.';
    const items = [
      { text: 'Alpha', x: 0, y: 0, width: 40, height: 10, fontName: '', fontSize: 12, charStart: 0, charEnd: 4 },
      { text: 'beta', x: 50, y: 0, width: 35, height: 10, fontName: '', fontSize: 12, charStart: 6, charEnd: 9 },
      { text: 'gamma.', x: 92, y: 0, width: 60, height: 10, fontName: '', fontSize: 12, charStart: 11, charEnd: 16 },
    ];

    const matches = findExactMatches('not present', items as any, 1, pageText);
    expect(matches.length).toBe(0);
  });
});
