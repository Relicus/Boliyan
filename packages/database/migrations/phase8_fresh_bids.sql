-- Phase 8: Fresh Bids & Watchlist Persistence
-- Implements the 24-hour bid freshness rule and "Total Bids" tracking.

-- 1. Add 'expired' to Bid Status Enum
-- Note: Postgres enums are immutable in some contexts, so we check constraints.
ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;
ALTER TABLE bids ADD CONSTRAINT bids_status_check 
  CHECK (status IN ('pending', 'accepted', 'ignored', 'rejected', 'expired'));

-- 2. Add expires_at column (Default 24h from creation)
ALTER TABLE bids 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');

-- 3. Update Master View: listing_bid_stats
-- Logic:
--   - High Bid: Only from FRESH bids (expires_at > NOW())
--   - Bid Count: TOTAL lifetime bids (for scarcity/popularity)
--   - High Bidder: From FRESH bids only
CREATE OR REPLACE VIEW listing_bid_stats AS
SELECT 
  b.listing_id,
  COUNT(*) as bid_count, -- Lifetime count for popularity
  
  -- Fresh High Bid (Public Auctions)
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN 0 
    ELSE COALESCE(MAX(CASE WHEN b.expires_at > NOW() AND b.status != 'expired' THEN b.amount END), 0)
  END as high_bid,

  -- Fresh High Bidder (Public Auctions)
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN NULL
    ELSE (
      SELECT b2.bidder_id 
      FROM bids b2 
      WHERE b2.listing_id = b.listing_id 
        AND b2.status != 'rejected'
        AND b2.status != 'expired'
        AND b2.expires_at > NOW() -- Only fresh bids win
      ORDER BY b2.amount DESC, b2.created_at ASC
      LIMIT 1
    )
  END as high_bidder_id

FROM bids b
JOIN listings l ON b.listing_id = l.id
WHERE b.status != 'rejected'
GROUP BY b.listing_id, l.auction_mode;

-- 4. Cron Job: Mark Expired Bids (Hourly)
-- Requires pg_cron extension. If not available, logic relies on view filtering.
-- We create the function regardless for manual or trigger execution.
CREATE OR REPLACE FUNCTION expire_old_bids() RETURNS void AS $$
BEGIN
  -- 1. Mark as expired
  -- 2. Reset update_count so user can bid again
  UPDATE bids 
  SET status = 'expired', 
      update_count = 0
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Cleanup Job: Remove old expired bids (Daily)
-- Keeps database clean by removing bids expired > 4 days ago
CREATE OR REPLACE FUNCTION cleanup_expired_bids() RETURNS void AS $$
BEGIN
  DELETE FROM bids 
  WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '4 days';
END;
$$ LANGUAGE plpgsql;
