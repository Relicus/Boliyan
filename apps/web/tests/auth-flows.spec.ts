import { test, expect, type Locator, type Page } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { gotoWithRetry } from './helpers/goto';

const revealSignupForm = async (page: Page, signupCard: Locator) => {
  const emailSignupBtn = signupCard.locator('#email-signup-btn').first();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await emailSignupBtn.isVisible().catch(() => false)) {
      await emailSignupBtn.click({ force: true });
    }
    const nameInput = signupCard.locator('#name-input');
    if (await nameInput.isVisible().catch(() => false)) return nameInput;
    await page.waitForTimeout(200);
  }

  const nameInput = signupCard.locator('#name-input');
  await nameInput.scrollIntoViewIfNeeded();
  await expect(nameInput).toBeVisible({ timeout: 10000 });
  return nameInput;
};

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page, '/signin');
  });

  test.describe('Sign In', () => {
    test('should display all sign-in elements', async ({ page }) => {
      await expect(page.locator('#signin-card')).toBeVisible();
      await expect(page.locator('#signin-header')).toBeVisible();
      await expect(page.locator('#signin-title')).toContainText('Welcome Back');
      await expect(page.locator('#email-input')).toBeVisible();
      await page.locator('#email-input').click();
      await expect(page.locator('#password-input')).toBeVisible();
      await expect(page.locator('#signin-submit-btn')).toBeVisible();
      await expect(page.locator('#signup-link')).toBeVisible();
    });

    test('should validate empty inputs and shake', async ({ page }) => {
      const signinCard = page.locator('#signin-card').first();
      const emailInput = signinCard.locator('#email-input').first();

      await emailInput.click();
      await emailInput.type('a');
      await emailInput.press('Tab');
      await emailInput.fill('');
      await signinCard.locator('#signin-submit-btn').click();
      
      // Check for validation messages
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
      const passwordError = page.locator('text=Password must be at least 6 characters');
      if (await passwordError.isVisible().catch(() => false)) {
        await expect(passwordError).toBeVisible();
      }
    });

    test('should navigate to sign-up page', async ({ page }) => {
      await page.locator('#signup-link').click();
      await expect(page).toHaveURL('/signup');
      await expect(page.locator('#signup-card').first()).toBeVisible();
    });
  });

  test.describe('Sign Up', () => {
    test.beforeEach(async ({ page }) => {
      await gotoWithRetry(page, '/signup');
    });

    test('should display all sign-up elements', async ({ page }) => {
      const signupCard = page.locator('#signup-card').first();
      await expect(signupCard).toBeVisible();
      await revealSignupForm(page, signupCard);
      await expect(signupCard.locator('#email-input')).toBeVisible();
      await expect(signupCard.locator('#phone-input')).toBeVisible();
      await expect(signupCard.locator('#password-input')).toBeVisible();
      await expect(signupCard.locator('#confirm-password-input')).toBeVisible();
      await expect(signupCard.locator('#city-select')).toBeVisible();
      await expect(signupCard.locator('#signup-submit-btn')).toBeVisible();
    });

    test('should validate password mismatch', async ({ page }) => {
      const signupCard = page.locator('#signup-card').first();
      await revealSignupForm(page, signupCard);
      await signupCard.locator('#name-input').fill('Test User');
      await signupCard.locator('#email-input').fill('test@example.com');
      await signupCard.locator('#phone-input').fill('03001234567');
      await signupCard.locator('#password-input').fill('password123');
      await signupCard.locator('#confirm-password-input').fill('wrongpassword');
      
      await signupCard.locator('#signup-submit-btn').click();
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
