import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test('verify initial bid is 70% of ask price for items with 0 bids', async ({ page }) => {
  await loginUser(page);
  await page.goto('/');
  
  // Wait for the grid to load
  await page.waitForSelector('[id^="item-card-"]');
  
  // Find item with 0 bids. Item i15 has 0 bids in mock data.
  // We need to scroll or find it.
  const itemCard = page.locator('#item-card-i15');
  await itemCard.scrollIntoViewIfNeeded();
  
  const askPriceText = await page.locator('#price-asking-value-i15').innerText();
  // Handle both "25k" and "Rs 25,000" formats
  let askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, ''));
  if (askPriceText.toLowerCase().includes('k')) {
      askPrice *= 1000;
  }
  
  const bidInput = page.locator('#item-card-i15-bid-input');
  const bidValueText = await bidInput.inputValue();
  const bidValue = parseFloat(bidValueText.replace(/,/g, ''));
  
  console.log(`Item i15: Ask Price = ${askPrice}, Initial Bid = ${bidValue}`);
  
  // 70% of 25000 is 17500.
  // In mock-data.ts, i15 has askPrice: 25000.
  expect(bidValue).toBe(Math.ceil(askPrice * 0.7 / 100) * 100);
  
  // Test decrement below 70%
  const decrementBtn = page.locator('#item-card-i15-decrement-btn');
  await page.screenshot({ path: 'before-click.png' });
  await decrementBtn.dispatchEvent('pointerdown');
  await decrementBtn.dispatchEvent('pointerup');
  await page.screenshot({ path: 'after-click.png' });
  
  // Wait for the value to change to 17,000 (17,500 - 500 step)
  await expect(bidInput).toHaveValue('17,000');
  
  // Should show error state (bg-red-50)
  await expect(bidInput).toHaveClass(/bg-red-50/);
  
  // Try to place bid
  const placeBidBtn = page.locator('#item-card-i15-place-bid-btn');
  await placeBidBtn.click();
  // It might show confirmation or error. If it's valid, it needs 2nd click.
  // But here we expect it to be INVALID (bg-red-50).
  // If it's invalid, the 2nd click won't matter or button is disabled.
  
  // Success message should NOT appear
  await expect(page.locator('#item-card-i15-success-msg')).not.toBeVisible();
});
