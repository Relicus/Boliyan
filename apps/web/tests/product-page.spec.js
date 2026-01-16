import { test, expect } from '@playwright/test';

test('verify navigation to product page and bidding', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for the grid to load
  await page.waitForSelector('[id^="item-card-"]');
  
  // Click on an item to open modal. Item i15 (iPhone) is not owned by u1.
  const itemCard = page.locator('#item-card-i15');
  await itemCard.click();
  
  // Wait for modal to open
  const viewDetailsBtn = page.locator('#item-card-view-details-btn-i15');
  await expect(viewDetailsBtn).toBeVisible();
  
  // Click View Full Details
  await viewDetailsBtn.click();
  
  // Verify URL
  await expect(page).toHaveURL(/.*\/product\/i15/);
  
  // Verify page content
  await expect(page.locator('h1')).toContainText('Persian Rug');
  
  // Verify bidding elements
  const bidInput = page.locator('#bid-input');
  await expect(bidInput).toBeVisible();
  
  const placeBidBtn = page.locator('#place-bid-btn');
  await expect(placeBidBtn).toBeVisible();
  
  // Perform a bid adjustment
  const initialValue = await bidInput.inputValue();
  const incrementBtn = page.locator('#increment-bid-btn');
  await incrementBtn.click();
  
  const newValue = await bidInput.inputValue();
  expect(parseFloat(newValue.replace(/,/g, ''))).toBeGreaterThan(parseFloat(initialValue.replace(/,/g, '')));
  
  // Place bid
  await placeBidBtn.click();
  
  // Verify success
  await expect(page.locator('#place-bid-btn')).toContainText(/Placed!/);
  
  // Take a screenshot for the walkthrough
  await page.screenshot({ path: 'product_page_preview.png', fullPage: true });
});
