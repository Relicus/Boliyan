import { test, expect } from '@playwright/test';

test('verify geometric ba logomark', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  // Check if the SVG logomark exists within the Navbar
  const logomark = page.locator('nav a[href="/"] svg');
  await expect(logomark).toBeVisible();
  
  // Verify it has the correct path (spot check)
  const path = logomark.locator('path');
  await expect(path).toHaveAttribute('d', 'M5,15 Q20,35 35,15'); // The parabolic curve
  
  // Verify the circle (nuqta) exists
  const circle = logomark.locator('circle');
  await expect(circle).toBeVisible();

  // Verify text is present
  const boliyanText = page.locator('nav').getByText('Boliyan', { exact: true });
  await expect(boliyanText).toBeVisible();
});
