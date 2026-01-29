import { test, expect } from '@playwright/test';

import { loginUser } from './helpers/auth';

const CANDIDATE = {
  email: process.env.E2E_EMAIL || 'waleedprv@gmail.com',
  password: process.env.E2E_PASSWORD || 'NoNeed'
};

test.describe('Auth Probe', () => {
    test.skip(!!process.env.CI, 'Credential probe is local-only.');
    test(`Try login: ${CANDIDATE.email}`, async ({ page }) => {
        console.log(`[Probe] Testing ${CANDIDATE.email}`);
        await loginUser(page, CANDIDATE.email, CANDIDATE.password);
        await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 10000 });
        console.log(`[Probe] SUCCESS! Logged in as ${CANDIDATE.email}`);
    });
});
