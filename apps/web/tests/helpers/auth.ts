import { Page, expect } from '@playwright/test';

const DEFAULT_EMAIL = process.env.E2E_EMAIL || 'waleedprv@gmail.com';
const DEFAULT_PASSWORD = process.env.E2E_PASSWORD || 'NoNeed';

export async function loginUser(page: Page, email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD) {
  const targetEmail = email;
  console.log(`[loginUser] Attempting login for ${targetEmail}`);

  await page.goto('/signin');
  await page.fill('#email-input', targetEmail);
  await page.fill('#password-input', password);
  await page.click('#signin-submit-btn');

  await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 15000 });
  console.log(`[loginUser] Login successful for ${email}`);
}
