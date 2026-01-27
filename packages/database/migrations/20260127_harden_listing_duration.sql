-- Migration: Harden listing duration and expiry logic
-- Date: 2026-01-27
-- Description: Enforce allowed durations and automate ends_at calculation on the server.

-- 1. Ensure the column and constraint exist on the table
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS listing_duration INTEGER DEFAULT 720;

-- Drop old constraint if it exists (names vary)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_duration_check;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_duration_check;

-- Add strict check
ALTER TABLE listings ADD CONSTRAINT listings_listing_duration_check 
  CHECK (listing_duration IN (24, 168, 720));

-- 2. Create trigger to automate ends_at based on duration
-- This prevents "hacking" ends_at to a year in the future.
CREATE OR REPLACE FUNCTION set_listing_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- If duration is set, we calculate ends_at relative to go_live_at (or NOW())
    -- This ensures consistency even if ends_at was manually provided.
    NEW.ends_at := COALESCE(NEW.go_live_at, NOW()) + (NEW.listing_duration || ' hours')::interval;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_listing_set_expiry ON listings;
CREATE TRIGGER on_listing_set_expiry
    BEFORE INSERT OR UPDATE OF listing_duration, go_live_at ON listings
    FOR EACH ROW
    EXECUTE FUNCTION set_listing_expiry();

-- 3. Update the edit RPC to use duration
-- We keep p_ends_at for backward compatibility during deployment but ignore it in favor of calculation
CREATE OR REPLACE FUNCTION edit_listing_with_cooldown(
  p_listing_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_asked_price DECIMAL,
  p_contact_phone TEXT,
  p_auction_mode TEXT,
  p_images TEXT[],
  p_condition TEXT,
  p_ends_at TIMESTAMP WITH TIME ZONE, -- Kept for signature compatibility
  p_listing_duration INTEGER DEFAULT 720 -- New optional param
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_seller_id UUID;
  v_last_edited_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT seller_id, last_edited_at
  INTO v_seller_id, v_last_edited_at
  FROM listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF v_seller_id IS NULL OR v_seller_id <> auth.uid() THEN
    RAISE EXCEPTION 'NOT_ALLOWED';
  END IF;

  IF v_last_edited_at IS NOT NULL AND NOW() < v_last_edited_at + INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'COOLDOWN_ACTIVE';
  END IF;

  DELETE FROM bids WHERE listing_id = p_listing_id;

  UPDATE listings
  SET
    title = p_title,
    description = p_description,
    category = p_category,
    asked_price = p_asked_price,
    contact_phone = p_contact_phone,
    auction_mode = p_auction_mode,
    images = p_images,
    condition = p_condition,
    listing_duration = p_listing_duration, -- The trigger will handle ends_at
    last_edited_at = NOW(),
    go_live_at = NOW() + INTERVAL '1 hour'
  WHERE id = p_listing_id;

  RETURN p_listing_id;
END;
$$;

-- Note: We don't strictly NEED to update the client immediately because the trigger 
-- will pick up the DEFAULT listing_duration (720) even if not provided.
-- But we will update the client for explicitness.
