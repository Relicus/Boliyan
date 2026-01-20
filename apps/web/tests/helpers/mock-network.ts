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
    const json = {
      access_token: "mock-access-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh-token",
      user: {
        id: MOCK_USER_ID,
        aud: "authenticated",
        role: "authenticated",
        email: MOCK_EMAIL,
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
     // Return a valid session structure to trick the client
     const json = {
      id: MOCK_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: MOCK_EMAIL,
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
          user: { id: MOCK_USER_ID, email: MOCK_EMAIL }
      }
    };
    await route.fulfill({ json });
  });

  // 2. Mock 'getUser'
  await page.route('**/auth/v1/user', async route => {
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
    // If querying for the specific mock user
    if (route.request().url().includes(`id=eq.${MOCK_USER_ID}`)) {
        await route.fulfill({ 
            json: {
                id: MOCK_USER_ID,
                full_name: "Mock User",
                avatar_url: "https://github.com/shadcn.png",
                city: "Karachi",
                rating: 5.0,
                review_count: 10,
                is_verified: true
            }
        });
    } else {
        await route.continue();
    }
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

  // 6. Mock Marketplace Listings (GET)
  await page.route(/\/rest\/v1\/marketplace_listings.*/, async route => {
      // Return a set of mock items containing the IDs expected by tests
      // ID '...23' is commonly used by ItemCard test? 
      // Actually the test uses whatever is on the page.
      // But if we return Mocks, the page will Render Mocks.
      // Wait: If we mock this, the 'real' items on localhost:3000 won't load.
      // But we need them to inspect the 'Halo'.
      // Strategy: Return a static list that MATCHES the test expectations.
      // Or... can we fetch them from localhost? No, complex.
      // Better: Return a robust mock list.
      const mockItems = [
          {
              id: '00000000-0000-0000-0000-000000000023',
              title: "Test Item Camera",
              description: "A great camera",
              images: ["https://placehold.co/400"],
              seller_id: "seller-123",
              asked_price: 13100, // Valid price for logic
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
          // Add more if needed
      ];
      await route.fulfill({ json: mockItems }); 
  });





  // Catch-all moved to top


  // 8. Realtime Mock
  await page.route('**/realtime/v1/*', async route => {
      await route.fulfill({ status: 200, json: {} });
  });
}
