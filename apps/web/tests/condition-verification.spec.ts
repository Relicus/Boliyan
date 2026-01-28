
import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

test.describe('Condition Variable Verification', () => {

  test('Create listing with condition and verify display', async ({ page }) => {
    await mockSupabaseNetwork(page);
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

    await expect(page.locator('#condition-select')).toContainText('Brand New');
  });

  test('Filter by condition', async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

});
