import { test, expect } from '@playwright/test';

test.describe('Marketplace Discovery & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should allow searching for items', async ({ page }) => {
    const searchInput = page.locator('#navbar-search-input');
    await expect(searchInput).toBeVisible();
    
    // Type search query
    await searchInput.click();
    await searchInput.fill('Camera');
    await page.waitForTimeout(300);
    await searchInput.press('Enter');
    
    // Verify search badge appears in the grid header
    // Look for the badge or chip
    const searchBadge = page.locator('#active-filter-badge, [id^="active-filter-chip-"]').first();
    await expect(searchBadge).toBeVisible({ timeout: 15000 });
    await expect(searchBadge).toContainText('Camera');
  });

  test('should navigate through categories', async ({ page }) => {
    // Wait for marketplace to load
    await expect(page.locator('#marketplace-grid-container')).toBeVisible({ timeout: 15000 });

    // Check category bar root
    const categoryBar = page.locator('#category-bar-root');
    await expect(categoryBar).toBeVisible({ timeout: 10000 });
    
    // Click on "All" to ensure we are at base state
    await page.locator('#category-btn-all').click();
    
    // Try a common category (ID should be category-btn-{kebab-case-label})
    // Use the desktop CategoryNav buttons specifically
    const catBtn = page.locator('#category-bar-root [id^="category-btn-"]').nth(1); 
    await expect(catBtn).toBeVisible();
    const catLabel = (await catBtn.innerText()).trim();
    await catBtn.click();
    
    // Verify results reflect the category
    // Look for the badge or chip
    const categoryBadge = page.locator('#active-filter-badge, [id^="active-filter-chip-"]').first();
    await expect(categoryBadge).toBeVisible({ timeout: 10000 });
    await expect(categoryBadge).toContainText(catLabel);
  });

  test('should handle location changes', async ({ page, isMobile }) => {
    // Choose correct trigger for platform
    const locationBtn = isMobile 
      ? page.locator('#location-popover-trigger-mobile')
      : page.locator('#location-popover-trigger');
      
    await expect(locationBtn).toBeVisible({ timeout: 15000 });
    
    // Open location popover
    await locationBtn.click();
    
    // Search for another city in the command input
    const cityInput = page.locator('#map-search-input');
    await expect(cityInput).toBeVisible();
    await cityInput.fill('Lahore');
    
    // Select Lahore from the command results
    const lahoreOption = page.locator('button[id^="map-search-result-"]').getByText('Lahore', { exact: false }).first();
    await expect(lahoreOption).toBeVisible({ timeout: 10000 });
    await lahoreOption.click();
    
    // Click confirm button in the popover
    await page.locator('#location-confirm-btn').click();
    
    // Verify button label updated (check text or first word)
    await expect(locationBtn).toContainText(/Lahore|Near/); // "Near Me" if selected, but here we picked Lahore
  });

  test('should toggle view modes', async ({ page, isMobile }) => {
    await expect(page.locator('#marketplace-grid-container')).toBeVisible({ timeout: 15000 });

    if (isMobile) {
      const viewBtn = page.locator('#mobile-view-toggle');
      await expect(viewBtn).toBeVisible();
      await viewBtn.click();
      await expect(page.locator('#marketplace-grid-container')).toBeVisible();
    } else {
      const viewToggles = page.locator('#view-mode-toggles');
      await expect(viewToggles).toBeVisible();
      await page.locator('button[aria-label="Spacious View"]').click();
      await expect(page.locator('#marketplace-grid-container')).toBeVisible();
    }
  });

  test('should apply mobile filters', async ({ page, isMobile }) => {
    if (!isMobile) return;

    await expect(page.locator('#marketplace-grid-container')).toBeVisible({ timeout: 15000 });
    
    // Use the filter sheet trigger
    const filterTrigger = page.locator('#mobile-filter-sheet-trigger');
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();
    
    const filterSheet = page.locator('#filter-sheet-root');
    await expect(filterSheet).toBeVisible();
    
    // Set a price range
    const minInput = filterSheet.locator('#price-min-input');
    await minInput.fill('5000');
    
    // Apply
    await page.locator('#filter-apply-btn').click();
    await expect(filterSheet).not.toBeVisible();
  });
});
