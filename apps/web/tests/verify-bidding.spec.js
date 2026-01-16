import { test, expect } from '@playwright/test';

test('verify initial bid is 70% of ask price for items with 0 bids', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for the grid to load
  await page.waitForSelector('[id^="item-card-"]');
  
  // Find item with 0 bids. Item i15 has 0 bids in mock data.
  // We need to scroll or find it.
  const itemCard = page.locator('#item-card-i15');
  await itemCard.scrollIntoViewIfNeeded();
  
  const askPriceText = await page.locator('#item-card-i15-ask-price').innerText();
  const askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, '')) * 1000; // k format
  
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
  await decrementBtn.click({ force: true });
  await page.screenshot({ path: 'after-click.png' });
  
  // Wait for the value to change to 17,000 (17,500 - 500 step)
  await expect(bidInput).toHaveValue('17,000');
  
  // Should show error state (bg-red-50)
  await expect(bidInput).toHaveClass(/bg-red-50/);
  
  // Try to place bid (should be disabled or show error)
  const placeBidBtn = page.locator('#item-card-i15-place-bid-btn');
  await placeBidBtn.click();
  
  // Success message should NOT appear
  await expect(page.locator('#item-card-i15-success-msg')).not.toBeVisible();
});
