import { test } from '@playwright/test';

import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork } from './helpers/mock-network';
import { ensureRouteReady } from './helpers/page-ready';
import { SMOKE_ROUTES } from './helpers/route-map';

const publicRoutes = SMOKE_ROUTES.filter(route => !route.requiresAuth);
const authedRoutes = SMOKE_ROUTES.filter(route => route.requiresAuth);

test.describe('Full site smoke', () => {
  test.describe('Public routes', () => {
    for (const route of publicRoutes) {
      test(route.name, async ({ page }) => {
        await mockSupabaseNetwork(page);
        await page.goto(route.path);
        await ensureRouteReady(page, route);
      });
    }
  });

  test.describe('Authed routes', () => {
    for (const route of authedRoutes) {
      test(route.name, async ({ page }) => {
        await mockSupabaseNetwork(page);
        await loginUser(page);
        await page.goto(route.path);
        await ensureRouteReady(page, route);
      });
    }
  });
});
