import { test, expect } from '@playwright/test';

const CANDIDATES = [
  { email: 'u1@demo.com', password: 'password123' },
  { email: 'u1@demo.com', password: 'test123456' },
  { email: 'u1@demo.com', password: 'password' },
  { email: 'u1@demo.com', password: '123456' },
  { email: 'demo@example.com', password: 'password' },
  { email: 'demo@example.com', password: 'password123' },
  { email: 'demo@example.com', password: 'test123456' },
];

test.describe('Auth Probe', () => {
    test.skip(!!process.env.CI, 'Credential probe is local-only.');
    for (const cred of CANDIDATES) {
        test(`Try login: ${cred.email} / ${cred.password}`, async ({ page }) => {
            console.log(`[Probe] Testing ${cred.email} with ${cred.password}`);
            await page.goto('/signin');
            await page.fill('#email-input', cred.email);
            await page.fill('#password-input', cred.password);
            await page.click('#signin-submit-btn');
            
            // Wait for either success (Avatar) or Failure (Shaking/Error)
            try {
                // Check success first
                await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 5000 });
                console.log(`[Probe] SUCCESS! Credential found: ${cred.email} / ${cred.password}`);
            } catch (e) {
                console.log(`[Probe] Failed: ${cred.email} / ${cred.password}`);
                // Verify we are still on signin or see an error
                // Just let the test fail or pass based on success
                throw e;
            }
        });
    }
});
