import { test, expect } from '@playwright/test';

test('should have a favicon in the head', async ({ page }) => {
  await page.goto('/');

  // Verify head contains the icon link
  const iconLink = page.locator('link[rel="icon"]');
  await expect(iconLink).toBeAttached();
  
  const href = await iconLink.getAttribute('href');
  // Next.js might append a version or hash, but it should contain logo.svg
  expect(href).toContain('logo.svg');
});

test('should have an apple-touch-icon in the head', async ({ page }) => {
  await page.goto('/');

  const appleLink = page.locator('link[rel="apple-touch-icon"]');
  await expect(appleLink).toBeAttached();
  
  const href = await appleLink.getAttribute('href');
  expect(href).toContain('logo.svg');
});
