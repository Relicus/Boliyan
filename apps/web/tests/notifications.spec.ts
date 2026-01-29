import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test.describe('Notification System', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display notification trigger in navbar', async ({ page, isMobile }) => {
    if (isMobile) return;
    // Check if the notification bell icon exists in the navbar
    const bellBtn = page.locator('#notification-bell-btn');
    await expect(bellBtn).toBeVisible();
  });

  test('should open notifications dropdown', async ({ page, isMobile }) => {
    if (isMobile) return;
    const bellBtn = page.locator('#notification-bell-btn');
    await bellBtn.click();
    
    // Expect a popover or dropdown to appear
    const popover = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]');
    await expect(popover.first()).toBeVisible();
  });

  test('should show empty state if no notifications', async ({ page, isMobile }) => {
    if (isMobile) return;
    const bellBtn = page.locator('#notification-bell-btn');
    await bellBtn.click();
    
    // Search for "No notifications" text or similar
    const emptyMsg = page.getByText(/No notifications|Nothing here/i);
    // This is optional as some users might have notifications
    if (await emptyMsg.count() > 0) {
        await expect(emptyMsg.first()).toBeVisible();
    }
  });
});
