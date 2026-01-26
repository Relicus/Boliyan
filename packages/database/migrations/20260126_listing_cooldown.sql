-- Date: 2026-01-26

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS go_live_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;

UPDATE listings
SET go_live_at = COALESCE(created_at, NOW())
WHERE go_live_at IS NULL;

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
  p_ends_at TIMESTAMP WITH TIME ZONE
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
    ends_at = p_ends_at,
    last_edited_at = NOW(),
    go_live_at = NOW() + INTERVAL '1 hour'
  WHERE id = p_listing_id;

  RETURN p_listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION edit_listing_with_cooldown(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  DECIMAL,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TIMESTAMP WITH TIME ZONE
) TO authenticated;
