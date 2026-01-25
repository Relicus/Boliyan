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
  p.full_name AS seller_name,
  p.avatar_url AS seller_avatar,
  p.rating AS seller_rating,
  p.rating_count AS seller_rating_count,
  p.location AS seller_location,
  COALESCE(s.bid_count, 0::bigint) AS bid_count,
  COALESCE(s.high_bid, 0::numeric) AS high_bid,
  s.high_bidder_id,
  l.slug,
  l.ends_at,
  l.contact_phone
FROM listings l
LEFT JOIN profiles p ON l.seller_id = p.id
LEFT JOIN listing_bid_stats s ON l.id = s.listing_id;

ALTER VIEW marketplace_listings SET (security_invoker = true);
