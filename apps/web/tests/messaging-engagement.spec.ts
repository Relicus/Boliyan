
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
            description: "Nice Camera",
            images: ["https://placehold.co/400"],
            asked_price: 13100,
            created_at: new Date().toISOString(),
            status: 'active',
            seller_id: 'seller-123',
            profiles: { // The seller of the listing
                id: 'seller-123',
                full_name: 'Demo Seller',
                avatar_url: 'https://github.com/shadcn.png'
            }
          },
          seller_profile: {
             id: 'seller-123',
             full_name: 'Demo Seller',
             avatar_url: 'https://github.com/shadcn.png',
             rating: 5.0,
             rating_count: 10,
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
      
      // Mock Messages to prevent empty state or crash
      await page.route(/\/rest\/v1\/messages.*/, async route => {
          await route.fulfill({ json: [] });
      });
      
      // Mock Reviews (safety)
      await page.route(/\/rest\/v1\/reviews.*/, async route => {
           await route.fulfill({ json: [] });
      });

      // Reload to fetch conversations
      await page.reload();
      await page.waitForSelector('[id^="item-card-"]', { state: 'visible' });

      // 2. Go to Inbox
      await page.goto('/inbox');
      
      // 3. Select the conversation
      // Check for title visibility first
      const convLocator = page.locator(`text=${rawMockConversation.listings.title}`).first();
      await expect(convLocator).toBeVisible({ timeout: 10000 });
      await convLocator.click();
      
      // 4. Verify "Sell Fast. Buy Fair." (placeholder) is gone
      await expect(page.locator('text=Sell Fast. Buy Fair.')).not.toBeVisible();

      // 5. Check for Chat Window
      await expect(page.locator('#chat-window')).toBeVisible({ timeout: 5000 });
      
      // 6. Verify Header Content
      await expect(page.locator('#chat-header')).toBeVisible();
      await expect(page.locator('#chat-header')).toContainText('Demo Seller');
      
      // 7. Verify Input Area enabled
      await expect(page.locator('#chat-input-field')).toBeEnabled();
      
      console.log('[Test] Verified messaging enabled for existing conversation.');
  });
});
