import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth', 'user.json')

setup('authenticate', async ({ page }) => {
  // Navigate to the auth page
  await page.goto('/auth')
  
  // Check if we need to sign up or sign in
  const hasSignUpForm = await page.getByRole('button', { name: /sign up/i }).isVisible()
  
  if (hasSignUpForm) {
    // Fill in signup form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123456!')
    await page.getByRole('button', { name: /sign up/i }).click()
  } else {
    // Fill in login form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123456!')
    await page.getByRole('button', { name: /sign in/i }).click()
  }
  
  // Wait for navigation to main app
  await page.waitForURL('/', { timeout: 10000 })
  
  // Verify we're authenticated
  await expect(page).toHaveURL('/')
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
})
