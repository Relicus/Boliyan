import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

test('Smart Bidding Logic & UX Verification', async ({ page }) => {
  // 1. Login first (Required by new RLS policies)
  await mockSupabaseNetwork(page);
  await loginUser(page);
  
  // 2. Navigate to Home (should already be there after loginUser)
  await page.goto('/');
  
  // Wait for items to load
  await page.waitForSelector('img[alt]');


  // Locate the first Item Card that actually has a bidding input
  // (Avoids selecting other 'group' elements like categories or banners)
  const firstCard = page.locator('#marketplace-grid-container [id^="item-card-"]').filter({
    has: page.locator('button[id$="-place-bid-btn"]:not([disabled])')
  }).first();
  
  // Ensure it's visible
  await expect(firstCard).toBeVisible();

  // Get the Asking Price or High Bid text to calculate expectations
  const input = firstCard.locator('input[id*="bid-input"]');
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled();
  
  const initialValueStr = await input.inputValue();
  // Handle comma-separated values (e.g. "1,200")
  const initialValue = parseFloat(initialValueStr.replace(/,/g, ''));
  console.log(`Initial Bid Value: ${initialValue}`);

  // Calculate Expected Step
  let step = 100;
  if (initialValue >= 100000) step = 1000;
  else if (initialValue >= 10000) step = 500;

  // 2. Test Card Stepper (+)
  await expect(input).toBeVisible({ timeout: 10000 }); // Increase timeout for hydration
  
  // Find the stepper row container (parent of input)
  // Test Card Stepper (+)
  const plusBtn = firstCard.locator('button[id*="increment-btn"]');
  // Use dispatchEvent to trigger pointer events used for long-press logic
  await plusBtn.dispatchEvent('pointerdown');
  await plusBtn.dispatchEvent('pointerup');
  
  const incrementedValueStr = await input.inputValue();
  const incrementedValue = parseFloat(incrementedValueStr.replace(/,/g, ''));
  expect(incrementedValue).toBe(initialValue + step);

  // 3. Test Card Stepper (-)
  const minusBtn = firstCard.locator('button[id*="decrement-btn"]');
  await minusBtn.dispatchEvent('pointerdown');
  await minusBtn.dispatchEvent('pointerup');
  const decrementedValueStr = await input.inputValue();
  const decrementedValue = parseFloat(decrementedValueStr.replace(/,/g, ''));
  expect(decrementedValue).toBe(initialValue);

  // 4. Test Click Input
  await input.click({ force: true });
  await expect(page.locator('div[role="dialog"]')).toHaveCount(0);

  // 5. Open Modal
  await firstCard.locator('img').first().click();
  
  const dialog = page.locator('div[role="dialog"]');
  await expect(dialog).toBeVisible();

  // 6. Test Modal Stepper
  const modalInput = dialog.locator('input[id$="-bid-input"]');
  const modalInitialValueStr = await modalInput.inputValue();
  const modalInitialValue = parseFloat(modalInitialValueStr.replace(/,/g, ''));
  
  const modalPlusBtn = dialog.locator('button[id^="modal-item-card-"][id$="-increment-btn"]');

  await modalPlusBtn.dispatchEvent('pointerdown');
  await modalPlusBtn.dispatchEvent('pointerup');
  const modalIncrementedStr = await modalInput.inputValue();
  expect(parseFloat(modalIncrementedStr.replace(/,/g, ''))).toBe(modalInitialValue + step);

  // 7. Test Bid Submission
  // Button text is now "Bid" or "Place Bid" depending on context. 
  // In modal it is just "Bid".
  const bidBtn = dialog.locator('button[id^="modal-item-card-"][id$="-place-bid-btn"]');
  await bidBtn.click({ force: true });
  const confirmLabel = bidBtn.locator('text=Confirm?');
  const needsConfirm = await confirmLabel.isVisible({ timeout: 3000 }).catch(() => false);
  if (needsConfirm) {
    await bidBtn.click({ force: true });
  }

  const successMsg = bidBtn.locator('[id$="-success-msg"]');
  await expect
    .poll(async () => {
      const successVisible = await successMsg.isVisible().catch(() => false);
      if (successVisible) return 'Bid Placed!';
      return (await bidBtn.innerText()).trim();
    }, { timeout: 10000 })
    .toMatch(/Bid Placed!|Update Bid/);
});
