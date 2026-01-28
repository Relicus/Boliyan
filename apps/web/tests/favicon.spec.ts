import { test, expect } from '@playwright/test';

test('should have a favicon in the head', async ({ page }) => {
  await page.goto('/');

  // Verify head contains the icon link
  const iconLinks = page.locator('link[rel="icon"]');
  const iconCount = await iconLinks.count();
  expect(iconCount).toBeGreaterThan(0);
  
  const hrefs = await iconLinks.evaluateAll(links => links.map(link => link.getAttribute('href') || ''));
  const hasExpectedIcon = hrefs.some(href => href.includes('logo.svg') || href.includes('favicon'));
  expect(hasExpectedIcon).toBeTruthy();
});

test('should have an apple-touch-icon in the head', async ({ page }) => {
  await page.goto('/');

  const appleLink = page.locator('link[rel="apple-touch-icon"]');
  await expect(appleLink).toBeAttached();
  
  const href = await appleLink.getAttribute('href');
  expect(href).toContain('logo.svg');
});
