-- Add bid_attempts_count to listing_bid_stats and marketplace_listings
-- Date: 2026-01-27

DROP VIEW IF EXISTS marketplace_listings;
DROP VIEW IF EXISTS listing_bid_stats;

CREATE VIEW listing_bid_stats AS
SELECT 
  b.listing_id,
  COUNT(*) as bid_count,
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN 0 
    ELSE COALESCE(MAX(CASE WHEN b.expires_at > NOW() AND b.status != 'expired' THEN b.amount END), 0)
  END as high_bid,
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN NULL
    ELSE (
      SELECT b2.bidder_id 
      FROM bids b2 
      WHERE b2.listing_id = b.listing_id 
        AND b2.status != 'rejected'
        AND b2.status != 'expired'
        AND b2.expires_at > NOW()
      ORDER BY b2.amount DESC, b2.created_at ASC
      LIMIT 1
    )
  END as high_bidder_id,
  SUM(CASE WHEN b.status != 'expired' THEN (COALESCE(b.update_count, 0) + 1) ELSE 0 END) as bid_attempts_count
FROM bids b
JOIN listings l ON b.listing_id = l.id
WHERE b.status != 'rejected'
GROUP BY b.listing_id, l.auction_mode;

CREATE VIEW marketplace_listings AS
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
LEFT JOIN listing_bid_stats s ON l.id = s.listing_id;

ALTER VIEW marketplace_listings SET (security_invoker = true);
