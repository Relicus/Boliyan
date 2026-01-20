import { test, expect } from '@playwright/test';

test('homepage should load without critical console errors', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (exception) => {
    console.log(`Uncaught exception: "${exception.message}"`);
    errors.push(exception);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`Console error: "${msg.text()}"`);
    }
  });

  await page.goto('/');

  // Check if the page title is correct or if some main element exists
  await expect(page).toHaveTitle(/Boliyan/i);

  // Ensure no critical render-blocking errors occurred
  expect(errors.length).toBe(0);
});
