
import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

test.describe('Reproduction: Stuck Bidding Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser console logs
    page.on('console', msg => {
      if (msg.text().includes('[useBidding]')) {
        console.log(`[BROWSER-BID] ${msg.text()}`);
      }
    });

    await mockSupabaseNetwork(page);
    await loginUser(page);
    await page.goto('/');
    
    // Wait for the grid container and at least one card
    await page.waitForSelector('#marketplace-grid-container', { timeout: 15000 });
    await page.waitForSelector('[id^="item-card-"]', { state: 'visible', timeout: 15000 });
  });

  test('should verify that the bid button success state sticks (FAILS currently)', async ({ page }) => {
    // Find biddable cards
    const biddableCards = page.locator('[id^="item-card-"]').filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    
    await expect(biddableCards.first()).toBeVisible({ timeout: 10000 });
    const itemCard = biddableCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    console.log(`[Test] testing itemId: ${itemId}`);
    
    const bidBtn = itemCard.locator(`#item-card-${itemId}-place-bid-btn`);

    // Place bid
    console.log('[Test] Clicking Bid Button...');
    await bidBtn.click();

    // Verify "Bid Placed!" appears
    // The button text changes when isSuccess is true
    await expect(bidBtn).toContainText('Bid Placed!', { timeout: 5000 });
    console.log('[Test] Success message "Bid Placed!" appeared on button.');

    // Wait for the timeout that SHOULD reset it (1500ms + buffer)
    console.log('[Test] Waiting for 3 seconds to see if it resets...');
    await page.waitForTimeout(3000);

    // This should FAIL if the issue exists (it will still be visible)
    // We expect it to NOT be visible if fixed.
    // For reproduction, we'll assert that it's STILL visible to prove the bug.
    await expect(bidBtn).toContainText('Bid Placed!');
    console.log('[Test] BUG CONFIRMED: Success message is still visible after 3 seconds.');
    
    // Also check scale if possible, though text is easier to assert
    const style = await itemCard.getAttribute('style');
    console.log(`[Test] Card style: ${style}`);
  });
});
