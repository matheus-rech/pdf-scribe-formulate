import { describe, it, expect } from 'vitest'
import { buildCitationMap, createCitableDocument } from '@/lib/textChunkIndexing'
import type { TextChunk } from '@/lib/textChunkIndexing'

// Note: useBoundingBoxVisualization is a complex hook that manages canvas rendering internally
// and doesn't expose testable methods. We test the underlying utility functions instead.

describe('Citation Rendering Utilities', () => {
  it('should build citation map for rendering', () => {
    const chunks: TextChunk[] = [
      {
        chunkIndex: 0,
        text: 'First citation',
        pageNum: 1,
        bbox: { x: 100, y: 200, width: 300, height: 20 },
        fontName: 'Arial',
        fontSize: 12,
        isHeading: false,
        isBold: false,
        confidence: 0.95,
        charStart: 0,
        charEnd: 15
      },
      {
        chunkIndex: 5,
        text: 'Fifth citation',
        pageNum: 2,
        bbox: { x: 100, y: 300, width: 280, height: 20 },
        fontName: 'Arial',
        fontSize: 12,
        isHeading: false,
        isBold: false,
        confidence: 0.88,
        charStart: 100,
        charEnd: 115
      }
    ]
    
    const map = buildCitationMap(chunks)
    
    expect(map[0]).toBeDefined()
    expect(map[0]?.text).toBe('First citation')
    expect(map[0]?.pageNum).toBe(1)
    expect(map[5]).toBeDefined()
    expect(map[5]?.text).toBe('Fifth citation')
    expect(map[5]?.pageNum).toBe(2)
  })

  it('should create citable document with indices', () => {
    const chunks: TextChunk[] = [
      {
        chunkIndex: 0,
        text: 'First sentence.',
        pageNum: 1,
        bbox: { x: 10, y: 100, width: 200, height: 12 },
        fontName: 'Arial',
        fontSize: 12,
        isHeading: false,
        isBold: false,
        confidence: 1.0,
        charStart: 0,
        charEnd: 15
      },
      {
        chunkIndex: 1,
        text: 'Second sentence.',
        pageNum: 1,
        bbox: { x: 10, y: 120, width: 220, height: 12 },
        fontName: 'Arial',
        fontSize: 12,
        isHeading: false,
        isBold: false,
        confidence: 1.0,
        charStart: 15,
        charEnd: 31
      }
    ]
    
    const doc = createCitableDocument(chunks)
    
    expect(doc).toContain('[0] First sentence.')
    expect(doc).toContain('[1] Second sentence.')
  })

  it('should handle confidence-based styling data', () => {
    const highConfidence: TextChunk = {
      chunkIndex: 0,
      text: 'High confidence text',
      pageNum: 1,
      bbox: { x: 100, y: 100, width: 200, height: 20 },
      fontName: 'Arial',
      fontSize: 12,
      isHeading: false,
      isBold: false,
      confidence: 0.95,
      charStart: 0,
      charEnd: 20
    }
    
    const lowConfidence: TextChunk = {
      chunkIndex: 1,
      text: 'Low confidence text',
      pageNum: 1,
      bbox: { x: 100, y: 130, width: 200, height: 20 },
      fontName: 'Arial',
      fontSize: 12,
      isHeading: false,
      isBold: false,
      confidence: 0.55,
      charStart: 20,
      charEnd: 40
    }
    
    const map = buildCitationMap([highConfidence, lowConfidence])
    
    // Should preserve confidence scores for rendering decisions
    expect(map[0]?.confidence).toBe(0.95)
    expect(map[1]?.confidence).toBe(0.55)
  })
})
