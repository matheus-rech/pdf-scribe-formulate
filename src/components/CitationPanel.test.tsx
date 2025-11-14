import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CitationPanel } from './CitationPanel'

describe('CitationPanel', () => {
  const mockCitationMap: Record<number, any> = {
    0: { 
      text: 'First citation text from the document.', 
      pageNum: 1, 
      bbox: { x: 10, y: 100, width: 200, height: 12 }, 
      confidence: 0.95 
    },
    1: { 
      text: 'Second citation text with more details.', 
      pageNum: 2, 
      bbox: { x: 10, y: 150, width: 220, height: 12 }, 
      confidence: 0.88 
    },
    2: { 
      text: 'Third citation from same page.', 
      pageNum: 2, 
      bbox: { x: 10, y: 200, width: 180, height: 12 }, 
      confidence: 0.92 
    }
  }

  it('should render all citation badges', () => {
    const onClick = vi.fn()
    
    render(
      <CitationPanel
        citationIndices={[0, 1, 2]}
        citationMap={mockCitationMap}
        activeCitationIndex={null}
        onCitationClick={onClick}
      />
    )
    
    expect(screen.getByText('[0]')).toBeInTheDocument()
    expect(screen.getByText('[1]')).toBeInTheDocument()
    expect(screen.getByText('[2]')).toBeInTheDocument()
    expect(screen.getByText('Supporting Citations (3)')).toBeInTheDocument()
  })

  it('should show active citation preview', () => {
    const onClick = vi.fn()
    
    render(
      <CitationPanel
        citationIndices={[0, 1]}
        citationMap={mockCitationMap}
        activeCitationIndex={1}
        onCitationClick={onClick}
      />
    )
    
    expect(screen.getByText(/Second citation text with more details/)).toBeInTheDocument()
    expect(screen.getByText('Page 2')).toBeInTheDocument()
  })

  it('should handle empty citations gracefully', () => {
    const onClick = vi.fn()
    
    const { container } = render(
      <CitationPanel
        citationIndices={[]}
        citationMap={{}}
        activeCitationIndex={null}
        onCitationClick={onClick}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should display source quote when provided', () => {
    const onClick = vi.fn()
    
    render(
      <CitationPanel
        citationIndices={[0]}
        citationMap={mockCitationMap}
        activeCitationIndex={null}
        onCitationClick={onClick}
        sourceQuote="This is the primary source quote from the document"
        primaryPage={3}
      />
    )
    
    expect(screen.getByText('Primary Source')).toBeInTheDocument()
    expect(screen.getByText(/This is the primary source quote/)).toBeInTheDocument()
    expect(screen.getByText(/Page 3/)).toBeInTheDocument()
  })

  it('should not show primary source section when no quote provided', () => {
    const onClick = vi.fn()
    
    render(
      <CitationPanel
        citationIndices={[0, 1]}
        citationMap={mockCitationMap}
        activeCitationIndex={null}
        onCitationClick={onClick}
      />
    )
    
    expect(screen.queryByText('Primary Source')).not.toBeInTheDocument()
  })

  it('should highlight active citation badge', () => {
    const onClick = vi.fn()
    
    render(
      <CitationPanel
        citationIndices={[0, 1, 2]}
        citationMap={mockCitationMap}
        activeCitationIndex={1}
        onCitationClick={onClick}
      />
    )
    
    const badges = screen.getAllByRole('button')
    // The active badge should have different styling
    expect(badges[1]).toHaveClass('bg-primary')
  })

  it('should handle missing citation data gracefully', () => {
    const onClick = vi.fn()
    const incompleteCitationMap: Record<number, any> = {
      0: { text: 'Only text', pageNum: 1, bbox: {}, confidence: 0.9 }
    }
    
    render(
      <CitationPanel
        citationIndices={[0, 5]} // 5 doesn't exist
        citationMap={incompleteCitationMap}
        activeCitationIndex={null}
        onCitationClick={onClick}
      />
    )
    
    // Should only render the valid citation
    expect(screen.getByText('[0]')).toBeInTheDocument()
    expect(screen.queryByText('[5]')).not.toBeInTheDocument()
  })
})
