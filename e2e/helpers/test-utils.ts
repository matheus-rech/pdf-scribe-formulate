import { Page, expect } from '@playwright/test'
import path from 'path'

/**
 * Upload a PDF file to the application
 */
export async function uploadPDF(page: Page, filename: string) {
  const filePath = path.join(__dirname, '..', 'fixtures', filename)
  
  // Find and click the upload button/area
  const uploadButton = page.getByRole('button', { name: /upload/i }).or(
    page.getByText(/drag.*drop/i)
  )
  await uploadButton.first().click()
  
  // Upload the file
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(filePath)
  
  // Wait for upload to complete
  await expect(page.getByText(/processing/i).or(page.getByText(/uploaded/i))).toBeVisible({
    timeout: 30000
  })
}

/**
 * Wait for PDF processing to complete
 */
export async function waitForPDFProcessing(page: Page, timeout = 60000) {
  await expect(page.getByText(/processing complete/i).or(
    page.getByRole('button', { name: /start extraction/i })
  )).toBeVisible({ timeout })
}

/**
 * Navigate through extraction steps
 */
export async function navigateToExtractionStep(page: Page, stepName: string) {
  const stepButton = page.getByRole('button', { name: new RegExp(stepName, 'i') })
  await stepButton.click()
  await page.waitForLoadState('networkidle')
}

/**
 * Fill in an extraction field
 */
export async function fillExtractionField(
  page: Page, 
  fieldName: string, 
  value: string
) {
  const field = page.getByLabel(new RegExp(fieldName, 'i')).or(
    page.getByPlaceholder(new RegExp(fieldName, 'i'))
  )
  await field.fill(value)
}

/**
 * Trigger AI extraction for a field
 */
export async function triggerAIExtraction(page: Page, fieldName?: string) {
  const extractButton = fieldName 
    ? page.getByRole('button', { name: new RegExp(`extract.*${fieldName}`, 'i') })
    : page.getByRole('button', { name: /extract/i }).first()
  
  await extractButton.click()
  
  // Wait for extraction to complete
  await expect(page.getByText(/extracting/i)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/extracting/i)).not.toBeVisible({ timeout: 30000 })
}

/**
 * Verify citation appears with source
 */
export async function verifyCitationExists(
  page: Page, 
  extractedText: string, 
  expectedPageNum?: number
) {
  // Check that the extracted text is visible
  await expect(page.getByText(extractedText)).toBeVisible()
  
  // Check for citation indicators
  const citationIndicator = page.getByText(/\d+ source/i).or(
    page.getByText(/\[\d+\]/)
  )
  await expect(citationIndicator).toBeVisible()
  
  // If page number provided, verify it
  if (expectedPageNum) {
    await expect(page.getByText(new RegExp(`page ${expectedPageNum}`, 'i'))).toBeVisible()
  }
}

/**
 * Click on a citation badge to view source
 */
export async function viewCitationSource(page: Page, citationIndex: number) {
  const badge = page.getByText(`[${citationIndex}]`)
  await badge.click()
  
  // Verify citation details are shown
  await expect(page.getByText(/citation.*page/i)).toBeVisible()
}

/**
 * Export data in specified format
 */
export async function exportData(page: Page, format: 'json' | 'csv' | 'excel') {
  // Open export dialog
  await page.getByRole('button', { name: /export/i }).click()
  
  // Select format
  await page.getByRole('radio', { name: new RegExp(format, 'i') }).check()
  
  // Trigger download
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /download/i }).click()
  
  const download = await downloadPromise
  return download
}

/**
 * Wait for element with retry
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 })
      return true
    } catch {
      if (i === maxRetries - 1) throw new Error(`Element ${selector} not found after ${maxRetries} retries`)
      await page.waitForTimeout(2000)
    }
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ 
    path: `e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  })
}
