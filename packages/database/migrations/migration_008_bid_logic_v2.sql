-- Migration: Implement 70/150/3 Bidding Protocol
-- Date: 2026-01-23

-- 1. Add update_count to bids table to track quota
ALTER TABLE bids 
ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0;

-- 2. Drop the old trigger if it exists (cleanup)
DROP TRIGGER IF EXISTS trg_check_bid_amount ON bids;
DROP FUNCTION IF EXISTS check_bid_amount();

-- 3. Create the robust enforcement trigger function
CREATE OR REPLACE FUNCTION enforce_bid_rules()
RETURNS TRIGGER AS $$
DECLARE
  listing_record RECORD;
  min_price DECIMAL;
  max_price DECIMAL;
  max_updates CONSTANT INTEGER := 2; -- 0 (initial) + 2 updates = 3 total attempts
BEGIN
  -- Get listing details
  SELECT * INTO listing_record FROM listings WHERE id = NEW.listing_id;
  
  -- Calculate Range (70% - 150%)
  min_price := listing_record.asked_price * 0.7;
  max_price := listing_record.asked_price * 1.5;
  
  -- A. RANGE CHECK (Global)
  IF NEW.amount < min_price OR NEW.amount > max_price THEN
    RAISE EXCEPTION 'Bid amount % is outside the allowed range (% to %)', 
      NEW.amount, min_price, max_price;
  END IF;

  -- B. INSERT LOGIC
  IF (TG_OP = 'INSERT') THEN
    NEW.update_count := 0; -- Initialize
  END IF;

  -- C. UPDATE LOGIC
  IF (TG_OP = 'UPDATE') THEN
    -- 1. Check Quota
    IF OLD.update_count >= max_updates THEN
      RAISE EXCEPTION 'Out of Bids: You have reached the maximum of 3 attempts for this item.';
    END IF;

    -- 2. Prevent Redundant Updates (Same Price)
    IF NEW.amount = OLD.amount THEN
      RAISE EXCEPTION 'Bid amount must be different from your current bid.';
    END IF;

    -- 3. Increment Counter
    NEW.update_count := OLD.update_count + 1;
    
    -- 4. Preserve Status if it was pending/ignored, reset to pending if ignored? 
    -- Actually, if a user updates their bid, it should probably go back to 'pending' 
    -- if it was 'ignored' or 'rejected'. 
    -- For now, we assume the frontend handles status resets or we force 'pending'.
    NEW.status := 'pending'; 
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply Trigger
CREATE TRIGGER trg_enforce_bid_rules
BEFORE INSERT OR UPDATE ON bids
FOR EACH ROW
EXECUTE FUNCTION enforce_bid_rules();

-- 5. Update View for Privacy (Masking Secret Bids)
-- We redefine the listing_bid_stats view to handle masking
CREATE OR REPLACE VIEW listing_bid_stats AS
SELECT 
  b.listing_id,
  COUNT(*) as bid_count,
  -- Mask High Bid for Secret Auctions (hidden/sealed)
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN 0 
    ELSE MAX(b.amount) 
  END as high_bid,
  -- Mask High Bidder ID for Secret Auctions
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

-- Note: The `marketplace_listings` view depends on `listing_bid_stats`, 
-- so it will automatically pick up the masked values.
