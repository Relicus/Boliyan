import { test } from '@playwright/test';

import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';

test('check dialog close button', async ({ page }) => {
  await mockSupabaseNetwork(page);
  await loginUser(page);
  await page.goto('/');
  
  // Wait for item cards to load
  await page.waitForSelector('[id^="item-card-"]');
  
  // Click first card
  const cards = await page.$$('[id^="item-card-"]');
  await cards[0].click();
  
  // Wait for dialog
  await page.waitForSelector('[role="dialog"]');
  
  // Take a screenshot
  await page.screenshot({ path: 'dialog_check.png' });
  
  // Get HTML of the dialog content
  const dialogContent = await page.innerHTML('[role="dialog"]');
  console.log(dialogContent);
});
