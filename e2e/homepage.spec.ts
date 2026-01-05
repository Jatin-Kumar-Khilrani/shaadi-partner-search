import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Homepage & Navigation
 * Tests critical user flows on the homepage
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React app to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should load homepage with title', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Shaadi/i);
  });

  test('should display hero section', async ({ page }) => {
    // Wait for main content to appear
    await page.waitForSelector('main, #root, [data-testid="app"]', { timeout: 10000 }).catch(() => {});
    
    // Check that main heading or hero text is visible
    const heading = page.locator('h1, h2, [class*="hero"], [class*="title"]').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should have working navigation', async ({ page }) => {
    // Wait for main content to appear
    await page.waitForSelector('main, #root, [data-testid="app"]', { timeout: 10000 }).catch(() => {});
    
    // Check that navigation buttons or clickable elements exist
    const interactiveElements = page.locator('button, [role="button"], a[href]');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Wait for resize and content
    await page.waitForTimeout(500);
    await page.waitForSelector('main, #root, [data-testid="app"]', { timeout: 10000 }).catch(() => {});
    
    // Page should still be functional - check for any visible content
    const content = page.locator('h1, h2, p, [class*="hero"], [class*="title"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
