import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SourceProvenancePanel } from '@/components/SourceProvenancePanel'

const server = setupServer(...handlers)

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Citation Workflow Integration', () => {
  it('should load extractions with citations', () => {
    const queryClient = createTestQueryClient()
    const mockNavigate = vi.fn()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SourceProvenancePanel
          studyId="test-study-1"
          extractions={[
            {
              id: 'extraction-1',
              field_name: 'study_design',
              text: 'Randomized controlled trial',
              source_citations: [
                {
                  chunkIndex: 5,
                  pageNum: 2,
                  text: 'This was a randomized controlled trial.',
                  confidence: 0.95
                }
              ],
              validation_status: 'validated',
              page: 2
            }
          ]}
          onNavigateToChunk={mockNavigate}
        />
      </QueryClientProvider>
    )
    
    // Check that extraction is displayed
    expect(screen.getByText('study_design')).toBeInTheDocument()
    expect(screen.getByText('Randomized controlled trial')).toBeInTheDocument()
    
    // Check citation indicators
    expect(screen.getByText(/1 source/)).toBeInTheDocument()
  })

  it('should display multiple extractions with different citation counts', () => {
    const queryClient = createTestQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SourceProvenancePanel
          studyId="test-study-1"
          extractions={[
            {
              id: 'extraction-1',
              field_name: 'study_design',
              text: 'RCT',
              source_citations: [
                { chunkIndex: 5, pageNum: 2, text: 'Source 1', confidence: 0.95 }
              ],
              validation_status: 'validated',
              page: 2
            },
            {
              id: 'extraction-2',
              field_name: 'sample_size',
              text: '150',
              source_citations: [
                { chunkIndex: 8, pageNum: 3, text: 'Source 1', confidence: 0.90 },
                { chunkIndex: 9, pageNum: 3, text: 'Source 2', confidence: 0.85 }
              ],
              validation_status: 'validated',
              page: 3
            }
          ]}
        />
      </QueryClientProvider>
    )
    
    expect(screen.getByText(/1 source/)).toBeInTheDocument()
    expect(screen.getByText(/2 sources/)).toBeInTheDocument()
  })

  it('should handle extractions with no citations', () => {
    const queryClient = createTestQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SourceProvenancePanel
          studyId="test-study-1"
          extractions={[
            {
              id: 'extraction-1',
              field_name: 'study_design',
              text: 'RCT',
              validation_status: 'pending',
              page: 2
            }
          ]}
        />
      </QueryClientProvider>
    )
    
    expect(screen.getByText('study_design')).toBeInTheDocument()
    expect(screen.queryByText(/source/)).not.toBeInTheDocument()
  })
})
