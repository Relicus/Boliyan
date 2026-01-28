
import { test, expect } from '@playwright/test';
import { mockSupabaseNetwork } from './helpers/mock-network';
import { loginUser } from './helpers/auth';

test.describe('Visual Stability & Layout', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Setup Network Mocks
    await mockSupabaseNetwork(page);
    
    // 2. Login to render authenticated UI
    await loginUser(page);
    await page.goto('/');
  });

  test('should render Marketplace Grid with correct layout', async ({ page }) => {
    // Wait for Grid Container itself
    const grid = page.locator('#marketplace-grid-container'); 
    await expect(grid).toBeVisible({ timeout: 10000 });
    
    // Verify CSS Grid classes ensuring responsive layout
    const display = await grid.evaluate((el) => window.getComputedStyle(el).display);
    expect(display).toBe('grid');
    
    // Verify Items loaded
    const items = page.locator('[id^="item-card-"]');
    await expect(items.first()).toBeVisible();
    
    // UI Stability: Ensure no layout shift after 500ms (images loaded/placeholders)
    const box1 = await items.first().boundingBox();
    await page.waitForTimeout(500);
    const box2 = await items.first().boundingBox();
    
    const yDelta = Math.abs((box1?.y || 0) - (box2?.y || 0));
    expect(yDelta).toBeLessThan(1); // Allow sub-pixel shifts
    expect(box1?.height).toBeCloseTo(box2?.height || 0, 1); // Height should be stable
  });

  test('should animate Dialog open/close smoothly', async ({ page }) => {
    // 1. Open a Dialog (Item Card Modal)
    const firstItem = page.locator('[id^="item-card-"]').first();
    const itemId = (await firstItem.getAttribute('id'))?.replace('item-card-', '');
    const titleBtn = firstItem.locator('[id$="-title"]');
    
    await titleBtn.click();
    
    // 2. Verify Dialog Content is Visible
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // 3. Close Dialog using the specific ID from ItemCard implementation
    // ID format: `close-listing-btn-${item.id}`
    const closeBtn = page.locator(`#close-listing-btn-${itemId}`);
    await closeBtn.click();
    
    // 5. Verify Dialog is Gone (Animation completed)
    await expect(dialog).not.toBeVisible();
  });
  
  test('should display Navbar elements strictly', async ({ page }) => {
      // Verify Logo
      await expect(page.locator('#navbar-01').getByText('Boliyan').first()).toBeVisible();
      
      // Verify Search Bar
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
      
      // Verify User Avatar (Authenticated state verified in beforeEach)
      await expect(page.locator('#navbar-avatar-18')).toBeVisible();
  });

});
