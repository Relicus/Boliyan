import { test, expect } from '@playwright/test';

test('check all listing images', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for the marketplace grid to be visible
  await page.waitForSelector('img');
  
  const images = await page.locator('img').all();
  console.log(`Found ${images.length} images`);
  
  const brokenImages = [];
  
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const src = await img.getAttribute('src');
    
    // Check if image is loaded by evaluating its naturalWidth in the browser
    const isLoaded = await img.evaluate((node: HTMLImageElement) => {
      return node.complete && node.naturalWidth > 0;
    });
    
    if (!isLoaded) {
      // Find the title - in MarketplaceGrid it's in an h3
      const card = img.locator('xpath=ancestor::div[contains(@class, "group")]');
      let title = alt || 'Unknown';
      if (await card.count() > 0) {
        const titleElement = card.locator('h3');
        if (await titleElement.count() > 0) {
          title = await titleElement.innerText();
        }
      }
      brokenImages.push({ title, src });
    }
  }
  
  if (brokenImages.length > 0) {
    console.log('Broken Images Found:');
    console.table(brokenImages);
  } else {
    console.log('All images loaded correctly!');
  }
  
  expect(brokenImages.length).toBe(0);
});
