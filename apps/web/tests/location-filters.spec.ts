import { test, expect } from '@playwright/test';

test.describe('Location Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show Pakistan by default', async ({ page }) => {
    const locationTrigger = page.locator('#location-popover-trigger');
    await expect(locationTrigger).toContainText('Karachi');
  });

  test('should open popover and show radius slider', async ({ page }) => {
    await page.click('#location-popover-trigger');
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Range');
    await expect(popover.locator('.py-2')).toBeVisible(); // Slider
  });

  test('should select a city and update trigger label', async ({ page }) => {
    await page.click('#location-popover-trigger');
    await page.fill('input[placeholder="Search city..."]', 'Lahore');
    await page.click('text=Lahore');
    
    const locationTrigger = page.locator('#location-popover-trigger');
    await expect(locationTrigger).toContainText('Lahore');
    await expect(locationTrigger).not.toContainText('km');
  });

  test('should allow switching back to Whole Country', async ({ page }) => {
    // First select a city
    await page.click('#location-popover-trigger');
    await page.fill('input[placeholder="Search city..."]', 'Lahore');
    await page.click('text=Lahore');
    
    // Then switch back
    await page.click('#location-popover-trigger');
    await page.click('#loc-option-whole-country', { force: true });
    
    const locationTrigger = page.locator('#location-popover-trigger');
    await expect(locationTrigger).toContainText('Pakistan');
  });
});
