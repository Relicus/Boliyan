import { Page } from '@playwright/test';

export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";
export const MOCK_EMAIL = "mock-user@demo.com";

export async function mockSupabaseNetwork(page: Page) {
  // 0. Catch-all Fallback (Registered FIRST so it checks LAST)
  await page.route('**/rest/v1/*', async route => {
       console.log(`[MockNetwork] Unhandled Request: ${route.request().method()} ${route.request().url()}`);
       await route.fulfill({ status: 200, json: [] }); 
  });

  // 1. Mock Auth Token/Login/Signup
  await page.route('**/auth/v1/token?*', async route => {
    const body = route.request().postDataJSON() || {};
    const email = body.email || MOCK_EMAIL;
    const userId = email.includes('test-') ? `user-${email.split('@')[0]}` : MOCK_USER_ID;

    const json = {
      access_token: "mock-access-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh-token",
      user: {
        id: userId,
        aud: "authenticated",
        role: "authenticated",
        email: email,
        email_confirmed_at: new Date().toISOString(),
        phone: "",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { full_name: "Mock User", city: "Karachi" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };
    await route.fulfill({ json });
  });

  await page.route('**/auth/v1/signup', async route => {
     const body = route.request().postDataJSON() || {};
     const email = body.email || MOCK_EMAIL;
     const userId = email.includes('test-') ? `user-${email.split('@')[0]}` : MOCK_USER_ID;

     // Return a valid session structure to trick the client
     const json = {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: email,
      email_confirmed_at: new Date().toISOString(),
      phone: "",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { full_name: "Mock User", city: "Karachi" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Supabase signUp returns { user, session } usually
      session: {
          access_token: "mock-access-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: { id: userId, email: email }
      }
    };
    await route.fulfill({ json });
  });

  // 2. Mock 'getUser'
  await page.route('**/auth/v1/user', async route => {
      // For getUser, we don't easily know which user is being asked for without session
      // But we can return MOCK_USER_ID as fallback
      const json = {
        id: MOCK_USER_ID,
        aud: "authenticated",
        role: "authenticated",
        email: MOCK_EMAIL,
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: "Mock User" }
      };
      await route.fulfill({ json });
  });

  // 3. Mock Profile Fetch (GET /rest/v1/profiles?...)
  await page.route(/\/rest\/v1\/profiles.*/, async route => {
    const url = route.request().url();
    const idMatch = url.match(/id=eq\.(.+?)(&|$)/);
    const userId = idMatch ? idMatch[1] : MOCK_USER_ID;

    await route.fulfill({ 
        json: {
            id: userId,
            full_name: userId.startsWith('user-') ? `Test User ${userId.split('-')[1]}` : "Mock User",
            avatar_url: "https://github.com/shadcn.png",
            city: "Karachi",
            phone: "03001234567",
            location: { lat: 24.8607, lng: 67.0011, address: "Karachi, Pakistan", city: "Karachi" },
            rating: 5.0,
            review_count: 10,
            is_verified: true
        }
    });
  });

  // 4. Mock Bids (GET/POST/PATCH) - Consolidated
  await page.route(/\/rest\/v1\/bids.*/, async route => {
      const method = route.request().method();
      
      if (method === 'GET') {
           // Return empty history for now
           await route.fulfill({ json: [] });
      } else if (method === 'POST' || method === 'PATCH') {
          // Return the input data echoed back (successful insert)
          const postData = route.request().postDataJSON();
          const response = {
              ...postData,
              id: `bid-${Date.now()}`,
              created_at: new Date().toISOString(),
              status: postData.status || 'pending'
          };
          console.log(`[MockNetwork] Bids ${method} success. ID: ${response.id}`);
          await route.fulfill({ json: [response] }); // Upsert returns Array
      } else {
          await route.continue();
      }
  });

  // 5. Mock Conversations (GET only for now)
  await page.route(/\/rest\/v1\/conversations.*/, async route => {
      // Return empty or mock based on query?
      // For now, return empty to prevent errors
      // If we need to test threading, we might need to populate this
      await route.fulfill({ json: [] });
  });

  // 6. Mock Watchlist (Upsert/Delete/Get)
  await page.route(/\/rest\/v1\/watchlist.*/, async route => {
     if (route.request().method() === 'POST') {
        await route.fulfill({ json: [{ id: `watch-${Date.now()}`, ...route.request().postDataJSON() }] });
     } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
     } else {
        // GET (fetch existing watchlist)
        await route.fulfill({ json: [] }); // Start empty
     }
  });

  // 7. Mock Categories (GET)
  await page.route(/\/rest\/v1\/categories.*/, async route => {
      if (route.request().method() === 'GET') {
          await route.fulfill({
              json: [
                  { id: 'cat-001', name: 'Cameras', slug: 'cameras', sort_order: 1 },
                  { id: 'cat-002', name: 'Electronics', slug: 'electronics', sort_order: 2 },
                  { id: 'cat-003', name: 'Vehicles', slug: 'vehicles', sort_order: 3 }
              ]
          });
          return;
      }
      await route.fulfill({ json: [] });
  });

  // 8. Mock Listings (GET category aggregation)
  await page.route(/\/rest\/v1\/listings.*/, async route => {
      if (route.request().method() === 'GET') {
          await route.fulfill({
              json: [
                  { category: 'Cameras' },
                  { category: 'Electronics' },
                  { category: 'Vehicles' }
              ]
          });
          return;
      }
      await route.fulfill({ json: [] });
  });

  // 9. Mock Notifications (GET/PATCH)
  await page.route(/\/rest\/v1\/notifications.*/, async route => {
      if (route.request().method() === 'GET') {
          await route.fulfill({ json: [] });
          return;
      }
      await route.fulfill({ json: [] });
  });

  // 10. Mock Marketplace Listings (GET)
  await page.route(/\/rest\/v1\/marketplace_listings.*/, async route => {
      const requestUrl = new URL(route.request().url());
      const acceptHeader = route.request().headers()['accept'] || '';
      const idFilter = requestUrl.searchParams.get('id');
      const slugFilter = requestUrl.searchParams.get('slug');

      const mockItems = [
          {
              id: '00000000-0000-0000-0000-000000000023',
              slug: 'test-item-camera',
              title: "Test Item Camera",
              description: "A great camera",
              images: ["https://placehold.co/400"],
              seller_id: "seller-123",
              asked_price: 13100,
              category: "Cameras",
              auction_mode: "visible",
              created_at: new Date().toISOString(),
              status: "active",
              seller_name: "Demo Seller",
              seller_avatar: "https://github.com/shadcn.png",
              seller_rating: 4.8,
              seller_rating_count: 12,
              seller_location: "Karachi",
              bid_count: 5,
              high_bid: 12000,
              high_bidder_id: "other-bidder",
              condition: "used"
          },
          {
              id: '00000000-0000-0000-0000-000000000015',
              slug: 'persian-rug',
              title: "Persian Rug",
              description: "Handwoven wool rug",
              images: ["https://placehold.co/400"],
              seller_id: "seller-456",
              asked_price: 25000,
              category: "Home",
              auction_mode: "visible",
              created_at: new Date().toISOString(),
              status: "active",
              seller_name: "Rug Dealer",
              seller_avatar: "https://github.com/shadcn.png",
              seller_rating: 4.6,
              seller_rating_count: 8,
              seller_location: "Lahore",
              bid_count: 0,
              high_bid: null,
              high_bidder_id: null,
              condition: "used"
          }
      ];

      const matchFilterValue = (filterValue: string | null) => {
          if (!filterValue) return null;
          const match = filterValue.match(/^eq\.(.+)$/);
          return match ? match[1] : null;
      };

      const filterId = matchFilterValue(idFilter);
      const filterSlug = matchFilterValue(slugFilter);
      const matchedItem = mockItems.find(item =>
        (filterId && item.id === filterId) || (filterSlug && item.slug === filterSlug)
      );

      if (matchedItem && acceptHeader.includes('application/vnd.pgrst.object+json')) {
          await route.fulfill({ json: matchedItem });
          return;
      }

      if (matchedItem) {
          await route.fulfill({ json: [matchedItem] });
          return;
      }

      await route.fulfill({ json: mockItems }); 
  });





  // Catch-all moved to top


  // 11. Mock RPC calls
  await page.route(/\/rest\/v1\/rpc\/place_bid.*/, async route => {
      const postData = route.request().postDataJSON();
      const response = {
          id: `bid-${Date.now()}`,
          listing_id: postData.p_listing_id,
          bidder_id: MOCK_USER_ID,
          amount: postData.p_amount,
          status: 'pending',
          created_at: new Date().toISOString()
      };
      console.log(`[MockNetwork] RPC place_bid success. Amount: ${postData.p_amount}`);
      await route.fulfill({ json: response });
  });

  await page.route(/\/rest\/v1\/rpc\/.*/, async route => {
      await route.fulfill({ json: { success: true } });
  });

  // 8. Realtime Mock
  await page.route('**/realtime/v1/*', async route => {
      await route.fulfill({ status: 200, json: {} });
  });
}
