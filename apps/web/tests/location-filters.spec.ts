import { test, expect, Page } from '@playwright/test';

const getLocationTrigger = async (page: Page) => {
  const desktopTrigger = page.locator('#location-popover-trigger');
  if (await desktopTrigger.isVisible()) return desktopTrigger;
  return page.locator('#location-popover-trigger-mobile');
};

test.describe('Location Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('boliyan_user_location', JSON.stringify({
        lat: 24.8607,
        lng: 67.0011,
        city: 'Karachi',
        address: 'Karachi, Pakistan'
      }));
      localStorage.setItem('boliyan_filters', JSON.stringify({
        radius: 50,
        locationMode: 'current',
        city: 'Karachi',
        currentCoords: { lat: 24.8607, lng: 67.0011 }
      }));
    });
    await page.goto('/');
  });

  test('should show Pakistan by default', async ({ page }) => {
    const locationTrigger = await getLocationTrigger(page);
    await expect(locationTrigger).toContainText('Karachi');
  });

  test('should open popover and show map picker', async ({ page }) => {
    const locationTrigger = await getLocationTrigger(page);
    await locationTrigger.click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    await expect(popover.locator('#map-search-input')).toBeVisible();
    await expect(popover.locator('#location-confirm-btn')).toBeVisible();
  });

  test('should select a city and update trigger label', async ({ page }) => {
    const locationTrigger = await getLocationTrigger(page);
    await locationTrigger.click();
    await page.click('#map-city-chip-lahore');
    await page.click('#location-confirm-btn');
    
    const updatedTrigger = await getLocationTrigger(page);
    await expect(updatedTrigger).toContainText('Lahore');
    await expect(updatedTrigger).not.toContainText('km');
  });

  test('should allow switching cities from map chips', async ({ page }) => {
    const locationTrigger = await getLocationTrigger(page);
    await locationTrigger.click();
    await page.click('#map-city-chip-lahore');
    await page.click('#location-confirm-btn');
    
    const updatedTrigger = await getLocationTrigger(page);
    await updatedTrigger.click();
    await page.click('#map-city-chip-karachi');
    await page.click('#location-confirm-btn');
    
    const finalTrigger = await getLocationTrigger(page);
    await expect(finalTrigger).toContainText('Karachi');
  });
});
