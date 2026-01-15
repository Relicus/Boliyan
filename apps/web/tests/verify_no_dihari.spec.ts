import { test, expect } from '@playwright/test';

test('Verify Dihari is not visible in Navbar', async ({ page }) => {
  // Navigate to Home
  await page.goto('http://localhost:3000/');
  
  // Wait for navbar to load
  await page.waitForSelector('#navbar-01');

  // Verify that the Dihari logo link does not exist
  const dihariLogoLink = page.locator('#dihari-logo-link');
  await expect(dihariLogoLink).toHaveCount(0);

  // Verify that Boliyan logo is visible
  const boliyanLogo = page.locator('#navbar-logo-link-04');
  await expect(boliyanLogo).toBeVisible();

  // Verify that the Boliyan brand name is visible
  const boliyanUrdu = page.locator('#navbar-brand-urdu-09');
  await expect(boliyanUrdu).toBeVisible();
  await expect(boliyanUrdu).toHaveText('بولیاں');

  const boliyanEnglish = page.locator('#navbar-brand-english-10');
  await expect(boliyanEnglish).toBeVisible();
  await expect(boliyanEnglish).toHaveText('Boliyan');
});
