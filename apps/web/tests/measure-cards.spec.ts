import { test, expect } from '@playwright/test';

test('measure card heights', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'log') console.log(`BROWSER: ${msg.text()}`);
  });

  await page.goto('http://localhost:3000');
  
  // Wait for items to load
  await page.waitForSelector('[id^="item-card-"]');
  
  const cards = await page.evaluate(() => {
    const results: any[] = [];
    
    // Find Item Cards
    const itemCards = document.querySelectorAll('[id^="item-card-"][id$="-title"]');
    itemCards.forEach(title => {
      const card = title.closest('.group');
      if (card) {
        const rect = card.getBoundingClientRect();
        const id = card.id ? card.id : 'no-id';
        // Check if it's public or secret - look for "Secret" badge if it exists
        const isSecret = card.textContent?.includes('Secret');
        const type = isSecret ? 'secret' : 'public';
        results.push({ id, type, height: rect.height, width: rect.width });
      }
    });
    
    // Find Ad Cards
    const adCards = document.querySelectorAll('[id^="ad-card-"]');
    adCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      results.push({ id: card.id, type: 'ad', height: rect.height, width: rect.width });
    });
    
    console.log('RESULTS_START');
    console.log(JSON.stringify(results));
    console.log('RESULTS_END');
    return results;
  });
});

