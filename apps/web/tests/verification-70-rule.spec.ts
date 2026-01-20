
import { test, expect } from '@playwright/test';

test('70% Minimum Bid Rule Verification', async ({ page }) => {
  await page.goto('/');
  
  // Wait for items to load
  await page.waitForSelector('.group');

  // Find the first item card with a bidding input
  const itemCard = page.locator('.group', { has: page.locator('input[id*="bid-input"]') }).first();
  const input = itemCard.locator('input[id*="bid-input"]');
  const bidBtn = itemCard.locator('button[id*="place-bid-btn"]');

  // Get current asking price to calculate 70%
  const askPriceElement = itemCard.locator('[id*="ask-price"]');
  const askPriceText = await askPriceElement.innerText();
  const askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, ''));
  
  const minAllowed = askPrice * 0.7;
  const invalidBid = Math.floor(minAllowed - 100);

  // 1. Test Blocked Bid (Below 70%)
  await input.fill(invalidBid.toString());
  
  // Verify red background/error styling
  // Note: We use the class selector or computed style as defined in ItemCard.tsx
  await expect(input).toHaveClass(/bg-red-50/);
  
  // Clicking bid button should trigger "error" state (shake) but not "success"
  await bidBtn.click();
  await expect(itemCard.locator('[id*="success-msg"]')).not.toBeVisible();

  // 2. Test Valid Bid (Above 70%)
  const validBid = Math.ceil(minAllowed + 100);
  await input.fill(validBid.toString());
  
  // Verify error styling is gone
  await expect(input).not.toHaveClass(/bg-red-50/);
  
  // Click bid button - should trigger success
  await bidBtn.click();
  await expect(itemCard.locator('[id*="success-msg"]')).toBeVisible();
});
