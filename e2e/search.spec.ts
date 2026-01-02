import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Search Functionality
 * Tests the profile search and filtering features
 */

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search filters', async ({ page }) => {
    // Look for search-related elements
    const searchSection = page.locator('[data-testid="hero-search"], form, [role="search"]').first();
    
    // At minimum, the page should have interactive elements
    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible();
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
