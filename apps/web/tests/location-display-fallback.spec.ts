import { expect, test, type Page } from '@playwright/test';

import { gotoWithRetry } from './helpers/goto';
import { mockSupabaseNetwork } from './helpers/mock-network';

const LOCATION_CASE_IDS = {
  listingPreferred: '00000000-0000-0000-0000-000000000101',
  sellerFallback: '00000000-0000-0000-0000-000000000102',
  unknownFallback: '00000000-0000-0000-0000-000000000103'
} as const;
const MOCK_IMAGE_URL = 'https://images.unsplash.com/photo-1519183071298-a2962be90b8e?auto=format&fit=crop&w=800&q=60';

async function mockMarketplaceListingsForLocationCases(page: Page) {
  await page.route(/\/rest\/v1\/marketplace_listings.*/, async (route) => {
    const requestUrl = new URL(route.request().url());
    const acceptHeader = route.request().headers().accept || '';
    const idFilter = requestUrl.searchParams.get('id');
    const slugFilter = requestUrl.searchParams.get('slug');

    const mockItems = [
      {
        id: LOCATION_CASE_IDS.listingPreferred,
        slug: 'location-case-listing-preferred',
        title: 'Location from listing',
        description: 'Listing location should win over seller location.',
        images: [MOCK_IMAGE_URL],
        seller_id: 'seller-location-1',
        asked_price: 120000,
        category: 'Electronics',
        auction_mode: 'visible',
        created_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        go_live_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'active',
        seller_name: 'Seller Islamabad',
        seller_avatar: 'https://github.com/shadcn.png',
        seller_rating: 4.8,
        seller_rating_count: 20,
        seller_location: 'Islamabad',
        bid_count: 4,
        high_bid: 110000,
        high_bidder_id: 'bidder-x',
        condition: 'used',
        contact_phone: '03000000001',
        location_lat: 31.4697,
        location_lng: 74.2728,
        location_address: 'Street 10, DHA Phase 6, Lahore, Pakistan'
      },
      {
        id: LOCATION_CASE_IDS.sellerFallback,
        slug: 'location-case-seller-fallback',
        title: 'Location from seller fallback',
        description: 'Listing location missing, seller location should render.',
        images: [MOCK_IMAGE_URL],
        seller_id: 'seller-location-2',
        asked_price: 95000,
        category: 'Electronics',
        auction_mode: 'visible',
        created_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        go_live_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'active',
        seller_name: 'Seller Rawalpindi',
        seller_avatar: 'https://github.com/shadcn.png',
        seller_rating: 4.7,
        seller_rating_count: 12,
        seller_location: 'Rawalpindi',
        bid_count: 2,
        high_bid: 90000,
        high_bidder_id: 'bidder-y',
        condition: 'used',
        contact_phone: '03000000002',
        location_lat: null,
        location_lng: null,
        location_address: null
      },
      {
        id: LOCATION_CASE_IDS.unknownFallback,
        slug: 'location-case-unknown-fallback',
        title: 'Unknown location fallback',
        description: 'Both listing and seller addresses are blank.',
        images: [MOCK_IMAGE_URL],
        seller_id: 'seller-location-3',
        asked_price: 45000,
        category: 'Electronics',
        auction_mode: 'visible',
        created_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        go_live_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'active',
        seller_name: 'Seller Blank',
        seller_avatar: 'https://github.com/shadcn.png',
        seller_rating: 4.3,
        seller_rating_count: 4,
        seller_location: '   ',
        bid_count: 0,
        high_bid: null,
        high_bidder_id: null,
        condition: 'used',
        contact_phone: '03000000003',
        location_lat: null,
        location_lng: null,
        location_address: null
      }
    ];

    const extractEqFilter = (value: string | null) => {
      if (!value) return null;
      const match = value.match(/^eq\.(.+)$/);
      return match ? match[1] : null;
    };

    const filterId = extractEqFilter(idFilter);
    const filterSlug = extractEqFilter(slugFilter);
    const matchedItem = mockItems.find((item) =>
      (filterId && item.id === filterId) || (filterSlug && item.slug === filterSlug)
    );

    if (matchedItem && acceptHeader.includes('application/vnd.pgrst.object+json')) {
      await route.fulfill({ status: 200, json: matchedItem });
      return;
    }

    if (matchedItem) {
      await route.fulfill({ status: 200, json: [matchedItem] });
      return;
    }

    await route.fulfill({ status: 200, json: mockItems });
  });
}

async function expectCardLocation(page: Page, itemId: string, expectedLocation: string) {
  const leftStack = page.locator(`#item-card-${itemId}-left-stack`);
  await expect(leftStack).toBeVisible({ timeout: 15000 });
  await expect(leftStack).toContainText(expectedLocation);
}

test.describe('Listing location fallback rendering', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseNetwork(page);
    await mockMarketplaceListingsForLocationCases(page);
    await gotoWithRetry(page, '/');
    await expect(page.locator('#marketplace-grid-container')).toBeVisible({ timeout: 15000 });
  });

  test('renders listing location first, then seller fallback, then unknown', async ({ page }) => {
    await expectCardLocation(page, LOCATION_CASE_IDS.listingPreferred, 'DHA Phase 6, Lahore');
    await expectCardLocation(page, LOCATION_CASE_IDS.sellerFallback, 'Rawalpindi');
    await expectCardLocation(page, LOCATION_CASE_IDS.unknownFallback, 'Unknown Location');
  });
});
