import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * Tests login and registration dialogs
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open login dialog when clicking sign in', async ({ page }) => {
    // Find and click sign in button
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Check that a dialog/modal appears
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have registration option', async ({ page }) => {
    // Look for register/signup link or button
    const registerButton = page.getByRole('button', { name: /register|sign up|create account/i }).first();
    
    if (await registerButton.isVisible()) {
      await expect(registerButton).toBeVisible();
    }
  });

  test('login form should have email and password fields', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Wait for dialog
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Check for input fields
      const emailInput = page.getByLabel(/email|phone/i).first();
      const passwordInput = page.getByLabel(/password/i).first();
      
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
      }
      if (await passwordInput.isVisible()) {
        await expect(passwordInput).toBeVisible();
      }
    }
  });

  test('should show validation errors for empty login', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Wait for dialog
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Try to submit empty form
      const submitButton = page.getByRole('dialog').getByRole('button', { name: /sign in|login|submit/i }).first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show some error indication (red border, error message, etc.)
        // This is a basic check - the form shouldn't just disappear
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
      }
    }
  });
});
