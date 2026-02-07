import type { Item } from "@/types";
import { transformListingToItem, type ListingWithSeller } from "@/lib/transform";
import type { MarketplaceListingRow } from "./marketplace-types";

// ---------------------------------------------------------------------------
// Shared select columns for the marketplace_listings view
// Used by: MarketplaceContext, SearchContext, useListingsPolling
// ---------------------------------------------------------------------------

export const MARKETPLACE_SELECT_COLUMNS = `
  id, title, description, images, seller_id, asked_price, category,
  auction_mode, created_at, ends_at, go_live_at, status,
  seller_name, seller_avatar, seller_rating, seller_rating_count, seller_location,
  bid_count, high_bid, high_bidder_id, condition, slug, contact_phone,
  location_lat, location_lng, location_address
` as const;

// ---------------------------------------------------------------------------
// Row-to-Item transformation helper
// Wraps the repeated cast pattern: (data as unknown as MarketplaceListingRow[]).map(...)
// ---------------------------------------------------------------------------

export function transformRows(data: unknown[]): Item[] {
  return (data as unknown as MarketplaceListingRow[]).map(
    (row) => transformListingToItem(row as unknown as ListingWithSeller)
  );
}
