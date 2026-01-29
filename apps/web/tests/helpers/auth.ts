import { Page, expect } from '@playwright/test';

import { gotoWithRetry } from './goto';

const DEFAULT_EMAIL = process.env.E2E_EMAIL || 'waleedprv@gmail.com';
const DEFAULT_PASSWORD = process.env.E2E_PASSWORD || 'NoNeed';

export async function loginUser(page: Page, email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD) {
  const targetEmail = email;
  console.log(`[loginUser] Attempting login for ${targetEmail}`);

  await gotoWithRetry(page, '/signin');
  const signinCard = page.locator('#signin-card').first();
  await expect(signinCard).toBeVisible({ timeout: 10000 });

  const emailInput = signinCard.locator('#email-input').first();
  const passwordInput = signinCard.locator('#password-input').first();

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(targetEmail);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (await passwordInput.isVisible().catch(() => false)) break;
    await emailInput.fill('');
    await emailInput.type(targetEmail, { delay: 15 });
    await emailInput.press('Tab');
    await page.waitForTimeout(150);
  }

  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  await passwordInput.fill(password);
  await signinCard.locator('#signin-submit-btn').click();

  await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 15000 });
  console.log(`[loginUser] Login successful for ${email}`);
}
