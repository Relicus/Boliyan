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
    // If we see the avatar, we're good
    await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 5000 });
    console.log(`[loginUser] Login successful for ${testEmail}`);
  } catch (e) {
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
      
      // Post-signup: Wait for redirect to home
      await page.waitForURL('/', { timeout: 10000 }).catch(() => {
        console.log('[loginUser] Timeout waiting for redirect to /, proceeding anyway...');
      });
      
      // Force session hydration check from Supabase by reloading
      await page.reload();
      
      // Post-signup: Success redirect and profile hydration
      try {
        await expect(page.locator('#navbar-avatar-18')).toBeVisible({ timeout: 15000 });
        console.log(`[loginUser] Signup and Auto-Login successful for ${testEmail}`);
      } catch (signupError) {
        console.error(`[loginUser] Auth verification failed for ${testEmail}: ${signupError.message}`);
        // If we are on / and still see Sign In, something is wrong with the mock session persistence
        const signInVisible = await page.locator('#navbar-signin-btn').isVisible();
        const loadingVisible = await page.locator('#navbar-loading-avatar').isVisible();
        
        throw new Error(`User not logged in after signup/signin flow for ${testEmail}. State: SigninVisible=${signInVisible}, LoadingVisible=${loadingVisible}, URL=${page.url()}`);
      }
    } else {
      throw new Error(`[loginUser] Unexpected state or unhandled login failure for ${testEmail} at ${page.url()}`);
    }
  }
}
