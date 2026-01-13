
import { test, expect } from '@playwright/test';

test('Smart Bidding Logic & UX Verification', async ({ page }) => {
  // 1. Navigate to Home
  await page.goto('http://localhost:3000/');
  
  // Wait for items to load
  await page.waitForSelector('img[alt]');

  // Locate the first Item Card that actually has a bidding input
  // (Avoids selecting other 'group' elements like categories or banners)
  const firstCard = page.locator('.group', { has: page.locator('input[type="number"]') }).first();
  
  // Ensure it's visible
  await expect(firstCard).toBeVisible();

  // Get the Asking Price or High Bid text to calculate expectations
  // We look for the "Asking" price since that's the base for calculating steps usually
  // But the logic uses High Bid if exists.
  // For simplicity, we will read the INITIAL value of the input.
  const input = firstCard.locator('input[type="number"]');
  await expect(input).toBeVisible();
  
  const initialValueStr = await input.inputValue();
  const initialValue = parseFloat(initialValueStr);
  console.log(`Initial Bid Value: ${initialValue}`);

  // Calculate Expected Step
  let step = 100;
  if (initialValue >= 100000) step = 1000;
  else if (initialValue >= 10000) step = 500;

  // 2. Test Card Stepper (+)
  // New Structure: 
  // Container (flex-col) 
  //   > Div (Stepper Row) > [Minus] [Input] [Plus]
  //   > Button (Place Bid)
  
  // 2. Test Card Stepper (+)
  // New Structure: 
  // Container (flex-col) 
  //   > Div (Stepper Row) > [Minus] [Input] [Plus]
  //   > Button (Place Bid)
  
  // Input is already defined above: const input = firstCard.locator('input[type="number"]');
  await expect(input).toBeVisible({ timeout: 10000 }); // Increase timeout for hydration
  
  // Find the stepper row container (parent of input)
  const stepperRow = firstCard.locator('.shadow-sm', { has: input });
  
  const minusBtn = stepperRow.locator('button').first();
  const plusBtn = stepperRow.locator('button').last();

  // Use force: true because the card itself is a DialogTrigger and sometimes overlay hit-testing can be flaky
  await plusBtn.click({ force: true });
  const incrementedValue = parseFloat(await input.inputValue());
  expect(incrementedValue).toBe(initialValue + step);

  // 3. Test Card Stepper (-)
  await minusBtn.click({ force: true });
  const decrementedValue = parseFloat(await input.inputValue());
  expect(decrementedValue).toBe(initialValue);

  // 4. Test Click Input
  await input.click();
  await expect(page.locator('div[role="dialog"]')).toHaveCount(0);

  // 5. Open Modal
  await firstCard.locator('img').first().click();
  
  const dialog = page.locator('div[role="dialog"]');
  await expect(dialog).toBeVisible();

  // 6. Test Modal Stepper
  const modalInput = dialog.locator('input[type="number"]');
  const modalInitialValue = parseFloat(await modalInput.inputValue());
  
  const modalInputGroup = dialog.locator('.shadow-sm', { has: modalInput });
  const modalMinusBtn = modalInputGroup.locator('button').nth(0);
  const modalPlusBtn = modalInputGroup.locator('button').nth(1);

  await modalPlusBtn.click();
  const modalIncrementedStr = await modalInput.inputValue();
  expect(parseFloat(modalIncrementedStr)).toBe(modalInitialValue + step);

  // 7. Test Bid Submission
  // Button text is now "Bid" or "Place Bid" depending on context. 
  // In modal it is just "Bid".
  const bidBtn = dialog.locator('button', { hasText: 'Bid' }).last(); // Ensure we get the button
  await bidBtn.click();
  
  await expect(dialog).not.toBeVisible();
});
