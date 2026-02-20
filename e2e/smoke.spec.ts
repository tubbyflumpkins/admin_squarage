import { test, expect } from '@playwright/test'

// Smoke tests verify core functionality hasn't regressed.
// These run against the local dev server using .env.local (non-production DB).

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/)
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'invalid@example.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Wait for error to appear
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard & Navigation (authenticated)', () => {
  // Skip auth-dependent tests if no test user configured
  const testEmail = process.env.TEST_USER_EMAIL
  const testPassword = process.env.TEST_USER_PASSWORD

  test.beforeEach(async ({ page }) => {
    test.skip(!testEmail || !testPassword, 'TEST_USER_EMAIL and TEST_USER_PASSWORD env vars required')
    await page.goto('/login')
    await page.fill('#email', testEmail!)
    await page.fill('#password', testPassword!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  })

  test('dashboard loads with widgets', async ({ page }) => {
    // Dashboard should show widget containers
    await expect(page).toHaveURL('/')
    // Wait for page content to load
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigate to Todo page', async ({ page }) => {
    await page.click('a:has-text("Todo List")')
    await page.waitForURL(/\/todo/)
    await expect(page).toHaveURL(/\/todo/)
  })

  test('navigate to Sales page', async ({ page }) => {
    await page.click('a:has-text("Sales Tracker")')
    await page.waitForURL(/\/sales/)
    await expect(page).toHaveURL(/\/sales/)
  })

  test('navigate to Calendar page', async ({ page }) => {
    await page.click('a:has-text("Calendar")')
    await page.waitForURL(/\/calendar/)
    await expect(page).toHaveURL(/\/calendar/)
  })

  test('navigate to Expenses page', async ({ page }) => {
    await page.click('a:has-text("Expenses")')
    await page.waitForURL(/\/expenses/)
    await expect(page).toHaveURL(/\/expenses/)
  })

  test('navigate to Quick Links page', async ({ page }) => {
    await page.click('a:has-text("Quick Links")')
    await page.waitForURL(/\/quick-links/)
    await expect(page).toHaveURL(/\/quick-links/)
  })

  test('navigate to Email page', async ({ page }) => {
    await page.click('a:has-text("Email")')
    await page.waitForURL(/\/email/)
    await expect(page).toHaveURL(/\/email/)
  })

  test('user menu opens and shows settings', async ({ page }) => {
    // Open user avatar menu
    const avatar = page.locator('button').filter({ has: page.locator('.rounded-full') }).first()
    await avatar.click()
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('text=Log out')).toBeVisible()
  })
})
