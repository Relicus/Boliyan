
import { test, expect } from '@playwright/test';
import { mockSupabaseNetwork, MOCK_USER_ID, MOCK_EMAIL } from './helpers/mock-network';
import { loginUser } from './helpers/auth';

test.describe('Admin Moderation Flows', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Setup Network Mocks
    await mockSupabaseNetwork(page);
    
    // 2. Mock Reports
    await page.route(/\/rest\/v1\/reports.*/, async route => {
        await route.fulfill({ 
            json: [
                {
                    id: 'report-1',
                    reporter_id: 'user-1',
                    reported_id: 'user-2',
                    listing_id: 'listing-1',
                    reason: 'Harassment',
                    details: 'User is being mean',
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    reporter: { full_name: 'Reporter User' },
                    reported: { full_name: 'Bad User' },
                    listing: { title: 'Suspicious Item' }
                }
            ]
        });
    });

    // 3. Login as Admin
    await loginUser(page, 'admin-tester@demo.com');
  });

  test('should allow admin to visit reports page', async ({ page }) => {
    // Verify Admin Toggle is visible in Navbar
    await page.locator('#navbar-avatar-18').click();
    const adminToggle = page.locator('#navbar-admin-toggle');
    await expect(adminToggle).toBeVisible();
    
    // Toggle Admin Mode
    await adminToggle.click();
    
    // Check for Admin Navigation in Navbar
    const reportsBtn = page.locator('#navbar-admin-reports-btn');
    await expect(reportsBtn).toBeVisible();
    
    // Navigate to Reports
    await reportsBtn.click();
    await expect(page).toHaveURL(/\/admin\/reports/);
    
    // Verify report list
    await expect(page.locator('text=Suspicious Item')).toBeVisible();
    await expect(page.locator('text=Bad User')).toBeVisible();
  });
});
