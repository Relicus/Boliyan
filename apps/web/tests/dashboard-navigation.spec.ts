import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log in first to see user-specific dashboard data
    await loginUser(page);
    await page.goto('/dashboard');
  });

  test('should display all dashboard header elements', async ({ page }) => {
    await expect(page.locator('#dashboard-root')).toBeVisible();
    await expect(page.locator('#dashboard-title')).toContainText('Dashboard');
    await expect(page.locator('#dashboard-messages-btn')).toBeVisible();
    await expect(page.locator('#dashboard-new-listing-btn')).toBeVisible();
  });

  test.describe('Desktop Tab Switching', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure desktop view
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('should switch between tabs on desktop', async ({ page }) => {
      // Default tab: Offers (active-bids)
      await expect(page.locator('#tab-trigger-active-bids')).toHaveAttribute('data-state', 'active');
      
      // Switch to Bids
      await page.locator('#tab-trigger-my-bids').click();
      await expect(page.locator('#tab-trigger-my-bids')).toHaveAttribute('data-state', 'active');
      await expect(page).toHaveURL(/.*tab=my-bids/);
      
      // Switch to My Listings
      await page.locator('#tab-trigger-my-listings').click();
      await expect(page.locator('#tab-trigger-my-listings')).toHaveAttribute('data-state', 'active');
      await expect(page).toHaveURL(/.*tab=my-listings/);
      
      // Switch to Watchlist
      await page.locator('#tab-trigger-watchlist').click();
      await expect(page.locator('#tab-trigger-watchlist')).toHaveAttribute('data-state', 'active');
      await expect(page).toHaveURL(/.*tab=watchlist/);
    });

    test('should show tab badges on desktop', async ({ page }) => {
      await expect(page.locator('#tab-badge-active-bids')).toBeVisible();
      await expect(page.locator('#tab-badge-my-bids')).toBeVisible();
      await expect(page.locator('#tab-badge-my-listings')).toBeVisible();
      await expect(page.locator('#tab-badge-watchlist')).toBeVisible();
    });
  });

  test.describe('Mobile Tab Switching', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure mobile view
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should switch between tabs on mobile', async ({ page }) => {
      // Use mobile triggers
      await page.locator('#tab-trigger-my-bids-mobile').click();
      await expect(page.locator('#tab-trigger-my-bids-mobile')).toHaveAttribute('data-state', 'active');
      
      await page.locator('#tab-trigger-my-listings-mobile').click();
      await expect(page.locator('#tab-trigger-my-listings-mobile')).toHaveAttribute('data-state', 'active');
      
      await page.locator('#tab-trigger-watchlist-mobile').click();
      await expect(page.locator('#tab-trigger-watchlist-mobile')).toHaveAttribute('data-state', 'active');
    });

    test('should persist data after reload', async ({ page }) => {
      // Navigate to a tab
      await page.locator('#tab-trigger-watchlist-mobile').click();
      await expect(page.locator('#tab-trigger-watchlist-mobile')).toHaveAttribute('data-state', 'active');
      
      // Reload page
      await page.reload();
      
      // Verify tab is still active (via URL param check usually handled by state)
      // and ensure dashboard root is visible
      await expect(page.locator('#dashboard-root')).toBeVisible();
      // Since we use search params for tabs, it should persist
      await expect(page).toHaveURL(/.*tab=watchlist/);
    });

  });

  test.describe('Dashboard Actions', () => {
    test('should navigate to messaging from dashboard', async ({ page }) => {
      await page.locator('#dashboard-messages-btn').click();
      await expect(page).toHaveURL('/inbox');
    });

    test('should navigate to create listing from dashboard', async ({ page }) => {
      await page.locator('#dashboard-new-listing-btn').click();
      await expect(page).toHaveURL('/list');
    });
  });
});
