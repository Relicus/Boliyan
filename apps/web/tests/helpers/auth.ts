import { Page, expect } from '@playwright/test';

const DEFAULT_EMAIL = process.env.E2E_EMAIL || 'waleedprv@gmail.com';
const DEFAULT_PASSWORD = process.env.E2E_PASSWORD || 'NoNeed';

export async function loginUser(page: Page, email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD) {
  console.log(`[loginUser] Attempting login for ${email}`);

  await page.goto('/signin');
  await page.locator('#email-input').fill(email);
  await page.locator('#password-input').fill(password);
  await page.locator('#signin-submit-btn').click();

  await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 15000 });
  console.log(`[loginUser] Login successful for ${email}`);
}
