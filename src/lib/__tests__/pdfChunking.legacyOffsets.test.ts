import { describe, it, expect } from 'vitest';
import { getTextItemsInRange, type PageChunk } from '../pdfChunking';
import type { TextItem } from '../textExtraction';

describe('getTextItemsInRange (legacy offsets fallback)', () => {
  it('computes offsets for legacy textItems and selects correct item', () => {
    const pageChunk: PageChunk = {
      page: 1,
      charStart: 0,
      charEnd: 30,
      text: 'alpha beta gamma',
      textItems: [
        { text: 'alpha', x: 0, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 },
        { text: 'beta', x: 12, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 },
        { text: 'gamma', x: 24, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 },
      ]
    };

    // char range that should match 'beta' roughly (after normalization)
    const items = getTextItemsInRange(pageChunk, 7, 11);
    const texts = items.map((it: TextItem) => it.text);
    expect(texts).toContain('beta');
    // Expect at least one matching item
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
