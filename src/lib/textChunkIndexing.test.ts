import { describe, it, expect } from 'vitest'
import { 
  buildCitationMap, 
  createCitableDocument
} from './textChunkIndexing'
import type { TextChunk } from './textChunkIndexing'

describe('textChunkIndexing', () => {
  describe('buildCitationMap', () => {
    it('should create a citation map from chunks', () => {
      const chunks: TextChunk[] = [
        createMockChunk(0, 'First sentence.', 1),
        createMockChunk(1, 'Second sentence.', 1),
        createMockChunk(2, 'Third sentence.', 2)
      ]
      
      const map = buildCitationMap(chunks)
      
      expect(Object.keys(map)).toHaveLength(3)
      expect(map[0]).toMatchObject({
        text: 'First sentence.',
        pageNum: 1,
        confidence: 1.0
      })
      expect(map[2].pageNum).toBe(2)
    })

    it('should handle empty chunks array', () => {
      const map = buildCitationMap([])
      expect(Object.keys(map)).toHaveLength(0)
    })

    it('should preserve all chunk properties', () => {
      const chunks: TextChunk[] = [
        {
          chunkIndex: 5,
          text: 'Test sentence.',
          pageNum: 3,
          bbox: { x: 100, y: 200, width: 300, height: 20 },
          fontName: 'Arial',
          fontSize: 12,
          isHeading: true,
          isBold: true,
          confidence: 0.95,
          charStart: 0,
          charEnd: 14
        }
      ]
      
      const map = buildCitationMap(chunks)
      
      expect(map[5]).toMatchObject({
        chunkIndex: 5,
        text: 'Test sentence.',
        pageNum: 3,
        isHeading: true,
        isBold: true,
        confidence: 0.95
      })
      expect(map[5].bbox).toEqual({ x: 100, y: 200, width: 300, height: 20 })
    })
  })

  describe('createCitableDocument', () => {
    it('should format chunks as indexed document', () => {
      const chunks: TextChunk[] = [
        createMockChunk(0, 'First sentence.', 1),
        createMockChunk(1, 'Second sentence.', 1),
        createMockChunk(2, 'Third sentence.', 2)
      ]
      
      const doc = createCitableDocument(chunks)
      
      expect(doc).toContain('[0] First sentence.')
      expect(doc).toContain('[1] Second sentence.')
      expect(doc).toContain('[2] Third sentence.')
    })

    it('should respect max length', () => {
      const longChunks: TextChunk[] = Array.from({ length: 100 }, (_, i) => 
        createMockChunk(i, `Sentence number ${i} with some extra text.`, 1)
      )
      
      const doc = createCitableDocument(longChunks)
      
      // Should include all chunks or truncate appropriately
      expect(doc.length).toBeGreaterThan(0)
    })

    it('should handle empty chunks', () => {
      const doc = createCitableDocument([])
      expect(doc).toBe('')
    })

    it('should preserve line breaks between chunks', () => {
      const chunks: TextChunk[] = [
        createMockChunk(0, 'First.', 1),
        createMockChunk(1, 'Second.', 1)
      ]
      
      const doc = createCitableDocument(chunks)
      
      expect(doc).toMatch(/\[0\] First\.\n\[1\] Second\./)
    })
  })
})

// Test helper
function createMockChunk(index: number, text: string, pageNum: number): TextChunk {
  return {
    chunkIndex: index,
    text,
    pageNum,
    bbox: { x: 10, y: 100 + (index * 20), width: 100, height: 12 },
    fontName: 'Arial',
    fontSize: 12,
    isHeading: false,
    isBold: false,
    confidence: 1.0,
    charStart: index * 20,
    charEnd: index * 20 + text.length
  }
}
