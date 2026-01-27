-- Anti-Bypass RPC Layer
-- Date: 2026-01-27

DROP FUNCTION IF EXISTS place_bid(UUID, NUMERIC, TEXT);
CREATE FUNCTION place_bid(
  p_listing_id UUID,
  p_amount NUMERIC,
  p_message TEXT
)
RETURNS bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  bid_row bids%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  INSERT INTO bids (listing_id, bidder_id, amount, message, status)
  VALUES (p_listing_id, (SELECT auth.uid()), p_amount, p_message, 'pending')
  ON CONFLICT (listing_id, bidder_id)
  DO UPDATE SET
    amount = EXCLUDED.amount,
    message = EXCLUDED.message,
    status = 'pending'
  RETURNING * INTO bid_row;

  RETURN bid_row;
END;
$$;

DROP FUNCTION IF EXISTS accept_bid(UUID);
CREATE FUNCTION accept_bid(
  p_bid_id UUID
)
RETURNS TABLE (bid_id UUID, conversation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  bid_row bids%ROWTYPE;
  listing_row listings%ROWTYPE;
  convo_id UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT * INTO bid_row FROM bids WHERE id = p_bid_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BID_NOT_FOUND';
  END IF;

  SELECT * INTO listing_row FROM listings WHERE id = bid_row.listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF listing_row.seller_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE bids
  SET status = 'accepted'
  WHERE id = p_bid_id;

  SELECT id INTO convo_id
  FROM conversations
  WHERE listing_id = bid_row.listing_id
    AND bidder_id = bid_row.bidder_id
  LIMIT 1;

  IF convo_id IS NULL THEN
    INSERT INTO conversations (listing_id, seller_id, bidder_id, last_message, updated_at)
    VALUES (bid_row.listing_id, listing_row.seller_id, bid_row.bidder_id, 'Chat started', NOW())
    RETURNING id INTO convo_id;
  END IF;

  RETURN QUERY SELECT p_bid_id, convo_id;
END;
$$;

DROP FUNCTION IF EXISTS reject_bid(UUID);
CREATE FUNCTION reject_bid(
  p_bid_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  bid_row bids%ROWTYPE;
  listing_row listings%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT * INTO bid_row FROM bids WHERE id = p_bid_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BID_NOT_FOUND';
  END IF;

  SELECT * INTO listing_row FROM listings WHERE id = bid_row.listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF listing_row.seller_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE bids
  SET status = 'ignored'
  WHERE id = p_bid_id;

  RETURN p_bid_id;
END;
$$;

DROP FUNCTION IF EXISTS ensure_conversation(UUID, UUID);
CREATE FUNCTION ensure_conversation(
  p_listing_id UUID,
  p_bidder_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  listing_row listings%ROWTYPE;
  convo_id UUID;
  has_accepted_bid BOOLEAN;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT * INTO listing_row FROM listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF listing_row.seller_id IS DISTINCT FROM (SELECT auth.uid())
     AND p_bidder_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM bids
    WHERE listing_id = p_listing_id
      AND bidder_id = p_bidder_id
      AND status = 'accepted'
  ) INTO has_accepted_bid;

  IF NOT has_accepted_bid THEN
    RAISE EXCEPTION 'BID_NOT_ACCEPTED';
  END IF;

  SELECT id INTO convo_id
  FROM conversations
  WHERE listing_id = p_listing_id
    AND bidder_id = p_bidder_id
  LIMIT 1;

  IF convo_id IS NULL THEN
    INSERT INTO conversations (listing_id, seller_id, bidder_id, last_message, updated_at)
    VALUES (p_listing_id, listing_row.seller_id, p_bidder_id, 'Chat started', NOW())
    RETURNING id INTO convo_id;
  END IF;

  RETURN convo_id;
END;
$$;

DROP FUNCTION IF EXISTS send_message(UUID, TEXT);
CREATE FUNCTION send_message(
  p_conversation_id UUID,
  p_content TEXT
)
RETURNS messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  message_row messages%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, (SELECT auth.uid()), p_content)
  RETURNING * INTO message_row;

  RETURN message_row;
END;
$$;
