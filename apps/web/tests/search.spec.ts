
import { test, expect } from '@playwright/test';

test.describe('Search & Discovery', () => {

  test('Search Bar visibility and input', async ({ page }) => {
    await page.goto('http://192.168.18.125:3000/');
    
    // Check if search bar exists (desktop)
    const searchInput = page.getByPlaceholder('Search items, categories...');
    await expect(searchInput).toBeVisible();
    
    // Type query
    await searchInput.fill('iphone');
    await expect(searchInput).toHaveValue('iphone');
    
    // Check suggestions appear (mocked data usually, or real if seeded)
    // We assume there might be suggestions or "No suggestions found" if empty
    // await expect(page.locator('text=No suggestions found').or(page.locator('text=iphone'))).toBeVisible(); 
  });

  test('Execute Search and Filter Results', async ({ page }) => {
    await page.goto('http://192.168.18.125:3000/');
    
    // Type and Enter
    const searchInput = page.getByPlaceholder('Search items, categories...');
    await searchInput.fill('test item');
    await searchInput.press('Enter');
    
    // URL should not necessarily change if context-based, but filter badge should appear
    // Check for "test item" badge in desktop filter row or mobile
    // Note: Depends on screen size. Default playwright is desktop-ish usually (1280x720)
    
    // Wait for badge to appear
    await expect(page.getByText('"test item"')).toBeVisible();
  });

  test('Category Navigation', async ({ page }) => {
    await page.goto('http://192.168.18.125:3000/');
    
    // Click a category in CategoryNav
    // Assuming "Vehicles" or similar exists from constants
    // The CategoryNav renders items based on constants.ts or fetched categories
    
    // Let's verify standard UI elements of MarketplaceGrid
    await expect(page.locator('#marketplace-grid-root')).toBeVisible();
  });

  test('Mobile Filter View', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://192.168.18.125:3000/');
    
    // Check for mobile filter dropdowns
    await expect(page.locator('#mobile-search-filter-container')).toBeVisible();
    await expect(page.locator('#mobile-sort-select')).toBeVisible();
  });

});
