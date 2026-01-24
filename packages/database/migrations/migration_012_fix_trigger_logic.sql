-- Migration: Fix Bid Rules Trigger (Allow status changes without amount change)
-- Date: 2026-01-24

CREATE OR REPLACE FUNCTION enforce_bid_rules()
RETURNS TRIGGER AS $$
DECLARE
  listing_record RECORD;
  min_price DECIMAL;
  max_price DECIMAL;
  max_updates CONSTANT INTEGER := 2; -- 0 (initial) + 2 updates = 3 total attempts
BEGIN
  -- 1. If this is a status-only update (e.g. accepting, expiring, ignoring), bypass price rules
  -- We allow status changes even if amount remains the same.
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.amount = OLD.amount AND NEW.status != OLD.status) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Get listing details
  SELECT * INTO listing_record FROM listings WHERE id = NEW.listing_id;
  
  -- Calculate Range (70% - 150%)
  min_price := listing_record.asked_price * 0.7;
  max_price := listing_record.asked_price * 1.5;
  
  -- A. RANGE CHECK
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
    -- Only apply "Amount must change" rule if the user is trying to update their bid price
    -- If they are just updating status (handled above) or metadata, allow it.
    
    -- Check Quota (Only for price updates or manual updates)
    -- If amount is changing, it's a "bid attempt"
    IF NEW.amount != OLD.amount THEN
      IF OLD.update_count >= max_updates THEN
        RAISE EXCEPTION 'Out of Bids: You have reached the maximum of 3 attempts for this item.';
      END IF;
      
      NEW.update_count := OLD.update_count + 1;
      NEW.status := 'pending'; -- Reset to pending on price change
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
