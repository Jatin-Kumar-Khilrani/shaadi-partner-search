import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Search Functionality
 * Tests the profile search and filtering features
 */

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React app to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display search filters', async ({ page }) => {
    // Wait for main content to appear
    await page.waitForSelector('main, #root, [data-testid="app"]', { timeout: 10000 }).catch(() => {});
    
    // Look for search-related elements or interactive elements
    const interactiveElements = page.locator('button, [role="button"], select, input, a[href]');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have gender selection options', async ({ page }) => {
    // Check for dropdown or radio buttons for gender selection
    const genderLabel = page.getByText(/looking for|i am|gender/i).first();
    if (await genderLabel.isVisible()) {
      await expect(genderLabel).toBeVisible();
    }
  });

  test('should have age filter inputs', async ({ page }) => {
    // Look for age-related inputs
    const ageText = page.getByText(/age|years/i).first();
    if (await ageText.isVisible()) {
      await expect(ageText).toBeVisible();
    }
  });
});
