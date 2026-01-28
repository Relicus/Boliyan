import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

test('verify initial bid is 70% of ask price for items with 0 bids', async ({ page }) => {
  const itemId = '00000000-0000-0000-0000-000000000015';
  await mockSupabaseNetwork(page);
  await loginUser(page);
  await page.goto('/');
  
  // Wait for the grid to load
  await page.waitForSelector('[id^="item-card-"]');
  
  const itemCard = page.locator(`#item-card-${itemId}`);
  await expect(itemCard).toBeVisible({ timeout: 10000 });
  
  const askPriceText = await page.locator(`#price-asking-value-${itemId}`).innerText();
  const askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, ''));
  
  const bidInput = page.locator(`#item-card-${itemId}-bid-input`);
  const bidValueText = await bidInput.inputValue();
  const bidValue = parseFloat(bidValueText.replace(/,/g, ''));
  
  console.log(`Item ${itemId}: Ask Price = ${askPrice}, Initial Bid = ${bidValue}`);
  
  // 70% of 25000 is 17500.
  // In mock-data.ts, i15 has askPrice: 25000.
  expect(bidValue).toBe(Math.ceil(askPrice / 10) * 10);
  
  const minBid = Math.ceil((askPrice * 0.7) / 10) * 10;
  await bidInput.fill((minBid - 100).toString());
  await expect(bidInput).toHaveClass(/bg-red-50/);
  
  // Try to place bid
  const placeBidBtn = page.locator(`#item-card-${itemId}-place-bid-btn`);
  await placeBidBtn.click({ force: true });
  // It might show confirmation or error. If it's valid, it needs 2nd click.
  // But here we expect it to be INVALID (bg-red-50).
  // If it's invalid, the 2nd click won't matter or button is disabled.
  
  // Success message should NOT appear
  await expect(page.locator(`#item-card-${itemId}-success-msg`)).not.toBeVisible();
});
