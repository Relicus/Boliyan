
import { test, expect, type Locator } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

const clickBidWithConfirm = async (button: Locator) => {
  await button.click();
  const confirmLabel = button.locator('text=Confirm?');
  const needsConfirm = await confirmLabel.isVisible({ timeout: 3000 }).catch(() => false);
  if (needsConfirm) {
    await button.click();
  }
};

test.describe('Auction Lifecycle & Engagement', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser console logs at the very start
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    // MOCK NETWORK to bypass Auth/RLS blocks
    await mockSupabaseNetwork(page);

    // Navigate to local dev server and login as a test user
    // No email provided = auto-signup/login a unique test user
    await loginUser(page);
    
    await page.goto('/');
    // Wait for items to load and ensure they are visible
    await page.waitForSelector('[id^="item-card-"]', { state: 'visible', timeout: 15000 });
    
    // Log visible root cards for debugging
    const rootCards = page.locator('#marketplace-grid-container [id^="item-card-"]');
    const count = await rootCards.count();
    console.log(`Found ${count} actual item cards on landing page`);
  });

  test('should place a valid bid from the Item Card', async ({ page }) => {
    // Find the first biddable item card (not owned by us)
    const rootCards = page.locator('#marketplace-grid-container [id^="item-card-"]');
    const biddableCards = rootCards.filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    
    await expect(biddableCards.first()).toBeVisible({ timeout: 10000 });
    const itemCard = biddableCards.first();
    
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");

    const input = itemCard.locator(`#item-card-${itemId}-bid-input`);
    const bidBtn = itemCard.locator(`#item-card-${itemId}-place-bid-btn`);

    // Get initial value
    const initialValueStr = await input.inputValue();
    const initialValue = parseFloat(initialValueStr.replace(/,/g, ''));

  // Increment once
  await itemCard.locator(`#item-card-${itemId}-increment-btn`).dispatchEvent('pointerdown');
  await itemCard.locator(`#item-card-${itemId}-increment-btn`).dispatchEvent('pointerup');
  
  const incrementedValueStr = await input.inputValue();
    const incrementedValue = parseFloat(incrementedValueStr.replace(/,/g, ''));
    expect(incrementedValue).toBeGreaterThan(initialValue);

    // Place bid (handle double-tap confirmation if needed)
    await clickBidWithConfirm(bidBtn);

    // Verify success state
    await expect(bidBtn).toContainText(/Bid Placed!|Update Bid/, { timeout: 10000 });

    await expect.poll(async () => {
      const currentValue = await input.inputValue();
      return parseFloat(currentValue.replace(/,/g, ''));
    }, { timeout: 10000 }).toBeGreaterThan(incrementedValue);
  });

  test('should handle 70% minimum bid rule on Card', async ({ page }) => {
    const rootCards = page.locator('#marketplace-grid-container [id^="item-card-"]');
    const biddableCards = rootCards.filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    const itemCard = biddableCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");

    const input = itemCard.locator(`#item-card-${itemId}-bid-input`);
    const bidBtn = itemCard.locator(`#item-card-${itemId}-place-bid-btn`);

    // Read ask price from the rendered card
    const askPriceElement = itemCard.locator(`[id*="price-asking-value-"]`).first();
    const askPriceText = await askPriceElement.innerText();
    const askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, ''));
    console.log(`[Test] Item ${itemId} Ask Price: ${askPrice}`);
    
    const invalidBid = Math.floor(askPrice * 0.5); // 50% is definitely invalid

    await input.click();
    await input.fill(invalidBid.toString());

    await bidBtn.click();
    await expect(bidBtn).toContainText(/Min Rs\.|Below Min|Min Bid Reached/);
  });

  test('should place bid from Product Modal', async ({ page }) => {
    const rootCards = page.locator('#marketplace-grid-container [id^="item-card-"]');
    const biddableCards = rootCards.filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    const itemCard = biddableCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");
    
    // Open Modal by clicking the title or image
    await itemCard.locator(`#item-card-${itemId}-title`).click();
    
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    const modalBidBtn = dialog.locator(`#modal-item-card-${itemId}-place-bid-btn`);

  // Increment
  const modalIncrBtn = dialog.locator(`#modal-item-card-${itemId}-increment-btn`);
  await modalIncrBtn.dispatchEvent('pointerdown');
  await modalIncrBtn.dispatchEvent('pointerup');
  
    // Place bid
    await clickBidWithConfirm(modalBidBtn);

    // Verify success state in modal
    await expect(modalBidBtn).toContainText('Bid Placed!', { timeout: 10000 });
    console.log("Success message 'Bid Placed!' found in modal");
    
    // Close modal explicitly (auto-close is disabled)
    await dialog.locator(`#close-listing-btn-${itemId}`).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
    console.log("Modal closed successfully");
  });

  test('should toggle watchlist and show Indicator', async ({ page }) => {
    // Pick first item
    const rootCards = page.locator('#marketplace-grid-container [id^="item-card-"]');
    const itemCard = rootCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");
    
    // Open details to find watch button
    await itemCard.locator(`#item-card-${itemId}-title`).click();
    
    const watchBtn = page.locator(`#toggle-watch-btn-${itemId}`);
    await expect(watchBtn).toBeVisible();
    
    // Click Watch
    await watchBtn.click();
    await expect(watchBtn).toHaveAttribute('title', 'Remove from watchlist');
    
    // Close modal
    await page.locator(`#close-listing-btn-${itemId}`).click();

    // Check card watch button styling
    const cardWatchBtn = itemCard.locator(`#item-card-${itemId}-watch-btn`);
    await expect(cardWatchBtn).toHaveClass(/border-blue-400/);
  });


  test('should show "Already Winning" warning on double bid', async ({ page }) => {
    const rootCards = page.locator('#marketplace-grid-container [id^="item-card-"]');
    const biddableCards = rootCards.filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    const itemCard = biddableCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");

    const bidBtn = itemCard.locator(`#item-card-${itemId}-place-bid-btn`);
    const input = itemCard.locator(`#item-card-${itemId}-bid-input`);

    // 1. Place first bid
    const startingValueStr = await input.inputValue();
    const startingValue = parseFloat(startingValueStr.replace(/,/g, ''));

    await clickBidWithConfirm(bidBtn);
    // Verify success state
    await expect(bidBtn).toContainText(/Bid Placed!|Update Bid/, { timeout: 10000 });
    
    await expect.poll(async () => {
      const currentValue = await input.inputValue();
      return parseFloat(currentValue.replace(/,/g, ''));
    }, { timeout: 10000 }).toBeGreaterThan(startingValue);

    // Wait for success to clear (1500ms in hook)
    await page.waitForTimeout(2000);

    // 2. Click bid again (we are still high bidder)
    await bidBtn.click();

    // 3. Assert inline confirmation state
    await expect(bidBtn.locator('text=Confirm?')).toBeVisible();
  });
});
