
import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test('70% Minimum Bid Rule Verification', async ({ page }) => {
  await loginUser(page);
  await page.goto('/');
  
  // Wait for items to load
  await page.waitForSelector('.group');

  // Find the first item card with a bidding input
  const itemCard = page.locator('.group', { has: page.locator('input[id*="bid-input"]') }).first();
  const input = itemCard.locator('input[id*="bid-input"]');
  const bidBtn = itemCard.locator('button[id*="place-bid-btn"]');

  // Get current asking price to calculate 70%
  const askPriceElement = itemCard.locator('[id*="price-asking-value"]');
  const askPriceText = await askPriceElement.innerText();
  const askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, ''));
  console.log(`[Test] Item Ask Price: ${askPrice}`);
  
  const initialValueStr = await input.inputValue();
  const initialValue = parseFloat(initialValueStr.replace(/,/g, '')) || 0;
  console.log(`[Test] Initial Bid Value: ${initialValue}`);

  const minAllowed = askPrice * 0.7;
  const invalidBid = Math.floor(minAllowed - 100);
  console.log(`[Test] Min Allowed: ${minAllowed}, Invalid Bid: ${invalidBid}`);

  // 1. Test Blocked Bid (Below 70%)
  await input.fill(invalidBid.toString());
  
  // Verify red background/error styling
  await expect(input).toHaveClass(/bg-red-50/);
  
  // 2. Test Valid Bid (Above 70% AND above current high bid)
  // Ensure it's also a multiple of 10 (business rule)
  const validBid = Math.ceil((Math.max(minAllowed, initialValue) + 100) / 10) * 10;
  console.log(`[Test] Filling Valid Bid: ${validBid}`);
  await input.fill(validBid.toString());
  
  // Verify error styling is gone
  await expect(input).not.toHaveClass(/bg-red-50/);
  
  // Click bid button - should trigger confirmation
  await bidBtn.click();
  await expect(bidBtn).toContainText('Confirm?', { timeout: 3000 });
  await bidBtn.click();
  
  await expect(bidBtn).toContainText('Bid Placed!', { timeout: 10000 });
});
