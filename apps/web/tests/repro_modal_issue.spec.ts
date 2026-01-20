import { test, expect } from '@playwright/test';

test('reproduce product modal not opening', async ({ page }) => {
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:3000');
  
  // Wait for item cards to load
  console.log('Waiting for item cards...');
  await page.waitForSelector('[id^="item-card-"]', { timeout: 10000 });
  
  const cardId = await page.evaluate(() => {
    const card = document.querySelector('[id^="item-card-"]');
    return card ? card.id : null;
  });
  
  console.log(`Found card with ID: ${cardId}`);
  expect(cardId).not.toBeNull();

  // Click the card
  console.log(`Clicking card ${cardId}...`);
  await page.click(`#${cardId}`);
  
  // Check if dialog is visible
  console.log('Checking for dialog...');
  try {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    console.log('SUCCESS: Dialog is visible');
  } catch (e) {
    console.log('FAILURE: Dialog did not open');
    
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'repro_failure.png' });
    throw e;
  }
});
