-- Listings RPC Hardening
-- Date: 2026-01-27

DROP FUNCTION IF EXISTS create_listing(
  TEXT,
  TEXT,
  TEXT,
  DECIMAL,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TIMESTAMP WITH TIME ZONE,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT,
  TEXT
);

CREATE FUNCTION create_listing(
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_asked_price DECIMAL,
  p_contact_phone TEXT,
  p_auction_mode TEXT,
  p_images TEXT[],
  p_condition TEXT,
  p_ends_at TIMESTAMP WITH TIME ZONE,
  p_listing_duration INTEGER,
  p_location_lat DOUBLE PRECISION,
  p_location_lng DOUBLE PRECISION,
  p_location_address TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_listing_id UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  INSERT INTO listings (
    seller_id,
    title,
    description,
    category,
    asked_price,
    contact_phone,
    auction_mode,
    images,
    condition,
    ends_at,
    listing_duration,
    location_lat,
    location_lng,
    location_address,
    status,
    slug
  )
  VALUES (
    (SELECT auth.uid()),
    p_title,
    p_description,
    p_category,
    p_asked_price,
    p_contact_phone,
    p_auction_mode,
    p_images,
    p_condition,
    p_ends_at,
    p_listing_duration,
    p_location_lat,
    p_location_lng,
    p_location_address,
    'active',
    p_slug
  )
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$$;

DROP FUNCTION IF EXISTS edit_listing_with_cooldown(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  DECIMAL,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TIMESTAMP WITH TIME ZONE,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT
);

CREATE FUNCTION edit_listing_with_cooldown(
  p_listing_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_asked_price DECIMAL,
  p_contact_phone TEXT,
  p_auction_mode TEXT,
  p_images TEXT[],
  p_condition TEXT,
  p_ends_at TIMESTAMP WITH TIME ZONE,
  p_listing_duration INTEGER,
  p_location_lat DOUBLE PRECISION,
  p_location_lng DOUBLE PRECISION,
  p_location_address TEXT
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
    listing_duration = p_listing_duration,
    location_lat = p_location_lat,
    location_lng = p_location_lng,
    location_address = p_location_address,
    last_edited_at = NOW(),
    go_live_at = NOW() + INTERVAL '1 hour'
  WHERE id = p_listing_id;

  RETURN p_listing_id;
END;
$$;

DROP FUNCTION IF EXISTS update_listing_fields(UUID, TEXT, TEXT);
CREATE FUNCTION update_listing_fields(
  p_listing_id UUID,
  p_status TEXT,
  p_title TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT seller_id INTO v_seller_id
  FROM listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF v_seller_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'completed', 'cancelled', 'hidden') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  UPDATE listings
  SET
    status = COALESCE(p_status, status),
    title = COALESCE(p_title, title)
  WHERE id = p_listing_id;

  RETURN p_listing_id;
END;
$$;

DROP FUNCTION IF EXISTS delete_listing(UUID);
CREATE FUNCTION delete_listing(
  p_listing_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT seller_id INTO v_seller_id
  FROM listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF v_seller_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  DELETE FROM listings WHERE id = p_listing_id;
  RETURN p_listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_listing(
  TEXT,
  TEXT,
  TEXT,
  DECIMAL,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TIMESTAMP WITH TIME ZONE,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT,
  TEXT
) TO authenticated;

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
  TIMESTAMP WITH TIME ZONE,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION update_listing_fields(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_listing(UUID) TO authenticated;
