import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts'

// These tests require a local Supabase instance running
// Run with: deno test --allow-net --allow-env

const FUNCTION_URL = 'http://localhost:54321/functions/v1/validate-citations-batch'
const TEST_TOKEN = 'test-token'

Deno.test('validate-citations-batch: validates single extraction', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    },
    body: JSON.stringify({
      extractionIds: ['test-extraction-1']
    })
  })
  
  const data = await response.json()
  
  assertEquals(response.status, 200)
  assertExists(data.results)
  assertEquals(Array.isArray(data.results), true)
  
  if (data.results.length > 0) {
    const result = data.results[0]
    assertExists(result.extraction_id)
    assertExists(result.confidence)
    assertExists(result.matchType)
    assertEquals(typeof result.confidence, 'number')
  }
})

Deno.test('validate-citations-batch: validates all study extractions', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    },
    body: JSON.stringify({
      studyId: 'test-study-1'
    })
  })
  
  const data = await response.json()
  
  assertEquals(response.status, 200)
  assertExists(data.summary)
  assertExists(data.summary.total)
  assertExists(data.summary.avgConfidence)
  assertEquals(typeof data.summary.avgConfidence, 'number')
  assertEquals(typeof data.summary.total, 'number')
})

Deno.test('validate-citations-batch: handles missing parameters', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    },
    body: JSON.stringify({})
  })
  
  const data = await response.json()
  
  // Should return error or empty results
  assertEquals(response.status >= 200 && response.status < 500, true)
})

Deno.test('validate-citations-batch: returns proper response structure', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    },
    body: JSON.stringify({
      studyId: 'test-study-1'
    })
  })
  
  const data = await response.json()
  
  if (response.status === 200) {
    assertExists(data.results)
    assertExists(data.summary)
    
    // Check summary structure
    assertExists(data.summary.total)
    assertExists(data.summary.valid)
    assertExists(data.summary.questionable)
    assertExists(data.summary.invalid)
    assertExists(data.summary.avgConfidence)
    
    // Check that counts add up
    const { valid, questionable, invalid, total } = data.summary
    assertEquals(valid + questionable + invalid, total)
  }
})
