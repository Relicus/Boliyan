
import { test, expect } from '@playwright/test';
import { mockSupabaseNetwork, MOCK_USER_ID, MOCK_EMAIL } from './helpers/mock-network';
import { loginUser } from './helpers/auth';

test.describe('Profile Management & Reviews', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Setup Network Mocks
    await mockSupabaseNetwork(page);
    
    // 2. Custom Mocks for Profile Tests
    // Mock Profile Update (PATCH)
    await page.route(/\/rest\/v1\/profiles.*/, async route => {
        const method = route.request().method();
        if (method === 'PATCH') {
            const data = route.request().postDataJSON();
            // Echo back success
            await route.fulfill({ status: 200, json: [{ ...data, id: MOCK_USER_ID }] }); 
            console.log('[Test] Captured Profile Update:', data);
        } else {
            // Fallback to default mock (GET)
             // Check if it's a specific GET or general
             // For simplicity, we assume the default mock in mock-network handles GET.
             // But we can override it here if needed.
             // If the default mock continues, we don't need to do anything, 
             // BUT `route.continue()` inside a `page.route` that overlaps with another might be tricky.
             // Playwright handlers execute in reverse order of registration.
             // So this handler (registered LAST) runs FIRST.
             // If we don't handle it, we must `fallback` or let it pass?
             // `route.fallback()` passes to the next handler.
             await route.fallback();
        }
    });

    // Mock Reviews
    await page.route(/\/rest\/v1\/reviews.*/, async route => {
        const method = route.request().method();
        const url = route.request().url();
        
        if (method === 'POST') {
             // Submit Review
             const data = route.request().postDataJSON();
             await route.fulfill({ status: 201, json: [{ id: 'rev-new', ...data }] });
        } else if (method === 'GET') {
             // Fetch Reviews
             await route.fulfill({ json: [
                 {
                     id: 'rev-1',
                     reviewer_id: 'other-user',
                     reviewed_id: MOCK_USER_ID,
                     rating: 5,
                     content: "Great buyer!",
                     role: 'seller', // The reviewer was a seller
                     created_at: new Date().toISOString(),
                     reviewer: { name: 'Seller One', avatar_url: '' },
                     listing: { title: 'Camera' }
                 }
             ]});
        }
    });

    // 3. Login
    await loginUser(page, MOCK_EMAIL);
    await expect(page).toHaveURL('/');
  });

  test('should allow user to update profile', async ({ page }) => {
    await page.goto('/profile');
    
    // Check initial state (Edit Button should be visible)
    const editBtn = page.locator('#edit-profile-btn');
    await expect(editBtn).toBeVisible();

    // Click Edit
    await editBtn.click();
    
    // Change Name (Bio not editable in UI yet)
    // await page.getByLabel('Name').fill('Mock User Updated'); // Locator might be flaky
    await page.locator('#name-input').fill('Mock User Updated');
    
    // Setup request intercept to verify API call
    const requestPromise = page.waitForRequest(req => req.url().includes('/rest/v1/profiles') && req.method() === 'PATCH');
    
    await page.locator('#save-profile-btn').click();
    
    const request = await requestPromise;
    expect(request.postDataJSON()).toMatchObject({ full_name: 'Mock User Updated' });
    
    // Verify UI updated (optimistically or via fetch)
    await expect(page.locator('h2').filter({ hasText: 'Mock User Updated' })).toBeVisible();
  });

  test('should display reputation and reviews', async ({ page }) => {
    // Navigate to OWN profile
    await page.goto(`/profile`);
    
    // Verify Reputation Stats (calculated from mock reviews/profile stats) in the Header Badge
    const badge = page.locator('.bg-amber-50');
    await expect(badge).toBeVisible();
    
    // Match "5" or "5.0" and "(10 reviews)"
    await expect(page.getByText(/5(\.0)?\s*\(\s*10\s*reviews\s*\)/)).toBeVisible();
    
    // Click Reviews Tab
    await page.getByRole('tab', { name: 'Reviews' }).click();
    
    // Verify Review List
    await expect(page.locator('text=Great buyer!')).toBeVisible();
    await expect(page.locator('text=Seller One')).toBeVisible();
  });
});
