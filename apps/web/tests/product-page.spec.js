import { test, expect } from '@playwright/test';
import { mockSupabaseNetwork } from './helpers/mock-network';
import { loginUser } from './helpers/auth';

test('verify navigation to product page and bidding', async ({ page }) => {
  const itemId = '00000000-0000-0000-0000-000000000015';
  const itemSlug = 'persian-rug';
  await mockSupabaseNetwork(page);
  await loginUser(page);
  await page.goto('/');

  // Wait for the grid to load
  await page.waitForSelector(`#item-card-${itemId}`, { state: 'attached' });
  
  const itemCard = page.locator(`#item-card-${itemId}`);
  await expect(itemCard).toBeVisible({ timeout: 10000 });
  await itemCard.locator(`#item-card-${itemId}-title`).click();
  
  // Wait for modal to open
  const desktopDetailsBtn = page.locator(`#view-details-btn-${itemId}`);
  const mobileDetailsBtn = page.locator(`#view-details-btn-mobile-${itemId}`);
  const useMobile = await desktopDetailsBtn.isVisible().catch(() => false) === false;
  const viewDetailsBtn = useMobile ? mobileDetailsBtn : desktopDetailsBtn;
  await expect(viewDetailsBtn).toBeVisible();
  
  // Click View Full Details
  await viewDetailsBtn.click();
  
  // Verify URL
  await expect(page).toHaveURL(new RegExp(`/product/${itemSlug}`));
  
  // Verify page content
  await expect(page.locator(`#product-page-${itemId}`)).toBeVisible();
  
  // Verify bidding elements
  const bidInput = page.locator(`#product-page-${itemId}-bid-input`);
  await expect(bidInput).toBeVisible();
  
  const placeBidBtn = page.locator(`#product-page-${itemId}-place-bid-btn`);
  await expect(placeBidBtn).toBeVisible();
  
  // Perform a bid adjustment
  const initialValue = await bidInput.inputValue();
  const incrementBtn = page.locator(`#product-page-${itemId}-increment-btn`);
  await incrementBtn.dispatchEvent('pointerdown');
  await incrementBtn.dispatchEvent('pointerup');
  
  const newValue = await bidInput.inputValue();
  expect(parseFloat(newValue.replace(/,/g, ''))).toBeGreaterThan(parseFloat(initialValue.replace(/,/g, '')));
  
  // Place bid
  await placeBidBtn.click({ force: true });
  const confirmLabel = placeBidBtn.locator('text=Confirm?');
  const needsConfirm = await confirmLabel.isVisible({ timeout: 3000 }).catch(() => false);
  if (needsConfirm) {
    await placeBidBtn.click({ force: true });
  }
  
  // Verify success
  await expect(placeBidBtn).toContainText(/Bid Placed!|Update Bid/, { timeout: 10000 });
  
  // Take a screenshot for the walkthrough
  await page.screenshot({ path: 'product_page_preview.png', fullPage: true });
});
