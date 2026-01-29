import { test } from '@playwright/test';

import { loginUser } from './helpers/auth';
import { gotoWithRetry } from './helpers/goto';
import { mockSupabaseNetwork } from './helpers/mock-network';

test('check dialog close button', async ({ page, isMobile }) => {
  if (isMobile) return;
  await mockSupabaseNetwork(page);
  await loginUser(page);
  await gotoWithRetry(page, '/');
  
  // Wait for item cards to load
  await page.waitForSelector('[id^="item-card-"]');
  
  // Click first card
  const firstCard = page.locator('[id^="item-card-"]').first();
  const itemId = (await firstCard.getAttribute('id'))?.replace('item-card-', '');
  if (!itemId) throw new Error('Missing item id');
  await firstCard.locator(`#item-card-${itemId}-title`).click();
  
  // Wait for dialog
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  
  // Take a screenshot
  await page.screenshot({ path: 'dialog_check.png' });
  
  // Get HTML of the dialog content
  const dialogContent = await page.innerHTML('[role="dialog"]');
  console.log(dialogContent);
});
