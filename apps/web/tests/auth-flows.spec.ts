import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test.describe('Sign In', () => {
    test('should display all sign-in elements', async ({ page }) => {
      await expect(page.locator('#signin-card')).toBeVisible();
      await expect(page.locator('#signin-header')).toBeVisible();
      await expect(page.locator('#signin-title')).toContainText('Welcome Back');
      await expect(page.locator('#email-input')).toBeVisible();
      await expect(page.locator('#password-input')).toBeVisible();
      await expect(page.locator('#signin-submit-btn')).toBeVisible();
      await expect(page.locator('#signup-link')).toBeVisible();
    });

    test('should validate empty inputs and shake', async ({ page }) => {
      await page.locator('#signin-submit-btn').click();
      
      // Check for validation messages
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    });

    test('should navigate to sign-up page', async ({ page }) => {
      await page.locator('#signup-link').click();
      await expect(page).toHaveURL('/signup');
      await expect(page.locator('#signup-card')).toBeVisible();
    });
  });

  test.describe('Sign Up', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should display all sign-up elements', async ({ page }) => {
      await expect(page.locator('#signup-card')).toBeVisible();
      await page.locator('#email-signup-btn').click();
      await expect(page.locator('#name-input')).toBeVisible();
      await expect(page.locator('#email-input')).toBeVisible();
      await expect(page.locator('#phone-input')).toBeVisible();
      await expect(page.locator('#password-input')).toBeVisible();
      await expect(page.locator('#confirm-password-input')).toBeVisible();
      await expect(page.locator('#city-select')).toBeVisible();
      await expect(page.locator('#signup-submit-btn')).toBeVisible();
    });

    test('should validate password mismatch', async ({ page }) => {
      await page.locator('#email-signup-btn').click();
      await page.locator('#name-input').fill('Test User');
      await page.locator('#email-input').fill('test@example.com');
      await page.locator('#phone-input').fill('03001234567');
      await page.locator('#password-input').fill('password123');
      await page.locator('#confirm-password-input').fill('wrongpassword');
      
      await page.locator('#signup-submit-btn').click();
      await expect(page.locator('text=Passwords don\'t match')).toBeVisible();
    });

    test('should navigate back to sign-in page', async ({ page }) => {
      await page.locator('#signin-link').click();
      await expect(page).toHaveURL('/signin');
    });
  });

  test.describe('Sign Out', () => {
    test('should log out successfully', async ({ page }) => {
      await loginUser(page);
      
      // Click avatar to open dropdown
      await page.locator('#navbar-avatar-18').click();
      
      // Click logout
      await page.locator('#navbar-logout-btn').click();
      
      // Verify redirect to home
      await expect(page).toHaveURL(/.*localhost:3000\/?/);
      await expect(page.locator('#navbar-signin-btn')).toBeVisible();
    });
  });
});
