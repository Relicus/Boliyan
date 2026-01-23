import { test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Boliyan Feature Discovery Script
 * Automatically crawls the application to identify:
 * 1. Routes and Links
 * 2. Interactive Elements (Buttons, Inputs) with IDs
 */

interface DiscoveredElement {

  id: string;
  tagName: string;
  text?: string;
  type?: string;
  placeholder?: string;
}

interface DiscoveredFeature {
  route: string;
  title: string;
  interactiveElements: DiscoveredElement[];
}

const discoveredFeatures = {
  routes: new Set<string>(),
  elements: [] as DiscoveredFeature[],
  errors: [] as string[]
};

test('Programmatic Feature Discovery', async ({ page, baseURL }) => {
  const targetUrl = baseURL || 'http://localhost:3000';
  await page.goto(targetUrl);
  discoveredFeatures.routes.add('/');
  
  await scrapePage(page, '/');

  const links = await page.locator('a').all();
  for (const link of links) {
    const href = await link.getAttribute('href');
    if (href && href.startsWith('/') && !href.includes('#')) {
      discoveredFeatures.routes.add(href);
    }
  }

  for (const route of Array.from(discoveredFeatures.routes)) {
    if (route === '/') continue;
    try {
      await page.goto(`${targetUrl}${route}`);
      await scrapePage(page, route);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      discoveredFeatures.errors.push(`Error on ${route}: ${message}`);
    }
  }


  const reportPath = path.join(process.cwd(), 'feature_discovery_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    routes: Array.from(discoveredFeatures.routes),
    elements: discoveredFeatures.elements,
    errors: discoveredFeatures.errors
  }, null, 2));
});

async function scrapePage(page: Page, route: string) {
  const title = await page.title();
  const elementsWithId = await page.locator('[id]').evaluateAll((els) => 
    els.map((el: any) => ({
      id: el.id,
      tagName: el.tagName,
      text: el.innerText?.substring(0, 50),
      type: el.type || undefined,
      placeholder: el.placeholder || undefined
    }))
  );

  discoveredFeatures.elements.push({
    route,
    title,
    interactiveElements: elementsWithId
  });
}
