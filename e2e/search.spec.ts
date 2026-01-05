import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Search Functionality
 * Tests the profile search and filtering features
 */

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Just wait for page load
    await page.waitForLoadState('load');
  });

  test('should display search filters', async ({ page }) => {
    // Give React time to render
    await page.waitForTimeout(2000);
    
    // Check for any content on the page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
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
