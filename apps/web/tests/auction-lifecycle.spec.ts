
import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

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
    
    // Log visible root cards for debugging (avoid greedy sub-element IDs)
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
    const count = await rootCards.count();
    console.log(`Found ${count} actual item cards on landing page`);
  });

  test('should place a valid bid from the Item Card', async ({ page }) => {
    // Find the first biddable item card (not owned by us)
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
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
    await itemCard.locator(`#item-card-${itemId}-increment-btn`).click();
    
    const incrementedValueStr = await input.inputValue();
    const incrementedValue = parseFloat(incrementedValueStr.replace(/,/g, ''));
    expect(incrementedValue).toBeGreaterThan(initialValue);

    // Place bid (Component logic might show a warning if already high bidder)
    await bidBtn.click();

    // Handle "Already Winning" Warning safely
    try {
        const confirmBtn = page.getByRole('button', { name: 'Confirm Bid' });
        await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
        console.log('[Test] identified "Already Winning" dialog. Confirming...');
        await confirmBtn.click();
    } catch (e) {
        // No warning appeared, proceed normal
    }
    // Verify success state (Card might cycle states, so check for Success Msg OR High Bidder status)
    // We re-select the card by ID directly to avoid filter issues (e.g. if button becomes disabled or text changes)
    const updatedCard = page.locator(`#item-card-${itemId}`);
    await expect(updatedCard).toHaveClass(/p-\[3.5px\]/); // Halo style adds padding
    
    // Optional: Check text if stable
    // await expect(itemCard.locator(`#item-card-${itemId}-success-msg`)).toBeVisible();
  });

  test('should handle 70% minimum bid rule on Card', async ({ page }) => {
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
    const biddableCards = rootCards.filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    const itemCard = biddableCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");

    const input = itemCard.locator(`#item-card-${itemId}-bid-input`);
    const bidBtn = itemCard.locator(`#item-card-${itemId}-place-bid-btn`);

    // Get ask price to calculate <70%
    const askPriceElement = itemCard.locator(`#item-card-${itemId}-ask-price`);
    const askPriceText = await askPriceElement.innerText();
    const askPrice = parseFloat(askPriceText.replace(/[^0-9.]/g, ''));
    
    const invalidBid = Math.floor(askPrice * 0.5); // 50% is definitely invalid

    await input.fill(invalidBid.toString());
    
    // Verify error styling (shaking/red code logic in ItemCard.tsx)
    await expect(input).toHaveClass(/bg-red-50/);

    // Click bid - should not succeed
    await bidBtn.click();
    await expect(itemCard.locator(`#item-card-${itemId}-success-msg`)).not.toBeVisible();
  });

  test('should place bid from Product Modal', async ({ page }) => {
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
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
    await dialog.locator(`#modal-item-card-${itemId}-increment-btn`).click();
    
    // Place bid
    await modalBidBtn.click();

    // Verify success state in modal
    await expect(dialog.locator('text=Placed!')).toBeVisible({ timeout: 10000 });
    console.log("Success message 'Placed!' found in modal");
    
    // Modal should close after success (logic in useBidding.ts: onBidSuccess after 1500ms)
    // We add a little extra time for the exit animation
    await expect(dialog).toBeHidden({ timeout: 15000 });
    console.log("Modal closed successfully");
  });

  test('should toggle watchlist and show Blue Halo', async ({ page }) => {
    // Pick first item
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
    const itemCard = rootCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");
    
    // Open details to find watch button
    await itemCard.locator(`#item-card-${itemId}-title`).click();
    
    const watchBtn = page.locator(`#toggle-watch-btn-${itemId}`);
    await expect(watchBtn).toBeVisible();
    
    // Click Watch
    await watchBtn.click();
    await expect(watchBtn).toContainText('Watching');
    
    // Close modal
    await page.locator(`#close-listing-btn-${itemId}`).click();
    
    // Verify Blue Halo on card
    await expect(itemCard).toHaveClass(/p-\[3.5px\]/);
    // Check for blue indicator icon on card
    await expect(itemCard.locator(`#item-card-${itemId}-watch-indicator`)).toBeVisible();
  });

  test('should show "Already Winning" warning on double bid', async ({ page }) => {
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
    const biddableCards = rootCards.filter({
      has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
    });
    const itemCard = biddableCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");

    const bidBtn = itemCard.locator(`#item-card-${itemId}-place-bid-btn`);

    // 1. Place first bid
    await bidBtn.click();
    await expect(itemCard.locator(`#item-card-${itemId}-success-msg`)).toBeVisible();

    // Wait for success to clear (1500ms in hook)
    await page.waitForTimeout(2000);

    // 2. Click bid again (we are still high bidder)
    await bidBtn.click();

    // 3. Assert Warning Dialog
    const warningDialog = page.locator('div[role="dialog"]').last(); // Warning is usually the latest dialog
    await expect(warningDialog.locator('text=Already Winning')).toBeVisible();
    await expect(warningDialog.locator('text=Confirm Bid')).toBeVisible();

    // 4. Cancel warning
    await warningDialog.locator('text=Cancel').click();
    await expect(warningDialog).not.toBeVisible();
  });
});
