
import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test.describe('Condition Variable Verification', () => {

  test('Create listing with condition and verify display', async ({ page }) => {
    await loginUser(page);
    await page.goto('http://localhost:3000/list');

    const title = `Test Condition Item ${Date.now()}`;
    await page.fill('#title-input', title);
    
    // Select Category
    await page.click('#category-select');
    await page.click('text=Electronics');
    
    // Fill Price
    await page.fill('#price-input', '1000');
    
    // Select Condition: Brand New
    await page.click('#condition-select');
    await page.click('text=🌟 Brand New');

    await page.setInputFiles('#image-upload-input', 'public/arda-glyph.png');

    await page.fill('#description-textarea', 'This is a test listing with enough description length.');
    await page.getByRole('button', { name: 'Help me price this item' }).click();
    await page.fill('#purchase-price-input', '5000');
    await page.click('#purchase-year-select');
    await page.getByRole('option').first().click();
    await page.fill('#price-input', '1000');
    await page.fill('#listing-phone-input', '03001234567');
    
    // Submit
    await page.click('#post-listing-btn');

    await page.waitForURL('http://localhost:3000/');

    await page.goto('http://localhost:3000/dashboard?tab=listings');
    const listingTitle = page.locator('[id^="listing-title-"]', { hasText: title });
    await expect(listingTitle).toBeVisible();
    await expect(listingTitle.locator('..').locator('text=🌟 New')).toBeVisible();
  });

  test('Filter by condition', async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

});
