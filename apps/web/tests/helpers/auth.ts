import { Page, expect } from '@playwright/test';

export async function loginUser(page: Page, email?: string, password = 'password123') {
  const testEmail = email || `e2e-${Date.now()}@demo.com`;
  console.log(`[loginUser] Attempting login/signup for ${testEmail}`);
  
  await page.goto('/signin');
  await page.locator('#email-input').fill(testEmail);
  await page.locator('#password-input').fill(password);
  await page.locator('#signin-submit-btn').click();
  
  // Wait for login success (Avatar appearing) or error message
  try {
    // If we see the avatar, we're good. Increase timeout to 10s for hydration.
    await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 10000 });
    console.log(`[loginUser] Login successful for ${testEmail}`);
  } catch (err) {
    // Check if it's an unconfirmed email or invalid credentials
    const errorLog = page.locator('text=Email not confirmed');
    const invalidCredsLog = page.locator('text=Invalid login credentials');
    
    if (await errorLog.isVisible() || await invalidCredsLog.isVisible() || page.url().includes('/signin')) {
      console.log(`[loginUser] Login failed for ${testEmail}, attempting signup...`);
      await page.goto('/signup');
      await page.locator('#name-input').fill('Test E2E');
      await page.locator('#email-input').fill(testEmail);
      await page.locator('#phone-input').fill('03001234567');
      await page.locator('#password-input').fill(password);
      await page.locator('#confirm-password-input').fill(password);
      
      // Select city
      await page.locator('#city-select').click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      await page.locator('#signup-submit-btn').click();
      
      // Post-signup: Wait for redirect or success state
      console.log('[loginUser] Waiting for auth transition...');
      
      // Instead of waiting for URL (which might be slow), wait for the avatar
      try {
        // First wait for the Sign In button to disappear
        await expect(page.locator('#navbar-signin-btn')).not.toBeVisible({ timeout: 15000 });
        // Then wait for the avatar
        await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 10000 });
        console.log(`[loginUser] Signup and Auto-Login successful for ${testEmail}`);
      } catch (signupError) {
        // One last try: reload page to force session check
        console.log('[loginUser] Session not hydrated, reloading page...');
        await page.reload();
        await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 15000 });
        console.log(`[loginUser] Signup and Auto-Login successful for ${testEmail} after reload`);
      }
    } else {
      throw new Error(`[loginUser] Unexpected state or unhandled login failure for ${testEmail}: ${err}`);
    }
  }

}
