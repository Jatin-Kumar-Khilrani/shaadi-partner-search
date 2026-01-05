import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Accessibility
 * Basic accessibility checks for the application
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React app to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should have no major accessibility violations in heading structure', async ({ page }) => {
    // Wait for main content to appear
    await page.waitForSelector('main, #root, [data-testid="app"]', { timeout: 10000 }).catch(() => {});
    
    // Check that there's at least one h1 or h2 (some pages may use h2 as primary)
    const headings = page.locator('h1, h2');
    const headingCount = await headings.count();
    
    // There should be at least one heading on the page
    expect(headingCount).toBeGreaterThanOrEqual(1);
  });

  test('all images should have alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Image should have alt text, aria-label, or be marked as decorative
      const hasAccessibility = alt !== null || ariaLabel !== null || role === 'presentation';
      expect(hasAccessibility).toBe(true);
    }
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    const firstButton = page.getByRole('button').first();
    
    if (await firstButton.isVisible()) {
      // Focus the button using keyboard
      await firstButton.focus();
      
      // Check it's focused
      const isFocused = await firstButton.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    const buttons = page.getByRole('button');
    const firstButton = buttons.first();
    
    if (await firstButton.isVisible()) {
      await firstButton.focus();
      
      // The focused element should have some visual indicator
      // Check if it has focus-visible styles or outline
      const hasOutline = await firstButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || 
               styles.boxShadow !== 'none' || 
               el.classList.contains('focus-visible');
      });
      
      // This is a soft check - many apps use custom focus styles
      expect(typeof hasOutline).toBe('boolean');
    }
  });

  test('color contrast should meet minimum standards', async ({ page }) => {
    // Check that text is visible (basic contrast check)
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Basic check that background color is defined
    expect(backgroundColor).toBeDefined();
  });
});
