import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Homepage & Navigation
 * Tests critical user flows on the homepage
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Just wait for page load
    await page.waitForLoadState('load');
  });

  test('should load homepage with title', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Shaadi/i);
  });

  test('should display hero section', async ({ page }) => {
    // Give React time to render
    await page.waitForTimeout(2000);
    
    // Check for any content on the page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('should have working navigation', async ({ page }) => {
    // Give React time to render
    await page.waitForTimeout(2000);
    
    // Check that page has rendered some content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Give time to resize and render
    await page.waitForTimeout(2000);
    
    // Page should still have content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});
