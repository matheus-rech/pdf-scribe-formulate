import { describe, it, expect } from 'vitest';
import { getTextItemsInRange, type PageChunk } from '../pdfChunking';
import type { TextItem } from '../textExtraction';

describe('getTextItemsInRange', () => {
  it('returns items that overlap a given char range', () => {
    // Construct a page chunk-like object
    const pageChunk: PageChunk = {
      page: 1,
      charStart: 0,
      charEnd: 50,
      text: 'One two three four five',
      textItems: [
        { text: 'One', charStart: 0, charEnd: 2, x: 0, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 },
        { text: 'two', charStart: 4, charEnd: 6, x: 11, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 },
        { text: 'three', charStart: 8, charEnd: 12, x: 22, y: 0, width: 20, height: 10, fontName: '', fontSize: 10 },
        { text: 'four', charStart: 14, charEnd: 17, x: 43, y: 0, width: 16, height: 10, fontName: '', fontSize: 10 },
        { text: 'five', charStart: 19, charEnd: 22, x: 60, y: 0, width: 16, height: 10, fontName: '', fontSize: 10 },
      ]
    };

    // Range that spans part of 'two' and 'three'
    const rangeStart = 5; // inside 'two'
    const rangeEnd = 10;  // inside 'three'

    const items = getTextItemsInRange(pageChunk, rangeStart, rangeEnd);
    // Should contain 'two' and 'three'
    const texts = items.map((it: TextItem) => it.text);
    expect(texts).toContain('two');
    expect(texts).toContain('three');
    expect(texts.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array when range does not overlap any items', () => {
    const pageChunk: PageChunk = {
      page: 1,
      charStart: 0,
      charEnd: 20,
      text: 'abc def ghi',
      textItems: [
        { text: 'abc', charStart: 0, charEnd: 2, x: 0, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 },
        { text: 'def', charStart: 4, charEnd: 6, x: 11, y: 0, width: 10, height: 10, fontName: '', fontSize: 10 }
      ]
    };

    const items = getTextItemsInRange(pageChunk, 10, 12);
    expect(items.length).toBe(0);
  });
});
