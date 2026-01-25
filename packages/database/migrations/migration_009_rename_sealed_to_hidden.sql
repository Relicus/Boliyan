-- Migration: Rename Sealed Bidding to Hidden Bidding
-- Date: 2026-01-25

-- 1. Update existing records in listings table
UPDATE listings SET auction_mode = 'hidden' WHERE auction_mode = 'sealed';

-- 2. Update listing_bid_stats view to prefer 'hidden'
CREATE OR REPLACE VIEW listing_bid_stats AS
SELECT 
  b.listing_id,
  COUNT(*) as bid_count,
  -- Mask High Bid for Hidden Auctions
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN 0 
    ELSE MAX(b.amount) 
  END as high_bid,
  -- Mask High Bidder ID for Hidden Auctions
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN NULL
    ELSE (
      SELECT b2.bidder_id 
      FROM bids b2 
      WHERE b2.listing_id = b.listing_id 
        AND b2.status != 'rejected'
      ORDER BY b2.amount DESC, b2.created_at ASC
      LIMIT 1
    )
  END as high_bidder_id
FROM bids b
JOIN listings l ON b.listing_id = l.id
WHERE b.status != 'rejected'
GROUP BY b.listing_id, l.auction_mode;
