
import { test, expect } from '@playwright/test';

test('Smart Bidding Logic & UX Verification', async ({ page }) => {
  // 1. Navigate to Home
  await page.goto('/');
  
  // Wait for items to load
  await page.waitForSelector('img[alt]');

  // Locate the first Item Card that actually has a bidding input
  // (Avoids selecting other 'group' elements like categories or banners)
  const firstCard = page.locator('.group', { has: page.locator('input[id*="bid-input"]') }).first();
  
  // Ensure it's visible
  await expect(firstCard).toBeVisible();

  // Get the Asking Price or High Bid text to calculate expectations
  const input = firstCard.locator('input[id*="bid-input"]');
  await expect(input).toBeVisible();
  
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
  // Use force: true to avoid overlay issues
  await plusBtn.click({ force: true });
  
  const incrementedValueStr = await input.inputValue();
  const incrementedValue = parseFloat(incrementedValueStr.replace(/,/g, ''));
  expect(incrementedValue).toBe(initialValue + step);

  // 3. Test Card Stepper (-)
  const minusBtn = firstCard.locator('button[id*="decrement-btn"]');
  await minusBtn.click({ force: true });
  const decrementedValueStr = await input.inputValue();
  const decrementedValue = parseFloat(decrementedValueStr.replace(/,/g, ''));
  expect(decrementedValue).toBe(initialValue);

  // 4. Test Click Input
  await input.click();
  await expect(page.locator('div[role="dialog"]')).toHaveCount(0);

  // 5. Open Modal
  await firstCard.locator('img').first().click();
  
  const dialog = page.locator('div[role="dialog"]');
  await expect(dialog).toBeVisible();

  // 6. Test Modal Stepper
  const modalInput = dialog.locator('input[type="text"]');
  const modalInitialValueStr = await modalInput.inputValue();
  const modalInitialValue = parseFloat(modalInitialValueStr.replace(/,/g, ''));
  
  const modalMinusBtn = dialog.locator('button[id*="modal-decrement-btn"]');
  const modalPlusBtn = dialog.locator('button[id*="modal-increment-btn"]');

  await modalPlusBtn.click();
  const modalIncrementedStr = await modalInput.inputValue();
  expect(parseFloat(modalIncrementedStr.replace(/,/g, ''))).toBe(modalInitialValue + step);

  // 7. Test Bid Submission
  // Button text is now "Bid" or "Place Bid" depending on context. 
  // In modal it is just "Bid".
  const bidBtn = dialog.locator('button', { hasText: 'Bid' }).last(); // Ensure we get the button
  await bidBtn.click();
  
  await expect(dialog).not.toBeVisible();
});
