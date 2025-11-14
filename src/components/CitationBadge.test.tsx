import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CitationBadge } from './CitationBadge'

describe('CitationBadge', () => {
  it('should render citation index', () => {
    const onClick = vi.fn()
    
    render(
      <CitationBadge
        citationIndex={5}
        isActive={false}
        onClick={onClick}
      />
    )
    
    expect(screen.getByText('[5]')).toBeInTheDocument()
  })

  it('should show active state with pin icon', () => {
    const onClick = vi.fn()
    
    render(
      <CitationBadge
        citationIndex={3}
        isActive={true}
        onClick={onClick}
      />
    )
    
    expect(screen.getByText('📍')).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toHaveClass('animate-pulse')
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    
    render(
      <CitationBadge
        citationIndex={7}
        isActive={false}
        onClick={onClick}
      />
    )
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(onClick).toHaveBeenCalledWith(7)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should show tooltip with sentence preview on hover', async () => {
    const onClick = vi.fn()
    
    render(
      <CitationBadge
        citationIndex={2}
        pageNumber={5}
        sentencePreview="This is a test sentence from the PDF document that should appear in the tooltip."
        isActive={false}
        onClick={onClick}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)
    
    // Tooltip content should be in the document
    expect(screen.getByText('Page 5')).toBeInTheDocument()
    expect(screen.getByText(/This is a test sentence/)).toBeInTheDocument()
  })

  it('should truncate long sentence previews', () => {
    const onClick = vi.fn()
    const longText = 'A'.repeat(200)
    
    render(
      <CitationBadge
        citationIndex={1}
        sentencePreview={longText}
        isActive={false}
        onClick={onClick}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)
    
    // Should show truncated text with ellipsis
    const tooltipText = screen.getByText(/A+\.\.\./)
    expect(tooltipText.textContent?.length).toBeLessThan(200)
  })

  it('should apply correct styling for inactive state', () => {
    const onClick = vi.fn()
    
    render(
      <CitationBadge
        citationIndex={1}
        isActive={false}
        onClick={onClick}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary/50')
    expect(button).not.toHaveClass('animate-pulse')
  })
})
