import { test, expect } from '@playwright/test'
import { uploadPDF, waitForPDFProcessing } from '../helpers/test-utils'

test.describe('PDF Upload and Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should upload PDF successfully', async ({ page }) => {
    // Upload a test PDF
    await uploadPDF(page, 'sample-study.pdf')
    
    // Verify success message
    await expect(page.getByText(/uploaded successfully/i)).toBeVisible()
    
    // Verify PDF appears in studies list
    await expect(page.getByText(/sample-study/i)).toBeVisible()
  })

  test('should process PDF and extract metadata', async ({ page }) => {
    await uploadPDF(page, 'sample-study.pdf')
    
    // Wait for processing
    await waitForPDFProcessing(page)
    
    // Verify page count is detected
    await expect(page.getByText(/\d+ pages?/i)).toBeVisible()
    
    // Verify figures are detected
    await expect(page.getByText(/\d+ figures?/i)).toBeVisible()
    
    // Verify tables are detected
    await expect(page.getByText(/\d+ tables?/i)).toBeVisible()
  })

  test('should reject invalid file types', async ({ page }) => {
    // Try to upload a non-PDF file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not a PDF')
    })
    
    // Verify error message
    await expect(page.getByText(/invalid.*file.*type/i)).toBeVisible()
  })

  test('should handle large PDF files', async ({ page }) => {
    test.slow() // Mark as slow test
    
    await uploadPDF(page, 'large-study.pdf')
    
    // Should show progress indicator
    await expect(page.getByRole('progressbar')).toBeVisible()
    
    // Wait for completion (longer timeout)
    await waitForPDFProcessing(page, 120000)
    
    await expect(page.getByText(/processing complete/i)).toBeVisible()
  })

  test('should extract text chunks with coordinates', async ({ page }) => {
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
    
    // Navigate to PDF viewer
    await page.getByRole('button', { name: /view.*pdf/i }).click()
    
    // Enable text chunk visualization
    await page.getByRole('button', { name: /chunks/i }).click()
    
    // Verify chunks are highlighted on canvas
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'e2e/screenshots/text-chunks.png' })
  })

  test('should detect and extract figures', async ({ page }) => {
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
    
    // Navigate to figures tab
    await page.getByRole('tab', { name: /figures/i }).click()
    
    // Verify figure cards are displayed
    const figureCards = page.getByTestId('figure-card')
    await expect(figureCards.first()).toBeVisible()
    
    // Verify figure has image preview
    const figureImage = figureCards.first().locator('img')
    await expect(figureImage).toBeVisible()
    
    // Verify figure has caption
    await expect(page.getByText(/figure \d+/i)).toBeVisible()
  })

  test('should detect and extract tables', async ({ page }) => {
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
    
    // Navigate to tables tab
    await page.getByRole('tab', { name: /tables/i }).click()
    
    // Verify table cards are displayed
    const tableCards = page.getByTestId('table-card')
    await expect(tableCards.first()).toBeVisible()
    
    // Click to view table details
    await tableCards.first().click()
    
    // Verify table data is displayed
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader')).toHaveCount({ min: 1 })
  })

  test('should allow PDF navigation', async ({ page }) => {
    await uploadPDF(page, 'sample-study.pdf')
    await waitForPDFProcessing(page)
    
    // Open PDF viewer
    await page.getByRole('button', { name: /view.*pdf/i }).click()
    
    // Navigate to next page
    await page.getByRole('button', { name: /next.*page/i }).click()
    await expect(page.getByText(/page 2/i)).toBeVisible()
    
    // Navigate to previous page
    await page.getByRole('button', { name: /prev.*page/i }).click()
    await expect(page.getByText(/page 1/i)).toBeVisible()
    
    // Jump to specific page
    const pageInput = page.getByLabel(/go to page/i)
    await pageInput.fill('5')
    await pageInput.press('Enter')
    await expect(page.getByText(/page 5/i)).toBeVisible()
  })
})
