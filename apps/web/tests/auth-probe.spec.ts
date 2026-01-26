import { test, expect } from '@playwright/test';

const CANDIDATE = {
  email: process.env.E2E_EMAIL || 'waleedprv@gmail.com',
  password: process.env.E2E_PASSWORD || 'NoNeed'
};

test.describe('Auth Probe', () => {
    test.skip(!!process.env.CI, 'Credential probe is local-only.');
    test(`Try login: ${CANDIDATE.email}`, async ({ page }) => {
        console.log(`[Probe] Testing ${CANDIDATE.email}`);
        await page.goto('/signin');
        await page.fill('#email-input', CANDIDATE.email);
        await page.fill('#password-input', CANDIDATE.password);
        await page.click('#signin-submit-btn');

        await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 10000 });
        console.log(`[Probe] SUCCESS! Logged in as ${CANDIDATE.email}`);
    });
});
