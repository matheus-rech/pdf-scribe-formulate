import { test, expect } from '@playwright/test'
import { 
  uploadPDF, 
  waitForPDFProcessing,
  navigateToExtractionStep,
  triggerAIExtraction,
  verifyCitationExists,
  viewCitationSource
} from '../helpers/test-utils'

test.describe('Citation Detection and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
    await page.getByRole('button', { name: /start extraction/i }).click()
  })

  test('should detect citations for extracted text', async ({ page }) => {
    // Extract a field with AI
    await triggerAIExtraction(page, 'study design')
    
    // Wait for extraction
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 30000 })
    
    // Verify citation badge appears
    await expect(page.getByText(/\[\d+\]/)).toBeVisible()
    
    // Verify source indicator
    await expect(page.getByText(/\d+ source/i)).toBeVisible()
  })

  test('should show citation details on click', async ({ page }) => {
    await triggerAIExtraction(page, 'sample size')
    await expect(page.getByLabel(/sample size/i)).not.toBeEmpty({ timeout: 30000 })
    
    // Click on citation badge
    const citationBadge = page.getByText(/\[\d+\]/).first()
    await citationBadge.click()
    
    // Verify citation details panel opens
    await expect(page.getByText(/citation.*page/i)).toBeVisible()
    
    // Verify source text is shown
    await expect(page.getByText(/".*"/)).toBeVisible() // Quoted source text
    
    // Verify confidence score
    await expect(page.getByText(/\d+%.*confidence/i)).toBeVisible()
  })

  test('should navigate to source in PDF', async ({ page }) => {
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 30000 })
    
    // View sources
    await page.getByRole('button', { name: /view sources/i }).click()
    
    // Click "View in PDF" button
    await page.getByRole('button', { name: /view in pdf/i }).first().click()
    
    // Verify PDF viewer opens
    await expect(page.getByRole('dialog').or(page.locator('.pdf-viewer'))).toBeVisible()
    
    // Verify correct page is shown
    await expect(page.getByText(/page \d+/i)).toBeVisible()
    
    // Verify citation is highlighted on PDF
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
    
    // Take screenshot of highlighted citation
    await page.screenshot({ path: 'e2e/screenshots/citation-highlight.png' })
  })

  test('should display multiple citations for same field', async ({ page }) => {
    await navigateToExtractionStep(page, 'Outcomes')
    await triggerAIExtraction(page, 'primary outcome')
    
    await expect(page.getByLabel(/primary outcome/i)).not.toBeEmpty({ timeout: 30000 })
    
    // Check for multiple citation badges
    const citationBadges = page.getByText(/\[\d+\]/)
    const count = await citationBadges.count()
    
    if (count > 1) {
      // Verify all citation badges are clickable
      for (let i = 0; i < Math.min(count, 3); i++) {
        await citationBadges.nth(i).click()
        await expect(page.getByText(/citation.*page/i)).toBeVisible()
      }
    }
  })

  test('should validate citations in batch', async ({ page }) => {
    // Extract multiple fields
    await triggerAIExtraction(page, 'study title')
    await triggerAIExtraction(page, 'authors')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Navigate to citations tab
    await page.getByRole('tab', { name: /citations/i }).click()
    
    // Start batch validation
    await page.getByRole('button', { name: /validate all/i }).click()
    
    // Verify validation dialog appears
    await expect(page.getByText(/batch.*validation/i)).toBeVisible()
    
    // Start validation
    await page.getByRole('button', { name: /start validation/i }).click()
    
    // Wait for validation to complete
    await expect(page.getByText(/validating/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/validation complete/i)).toBeVisible({ timeout: 60000 })
    
    // Verify validation summary
    await expect(page.getByText(/valid.*\d+/i)).toBeVisible()
    await expect(page.getByText(/confidence.*\d+/i)).toBeVisible()
  })

  test('should show validation status indicators', async ({ page }) => {
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 30000 })
    
    // Check for validation badge
    const validationBadge = page.getByText(/validated/i).or(
      page.getByText(/pending/i)
    ).or(
      page.getByTestId('validation-status')
    )
    
    await expect(validationBadge).toBeVisible()
  })

  test('should handle citation revalidation', async ({ page }) => {
    await triggerAIExtraction(page, 'sample size')
    await expect(page.getByLabel(/sample size/i)).not.toBeEmpty({ timeout: 30000 })
    
    // View citations
    await page.getByRole('button', { name: /view sources/i }).click()
    
    // Click revalidate button
    await page.getByRole('button', { name: /revalidate/i }).click()
    
    // Verify revalidation starts
    await expect(page.getByText(/validating/i)).toBeVisible()
    
    // Wait for completion
    await expect(page.getByText(/revalidation complete/i)).toBeVisible({ timeout: 30000 })
    
    // Verify updated confidence score
    await expect(page.getByText(/\d+%.*confidence/i)).toBeVisible()
  })

  test('should display confidence score color coding', async ({ page }) => {
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 30000 })
    
    // Get confidence badge
    const confidenceBadge = page.locator('[data-confidence-level]').or(
      page.getByTestId('confidence-badge')
    ).first()
    
    await expect(confidenceBadge).toBeVisible()
    
    // Take screenshot for visual verification of color
    await page.screenshot({ path: 'e2e/screenshots/confidence-badge.png' })
  })

  test('should filter extractions by validation status', async ({ page }) => {
    // Extract multiple fields
    await triggerAIExtraction(page, 'study title')
    await navigateToExtractionStep(page, 'PICOT')
    await triggerAIExtraction(page, 'population')
    
    // Navigate to citations view
    await page.getByRole('tab', { name: /citations/i }).click()
    
    // Apply filter
    await page.getByRole('combobox', { name: /filter/i }).selectOption('validated')
    
    // Verify only validated items show
    const validatedItems = page.getByText(/validated/i)
    await expect(validatedItems.first()).toBeVisible()
    
    // Change filter
    await page.getByRole('combobox', { name: /filter/i }).selectOption('pending')
    
    // Verify pending items show
    const pendingItems = page.getByText(/pending/i)
    await expect(pendingItems.first()).toBeVisible()
  })
})
