-- Trigger: Enforce 70% minimum bid rule
CREATE OR REPLACE FUNCTION check_bid_amount()
RETURNS TRIGGER AS $$
DECLARE
  asked_price_val DECIMAL;
BEGIN
  -- Get the asked price for the listing
  SELECT asked_price INTO asked_price_val FROM listings WHERE id = NEW.listing_id;
  
  -- Check if bid is at least 70% of asked price
  IF NEW.amount < (asked_price_val * 0.7) THEN
    RAISE EXCEPTION 'Bid amount % is below the minimum allowed (70%% of %)', NEW.amount, asked_price_val;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_bid_amount ON bids;
CREATE TRIGGER trg_check_bid_amount
BEFORE INSERT OR UPDATE ON bids
FOR EACH ROW
EXECUTE FUNCTION check_bid_amount();
