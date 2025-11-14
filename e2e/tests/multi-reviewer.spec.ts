import { test, expect } from '@playwright/test'
import { 
  uploadPDF, 
  waitForPDFProcessing,
  navigateToExtractionStep,
  triggerAIExtraction
} from '../helpers/test-utils'

test.describe('Multi-Reviewer Consensus Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
  })

  test('should configure multiple AI reviewers', async ({ page }) => {
    // Open reviewer settings
    await page.getByRole('button', { name: /settings/i }).click()
    await page.getByRole('tab', { name: /reviewers/i }).click()
    
    // Verify default reviewers are listed
    await expect(page.getByText(/conservative validator/i)).toBeVisible()
    await expect(page.getByText(/balanced extractor/i)).toBeVisible()
    
    // Check reviewer count setting
    const reviewerCount = page.getByLabel(/number of reviewers/i)
    await expect(reviewerCount).toBeVisible()
    await expect(reviewerCount).toHaveValue(/[3-8]/)
  })

  test('should perform multi-reviewer extraction', async ({ page }) => {
    // Start extraction with multiple reviewers
    await page.getByRole('button', { name: /start extraction/i }).click()
    
    // Trigger AI extraction
    await triggerAIExtraction(page, 'study design')
    
    // Wait for all reviewers to complete
    await expect(page.getByText(/extracting/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/extracting/i)).not.toBeVisible({ timeout: 60000 })
    
    // Navigate to consensus view
    await page.getByRole('tab', { name: /consensus/i }).click()
    
    // Verify multiple reviews are shown
    await expect(page.getByText(/review \d+ of \d+/i)).toBeVisible()
    
    // Verify agreement level
    await expect(page.getByText(/agreement.*\d+%/i)).toBeVisible()
  })

  test('should display consensus dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /start extraction/i }).click()
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 60000 })
    
    // Open consensus dashboard
    await page.getByRole('button', { name: /view consensus/i }).click()
    
    // Verify dashboard elements
    await expect(page.getByText(/consensus report/i)).toBeVisible()
    await expect(page.getByText(/agreement level/i)).toBeVisible()
    await expect(page.getByText(/conflicting values/i)).toBeVisible()
    
    // Verify chart/visualization
    const chart = page.locator('canvas, svg[class*="chart"]')
    await expect(chart.first()).toBeVisible()
  })

  test('should identify and resolve conflicts', async ({ page }) => {
    await page.getByRole('button', { name: /start extraction/i }).click()
    await triggerAIExtraction(page, 'sample size')
    await expect(page.getByLabel(/sample size/i)).not.toBeEmpty({ timeout: 60000 })
    
    // Navigate to conflicts view
    await page.getByRole('tab', { name: /conflicts/i }).click()
    
    // If conflicts exist, verify conflict card
    const conflictCard = page.getByTestId('conflict-card').first()
    if (await conflictCard.isVisible({ timeout: 5000 })) {
      // View conflict details
      await conflictCard.click()
      
      // Verify different reviewer values are shown
      await expect(page.getByText(/reviewer \d+/i)).toBeVisible()
      
      // Resolve conflict by selecting a value
      await page.getByRole('button', { name: /accept/i }).first().click()
      
      // Verify resolution recorded
      await expect(page.getByText(/resolved/i)).toBeVisible()
    }
  })

  test('should show reviewer-specific confidence scores', async ({ page }) => {
    await page.getByRole('button', { name: /start extraction/i }).click()
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 60000 })
    
    // View reviews
    await page.getByRole('button', { name: /view.*reviews/i }).click()
    
    // Verify confidence scores for each reviewer
    const confidenceScores = page.getByText(/\d+%.*confidence/i)
    const count = await confidenceScores.count()
    
    expect(count).toBeGreaterThan(1) // Multiple reviewers
  })

  test('should calculate consensus automatically', async ({ page }) => {
    await page.getByRole('button', { name: /start extraction/i }).click()
    
    // Extract multiple fields
    await triggerAIExtraction(page, 'study design')
    await navigateToExtractionStep(page, 'PICOT')
    await triggerAIExtraction(page, 'population')
    
    // View consensus summary
    await page.getByRole('tab', { name: /consensus/i }).click()
    
    // Verify consensus indicators
    await expect(page.getByText(/high concordance/i).or(
      page.getByText(/low concordance/i)
    )).toBeVisible()
    
    // Verify consensus value is displayed
    await expect(page.getByText(/consensus.*value/i)).toBeVisible()
  })

  test('should require human review for low concordance', async ({ page }) => {
    await page.getByRole('button', { name: /start extraction/i }).click()
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 60000 })
    
    // Check for human review flag
    const reviewFlag = page.getByText(/human review required/i).or(
      page.getByTestId('review-required-badge')
    )
    
    // If low concordance, should see flag
    if (await reviewFlag.isVisible({ timeout: 5000 })) {
      // Click to review
      await page.getByRole('button', { name: /review/i }).click()
      
      // Verify review interface opens
      await expect(page.getByText(/resolve.*discrepancy/i)).toBeVisible()
    }
  })

  test('should export consensus report', async ({ page }) => {
    await page.getByRole('button', { name: /start extraction/i }).click()
    await triggerAIExtraction(page, 'study design')
    await expect(page.getByLabel(/study design/i)).not.toBeEmpty({ timeout: 60000 })
    
    // Open consensus view
    await page.getByRole('tab', { name: /consensus/i }).click()
    
    // Export report
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export.*report/i }).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/consensus.*\.(pdf|csv|json)/)
  })
})
