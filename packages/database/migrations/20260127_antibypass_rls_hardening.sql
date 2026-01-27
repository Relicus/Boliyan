-- Anti-Bypass RLS Hardening
-- Date: 2026-01-27

-- Ensure RLS is enabled on core tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Listings: public can only view active + live; sellers can view their own
DROP POLICY IF EXISTS "Public read access" ON listings;
DROP POLICY IF EXISTS "Public can view active listings" ON listings;
CREATE POLICY "Public can view active listings"
ON listings FOR SELECT
USING (
  status = 'active'
  AND (go_live_at IS NULL OR go_live_at <= NOW())
);

DROP POLICY IF EXISTS "Sellers can view own listings" ON listings;
CREATE POLICY "Sellers can view own listings"
ON listings FOR SELECT
USING ((SELECT auth.uid()) = seller_id);

-- Bids: tighten public visibility + bidder updates
DROP POLICY IF EXISTS "Public can view visible bids" ON bids;
CREATE POLICY "Public can view visible bids"
ON bids FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = bids.listing_id
      AND listings.auction_mode = 'visible'
      AND listings.status = 'active'
      AND (listings.go_live_at IS NULL OR listings.go_live_at <= NOW())
  )
);

DROP POLICY IF EXISTS "Users can update own bids" ON bids;
CREATE POLICY "Users can update own bids"
ON bids FOR UPDATE
USING (
  (SELECT auth.uid()) = bidder_id
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = bids.listing_id
      AND listings.status = 'active'
      AND (listings.go_live_at IS NULL OR listings.go_live_at <= NOW())
  )
)
WITH CHECK (
  (SELECT auth.uid()) = bidder_id
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = bids.listing_id
      AND listings.status = 'active'
      AND (listings.go_live_at IS NULL OR listings.go_live_at <= NOW())
  )
);

-- Messages: allow read receipts only for participants
DROP POLICY IF EXISTS "Users can mark messages read" ON messages;
CREATE POLICY "Users can mark messages read"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.seller_id = (SELECT auth.uid()) OR c.bidder_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.seller_id = (SELECT auth.uid()) OR c.bidder_id = (SELECT auth.uid()))
  )
);

CREATE OR REPLACE FUNCTION restrict_message_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
  THEN
    RAISE EXCEPTION 'Message content is immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_restrict_update ON messages;
CREATE TRIGGER on_message_restrict_update
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION restrict_message_updates();

-- Notifications: restrict inserts to service role
DROP POLICY IF EXISTS "Service can insert notifications" ON notifications;
CREATE POLICY "Service can insert notifications"
ON notifications FOR INSERT
WITH CHECK (COALESCE(auth.role(), '') = 'service_role');
