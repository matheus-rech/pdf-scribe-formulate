import { test, expect } from '@playwright/test'
import { 
  uploadPDF, 
  waitForPDFProcessing, 
  navigateToExtractionStep,
  fillExtractionField,
  triggerAIExtraction 
} from '../helpers/test-utils'

test.describe('Data Extraction Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
    
    // Start extraction
    await page.getByRole('button', { name: /start extraction/i }).click()
  })

  test('should complete study identification extraction', async ({ page }) => {
    // Should start on Step 1: Study ID
    await expect(page.getByRole('heading', { name: /study.*identification/i })).toBeVisible()
    
    // Fill in manual fields
    await fillExtractionField(page, 'study title', 'Randomized Control Trial of Treatment')
    await fillExtractionField(page, 'authors', 'Smith J, Jones A')
    await fillExtractionField(page, 'year', '2023')
    
    // Trigger AI extraction for DOI
    await triggerAIExtraction(page, 'DOI')
    
    // Verify extraction completed
    await expect(page.getByText(/10\.\d+/)).toBeVisible() // DOI pattern
    
    // Save and continue
    await page.getByRole('button', { name: /save.*continue/i }).click()
  })

  test('should extract PICOT elements', async ({ page }) => {
    // Navigate to PICOT step
    await navigateToExtractionStep(page, 'PICOT')
    
    // Trigger AI extraction for all PICOT fields
    await page.getByRole('button', { name: /extract all/i }).click()
    
    // Wait for extraction
    await expect(page.getByText(/extracting/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/extracting/i)).not.toBeVisible({ timeout: 45000 })
    
    // Verify PICOT fields are populated
    await expect(page.getByLabel(/population/i)).not.toBeEmpty()
    await expect(page.getByLabel(/intervention/i)).not.toBeEmpty()
    await expect(page.getByLabel(/comparator/i)).not.toBeEmpty()
    await expect(page.getByLabel(/outcome/i)).not.toBeEmpty()
    
    // Verify confidence scores are shown
    await expect(page.getByText(/\d+%.*confidence/i)).toBeVisible()
  })

  test('should extract baseline characteristics', async ({ page }) => {
    await navigateToExtractionStep(page, 'Baseline')
    
    // Extract sample size
    await triggerAIExtraction(page, 'sample size')
    await expect(page.getByLabel(/sample size/i)).not.toBeEmpty()
    
    // Extract age
    await triggerAIExtraction(page, 'age')
    await expect(page.getByLabel(/age/i)).not.toBeEmpty()
    
    // Extract gender distribution
    await triggerAIExtraction(page, 'gender')
    await expect(page.getByLabel(/gender/i)).not.toBeEmpty()
    
    // Verify all extractions have citations
    const citationBadges = page.getByText(/\[\d+\]/)
    await expect(citationBadges.first()).toBeVisible()
  })

  test('should handle extraction errors gracefully', async ({ page }) => {
    await navigateToExtractionStep(page, 'Outcomes')
    
    // Trigger extraction that might fail
    await triggerAIExtraction(page, 'primary outcome')
    
    // If extraction fails, should show error
    const errorMessage = page.getByText(/unable to extract/i).or(
      page.getByText(/try again/i)
    )
    
    // Should have retry button
    if (await errorMessage.isVisible({ timeout: 30000 })) {
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
    }
  })

  test('should save extraction progress', async ({ page }) => {
    // Fill in some data
    await fillExtractionField(page, 'study title', 'Test Study')
    await fillExtractionField(page, 'year', '2024')
    
    // Click save
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/saved/i)).toBeVisible()
    
    // Navigate away and back
    await page.goto('/')
    await page.getByText(/test study/i).click()
    
    // Verify data is still there
    await expect(page.getByDisplayValue('Test Study')).toBeVisible()
    await expect(page.getByDisplayValue('2024')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to continue without filling required fields
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible()
    
    // Fields should be highlighted
    const invalidFields = page.locator('[aria-invalid="true"]')
    await expect(invalidFields.first()).toBeVisible()
  })

  test('should support multi-step navigation', async ({ page }) => {
    // Complete Step 1
    await fillExtractionField(page, 'study title', 'Test Study')
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Should move to Step 2
    await expect(page.getByRole('heading', { name: /step 2/i })).toBeVisible()
    
    // Go back to Step 1
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByDisplayValue('Test Study')).toBeVisible()
    
    // Jump to specific step from stepper
    await page.getByRole('button', { name: /step 3/i }).click()
    await expect(page.getByRole('heading', { name: /step 3/i })).toBeVisible()
  })

  test('should export extraction data', async ({ page }) => {
    // Fill in some data
    await fillExtractionField(page, 'study title', 'Export Test Study')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()
    
    // Select JSON format
    await page.getByRole('radio', { name: /json/i }).check()
    
    // Trigger download
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /download/i }).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.json$/)
    
    // Verify file content
    const content = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of content) {
      chunks.push(chunk)
    }
    const jsonContent = Buffer.concat(chunks).toString('utf8')
    const data = JSON.parse(jsonContent)
    
    expect(data).toHaveProperty('study_title', 'Export Test Study')
  })
})
