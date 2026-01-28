
import { test, expect } from '@playwright/test';

test('Verify Price Formatting Rules', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('img[alt]');

  // View modes: compact, comfortable, spacious
  const modes = [
    { id: 'comfortable', label: 'Comfortable View' },
    { id: 'compact', label: 'Compact View' },
    { id: 'spacious', label: 'Spacious View' }
  ];

  for (const { id, label } of modes) {
    // Switch to view mode using accessible name (Playwright Best Practice)
    const modeToggle = page.getByRole('radio', { name: label });
    if (!(await modeToggle.isVisible().catch(() => false))) {
      continue;
    }
    await modeToggle.click();
    await page.waitForTimeout(1000); // Wait for Framer Motion transitions

    // Locate first item card price - looking for the text content
    const askPrice = page.locator('div[id^="item-card-"] [id^="price-asking-value-"]').first();
    const priceText = await askPrice.innerText();

    console.log(`Mode: ${id}, Price: ${priceText}`);

    if (id === 'comfortable' || id === 'spacious') {
      // Should NOT have 'k' OR 'M' (Boliyan Standard: Full prices for premium feel)
      expect(priceText).not.toMatch(/[kM]$/);
      // Should have commas for numbers >= 1000
      if (parseInt(priceText.replace(/,/g, '')) >= 1000) {
        expect(priceText).toContain(',');
      }
    } else if (id === 'compact') {
      // In compact, should be full price UNLESS >= 100M
      const numericPrice = parseInt(priceText.replace(/[,M]/g, ''));
      if (priceText.endsWith('M')) {
         expect(numericPrice).toBeGreaterThanOrEqual(100);
      } else {
         expect(priceText).not.toContain('k');
      }
    }
  }

  // Open a modal and verify full price
  const firstItem = page.locator('div[id^="item-card-"]').first();
  const itemId = (await firstItem.getAttribute('id'))?.replace('item-card-', '');
  if (!itemId) throw new Error('Missing item id');
  await firstItem.locator(`#item-card-${itemId}-title`).click();
  await expect(page.locator('div[role="dialog"]')).toBeVisible();
  
  // Modal price should be full numeric
  const dialog = page.locator('div[role="dialog"]');
  const modalPriceById = dialog.locator(`#price-asking-value-${itemId}`).first();
  let modalText = '';

  if (await modalPriceById.isVisible().catch(() => false)) {
    modalText = await modalPriceById.innerText();
  } else {
    const askingBlock = dialog.getByText('Asking').first().locator('..');
    const modalPriceFallback = askingBlock.locator('span').nth(1);
    await expect(modalPriceFallback).toBeVisible();
    modalText = await modalPriceFallback.innerText();
  }
  console.log(`Modal Price: ${modalText}`);
  
  expect(modalText).not.toMatch(/[kM]$/);
  if (parseInt(modalText.replace(/,/g, '')) >= 1000) {
    expect(modalText).toContain(',');
  }
});
