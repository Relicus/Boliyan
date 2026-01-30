-- Migration: Add listing moderation columns
-- Purpose: Enable manual admin moderation with approve/reject workflow

-- Add moderation columns to listings
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS moderation_status TEXT 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')) 
    DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id);

-- Reduce go_live_at from 1 hour to 5 minutes for faster publishing
ALTER TABLE listings 
  ALTER COLUMN go_live_at SET DEFAULT (NOW() + INTERVAL '5 minutes');

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON listings(moderation_status);

-- Set existing listings as approved (they were already live)
UPDATE listings SET moderation_status = 'approved' WHERE moderation_status IS NULL;

-- Update marketplace_listings view to filter out rejected listings
CREATE OR REPLACE VIEW marketplace_listings AS
SELECT
  l.id,
  l.seller_id,
  l.title,
  l.description,
  l.asked_price,
  l.category,
  l.images,
  l.auction_mode,
  l.status,
  l.created_at,
  l.search_vector,
  l.condition,
  l.moderation_status,
  p.full_name AS seller_name,
  p.avatar_url AS seller_avatar,
  p.rating AS seller_rating,
  p.rating_count AS seller_rating_count,
  p.location AS seller_location,
  l.location_lat,
  l.location_lng,
  l.location_address,
  COALESCE(s.bid_count, 0::bigint) AS bid_count,
  COALESCE(s.bid_attempts_count, 0::bigint) AS bid_attempts_count,
  COALESCE(s.high_bid, 0::numeric) AS high_bid,
  s.high_bidder_id,
  l.slug,
  l.ends_at,
  l.go_live_at,
  l.contact_phone
FROM listings l
LEFT JOIN profiles p ON l.seller_id = p.id
LEFT JOIN listing_bid_stats s ON l.id = s.listing_id
WHERE l.moderation_status != 'rejected';

ALTER VIEW marketplace_listings SET (security_invoker = true);
