import { test, expect, Page } from '@playwright/test';

import { gotoWithRetry } from './helpers/goto';

const getLocationTrigger = async (page: Page) => {
  const desktopTrigger = page.locator('#location-popover-trigger');
  if (await desktopTrigger.isVisible()) return desktopTrigger;
  return page.locator('#location-popover-trigger-mobile');
};

const openLocationPopover = async (page: Page) => {
  const locationTrigger = await getLocationTrigger(page);
  await locationTrigger.click();
  const popover = page.locator('[role="dialog"]').first();
  await expect(popover).toBeVisible();
  return popover;
};

const selectCityFromMap = async (popover: ReturnType<Page['locator']>, city: string) => {
  const cityId = `#map-city-chip-${city.toLowerCase()}`;
  const chip = popover.locator(cityId).first();

  if (await chip.isVisible().catch(() => false)) {
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    return;
  }

  const searchInput = popover.locator('#map-search-input');
  await searchInput.fill(city);
  const firstResult = popover.locator('[id^="map-search-result-"]').first();
  await expect(firstResult).toBeVisible({ timeout: 10000 });
  await firstResult.click();
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
    await gotoWithRetry(page, '/');
  });

  test('should show Pakistan by default', async ({ page }) => {
    const locationTrigger = await getLocationTrigger(page);
    await expect(locationTrigger).toContainText('Karachi');
  });

  test('should open popover and show map picker', async ({ page }) => {
    const popover = await openLocationPopover(page);
    await expect(popover.locator('#map-search-input')).toBeVisible();
    await expect(popover.locator('#location-confirm-btn')).toBeVisible();
  });

  test('should select a city and update trigger label', async ({ page }) => {
    const popover = await openLocationPopover(page);
    await selectCityFromMap(popover, 'Lahore');
    await popover.locator('#location-confirm-btn').click();
    
    const updatedTrigger = await getLocationTrigger(page);
    await expect(updatedTrigger).toContainText('Lahore');
    await expect(updatedTrigger).not.toContainText('km');
  });

  test('should allow switching cities from map chips', async ({ page }) => {
    const popover = await openLocationPopover(page);
    await selectCityFromMap(popover, 'Lahore');
    await popover.locator('#location-confirm-btn').click();
    
    const updatedTrigger = await getLocationTrigger(page);
    await updatedTrigger.click();
    const nextPopover = page.locator('[role="dialog"]').first();
    await expect(nextPopover).toBeVisible();
    await selectCityFromMap(nextPopover, 'Karachi');
    await nextPopover.locator('#location-confirm-btn').click();
    
    const finalTrigger = await getLocationTrigger(page);
    await expect(finalTrigger).toContainText('Karachi');
  });
});
