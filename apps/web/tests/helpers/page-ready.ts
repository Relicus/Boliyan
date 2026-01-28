import { expect, Page } from '@playwright/test';

import type { SmokeRoute } from './route-map';

export async function ensureRouteReady(page: Page, route: SmokeRoute) {
  await expect(page.locator(route.readySelector).first()).toBeVisible({ timeout: 20000 });
}
