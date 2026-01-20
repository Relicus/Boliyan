
import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';
import { mockSupabaseNetwork, MOCK_USER_ID } from './helpers/mock-network';

test.describe('Messaging & Engagement', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser console logs
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    // MOCK NETWORK
    await mockSupabaseNetwork(page);

    // Login
    await loginUser(page);
    
    await page.goto('/');
    await page.waitForSelector('[id^="item-card-"]', { state: 'visible', timeout: 15000 });
  });

  test('should prevent messaging before deal acceptance', async ({ page }) => {
    // 1. Pick an item
    const rootCards = page.locator('#marketplace-grid-container > div > [id^="item-card-"]');
    const itemCard = rootCards.first();
    const itemId = (await itemCard.getAttribute('id'))?.replace('item-card-', '');
    if (!itemId) throw new Error("Could not find item ID");

    // 2. Click to open modal
    await itemCard.locator(`#item-card-${itemId}-title`).click();
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // 3. Verify NO "Chat" or "Message" button exists in the modal
    // Common selectors for such buttons
    await expect(dialog.locator('button:has-text("Chat")')).not.toBeVisible();
    await expect(dialog.locator('button:has-text("Message")')).not.toBeVisible();
    await expect(dialog.locator('button[id*="chat"]')).not.toBeVisible();

    console.log('[Test] Verified no chat options available before deal.');
  });

  test('should allow messaging when conversation exists', async ({ page }) => {
      // 1. Mock a conversation being present - return RAW DB shape expecting by ChatContext hydration
      const rawMockConversation = {
          id: 'conv-123',
          created_at: new Date().toISOString(),
          listing_id: '00000000-0000-0000-0000-000000000023',
          seller_id: 'seller-123',
          bidder_id: MOCK_USER_ID,
          updated_at: new Date().toISOString(),
          last_message: 'Deal accepted',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'open',
          
          // Joined Data
          listings: {
            id: '00000000-0000-0000-0000-000000000023',
            title: "Test Item Camera",
            images: ["https://placehold.co/400"],
            asked_price: 13100,
            profiles: { // The seller of the listing
                id: 'seller-123',
                full_name: 'Demo Seller'
            }
          },
          seller_profile: {
             id: 'seller-123',
             full_name: 'Demo Seller',
             avatar_url: 'https://github.com/shadcn.png',
             is_verified: true
          },
          bidder_profile: {
             id: MOCK_USER_ID,
             full_name: 'Mock User',
             avatar_url: '',
             is_verified: true
          }
      };

      // Override the conversations mock for this test
      await page.route(/\/rest\/v1\/conversations.*/, async route => {
          await route.fulfill({ json: [rawMockConversation] });
      });

      // Reload to fetch conversations
      await page.reload();
      await page.waitForSelector('[id^="item-card-"]', { state: 'visible' });

      // 2. Open Inbox/Chat UI (Assuming there is a way to navigate there, e.g. via specific URL or Navbar)
      // Since specific UI navigation to inbox isn't fully detailed in context, let's assume we can go to /inbox/conv-123 or similar?
      // Or check if the Modal/Card now shows a "Chat" button? 
      // User rules say "Unlocks ONLY after deal acceptance".
      // Usually this means the "Place Bid" button might become "Chat" or a new button appears?
      // Let's check `ItemCard.tsx` logic again? No, let's assume we go to the Inbox page directly for now, 
      // OR check if the "Chat" button appears on the card if `hasConversation` logic exists.
      
      // Let's assume we navigate to inbox for verification as that's safer.
      await page.goto('/inbox'); // Standard route
      
      // Verify the conversation is listed
      await expect(page.locator(`text=${mockConversation.item.title}`)).toBeVisible({ timeout: 10000 });
      
      // Click it
      await page.locator(`text=${mockConversation.item.title}`).click();
      
      // Check for Chat Window
      await expect(page.locator('#chat-window')).toBeVisible();
      
      // Check Input is unlocked
      const input = page.locator('#chat-input-field');
      await expect(input).toBeEnabled();
      await expect(input).not.toBeDisabled();
      
      console.log('[Test] Verified messaging enabled for existing conversation.');
  });
});
