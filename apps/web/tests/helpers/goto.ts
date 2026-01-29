import type { Page } from '@playwright/test';

export async function gotoWithRetry(page: Page, url: string, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}
