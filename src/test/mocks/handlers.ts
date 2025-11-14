import { http, HttpResponse } from 'msw'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'

export const handlers = [
  // Mock pdf_text_chunks fetch
  http.get(`${supabaseUrl}/rest/v1/pdf_text_chunks`, ({ request }) => {
    const url = new URL(request.url)
    const studyId = url.searchParams.get('study_id')
    
    if (!studyId) {
      return HttpResponse.json([])
    }

    return HttpResponse.json([
      {
        id: '1',
        chunk_index: 0,
        text: 'First sentence from PDF document.',
        page_number: 1,
        x: 10,
        y: 100,
        width: 200,
        height: 12,
        font_name: 'Arial',
        font_size: 12,
        is_heading: false,
        is_bold: false,
        char_start: 0,
        char_end: 33
      },
      {
        id: '2',
        chunk_index: 1,
        text: 'Second sentence from PDF document.',
        page_number: 1,
        x: 10,
        y: 120,
        width: 220,
        height: 12,
        font_name: 'Arial',
        font_size: 12,
        is_heading: false,
        is_bold: false,
        char_start: 33,
        char_end: 67
      },
      {
        id: '3',
        chunk_index: 5,
        text: 'This was a randomized controlled trial.',
        page_number: 2,
        x: 10,
        y: 150,
        width: 250,
        height: 12,
        font_name: 'Arial',
        font_size: 12,
        is_heading: false,
        is_bold: false,
        char_start: 150,
        char_end: 190
      }
    ])
  }),

  // Mock extractions fetch
  http.get(`${supabaseUrl}/rest/v1/extractions`, ({ request }) => {
    const url = new URL(request.url)
    const studyId = url.searchParams.get('study_id')
    
    if (!studyId) {
      return HttpResponse.json([])
    }

    return HttpResponse.json([
      {
        id: 'extraction-1',
        study_id: studyId,
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
        confidence_score: 0.95,
        validation_status: 'validated',
        page: 2
      },
      {
        id: 'extraction-2',
        study_id: studyId,
        field_name: 'sample_size',
        text: '150 patients',
        source_citations: [
          {
            chunkIndex: 8,
            pageNum: 3,
            text: 'A total of 150 patients were enrolled.',
            confidence: 0.88
          }
        ],
        confidence_score: 0.88,
        validation_status: 'validated',
        page: 3
      }
    ])
  }),

  // Mock batch validation endpoint
  http.post(`${supabaseUrl}/functions/v1/validate-citations-batch`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      success: true,
      validated: 5,
      results: [
        {
          extraction_id: 'extraction-1',
          field_name: 'study_design',
          extracted_text: 'Randomized controlled trial',
          source_text: 'This was a randomized controlled trial conducted at multiple centers.',
          isValid: true,
          confidence: 92,
          matchType: 'semantic',
          reasoning: 'Extracted text accurately represents the source text with high semantic similarity.'
        },
        {
          extraction_id: 'extraction-2',
          field_name: 'sample_size',
          extracted_text: '150 patients',
          source_text: 'A total of 150 patients were enrolled in the study.',
          isValid: true,
          confidence: 95,
          matchType: 'exact',
          reasoning: 'Exact numerical match found in source text.'
        }
      ],
      summary: {
        total: 5,
        valid: 4,
        questionable: 1,
        invalid: 0,
        avgConfidence: 88.5
      }
    })
  }),

  // Mock studies fetch
  http.get(`${supabaseUrl}/rest/v1/studies`, ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    return HttpResponse.json([
      {
        id: id || 'test-study-1',
        name: 'Test Study',
        pdf_name: 'test-study.pdf',
        total_pages: 10,
        created_at: new Date().toISOString()
      }
    ])
  })
]
