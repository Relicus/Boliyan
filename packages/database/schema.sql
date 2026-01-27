-- Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings Table
CREATE TABLE listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  contact_phone TEXT,
  asked_price DECIMAL NOT NULL,
  category TEXT,
  images TEXT[] DEFAULT '{}',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  condition TEXT CHECK (condition IN ('new', 'like_new', 'used', 'fair')) DEFAULT 'used',
  auction_mode TEXT CHECK (auction_mode IN ('hidden', 'visible', 'sealed')) DEFAULT 'visible',
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled', 'hidden')) DEFAULT 'active',
  ends_at TIMESTAMP WITH TIME ZONE,
  go_live_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  last_edited_at TIMESTAMP WITH TIME ZONE,
  search_vector TSVECTOR,
  slug TEXT UNIQUE,
  listing_duration INTEGER DEFAULT 720 CHECK (listing_duration IN (24, 168, 720)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_slug ON listings(slug);

-- Listing Bid Stats View
CREATE OR REPLACE VIEW listing_bid_stats AS
SELECT 
  b.listing_id,
  COUNT(*) as bid_count,
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN 0 
    ELSE COALESCE(MAX(CASE WHEN b.expires_at > NOW() AND b.status != 'expired' THEN b.amount END), 0)
  END as high_bid,
  CASE 
    WHEN l.auction_mode IN ('hidden', 'sealed') THEN NULL
    ELSE (
      SELECT b2.bidder_id 
      FROM bids b2 
      WHERE b2.listing_id = b.listing_id 
        AND b2.status != 'rejected'
        AND b2.status != 'expired'
        AND b2.expires_at > NOW()
      ORDER BY b2.amount DESC, b2.created_at ASC
      LIMIT 1
    )
  END as high_bidder_id,
  SUM(CASE WHEN b.status != 'expired' THEN (COALESCE(b.update_count, 0) + 1) ELSE 0 END) as bid_attempts_count
FROM bids b
JOIN listings l ON b.listing_id = l.id
WHERE b.status != 'rejected'
GROUP BY b.listing_id, l.auction_mode;

-- Marketplace Listings View
CREATE OR REPLACE VIEW marketplace_listings AS
SELECT
  l.id,
  l.seller_id,
  l.title,
  l.description,
  l.asked_price,
  l.category,
  l.images,
  l.auction_mode,
  l.status,
  l.created_at,
  l.search_vector,
  l.condition,
  p.full_name AS seller_name,
  p.avatar_url AS seller_avatar,
  p.rating AS seller_rating,
  p.rating_count AS seller_rating_count,
  p.location AS seller_location,
  l.location_lat,
  l.location_lng,
  l.location_address,
  COALESCE(s.bid_count, 0::bigint) AS bid_count,
  COALESCE(s.bid_attempts_count, 0::bigint) AS bid_attempts_count,
  COALESCE(s.high_bid, 0::numeric) AS high_bid,
  s.high_bidder_id,
  l.slug,
  l.ends_at,
  l.go_live_at,
  l.contact_phone
FROM listings l
LEFT JOIN profiles p ON l.seller_id = p.id
LEFT JOIN listing_bid_stats s ON l.id = s.listing_id;

ALTER VIEW marketplace_listings SET (security_invoker = true);

-- Bids Table
CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'ignored')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Business logic constraint: One bid per listing per user (or update existing)
  UNIQUE(listing_id, bidder_id)
);

-- Conversations (Created when bid is accepted)
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id),
  bidder_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages (Real-time chat within a conversation)
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_created_at ON messages(conversation_id, created_at);

-- Auto-update conversation preview on new messages
CREATE OR REPLACE FUNCTION handle_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conversation_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE conversations
    SET last_message = NEW.content,
        updated_at = COALESCE(NEW.created_at, NOW())
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_update_conversation ON messages;
CREATE TRIGGER on_message_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_conversation_last_message();

-- Reviews (Post-deal reputation)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  role TEXT CHECK (role IN ('buyer', 'seller')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, listing_id, role)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('outbid', 'bid_accepted', 'new_message', 'bid_received')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE notifications, messages, conversations;

-- Enforce notification pool per user (15 newest)
CREATE OR REPLACE FUNCTION enforce_notification_pool() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE id IN (
    SELECT id
    FROM notifications
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC, id DESC
    OFFSET 15
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_pool_enforce ON notifications;
CREATE TRIGGER on_notification_pool_enforce
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION enforce_notification_pool();

-- Purge listing-scoped notifications on listing end/remove
CREATE OR REPLACE FUNCTION purge_listing_notifications() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE metadata->>'itemId' = OLD.id::text;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION purge_listing_notifications_on_status() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') AND NEW.status IS DISTINCT FROM OLD.status THEN
    DELETE FROM notifications
    WHERE metadata->>'itemId' = NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_listing_status_purge_notifications ON listings;
CREATE TRIGGER on_listing_status_purge_notifications
  AFTER UPDATE OF status ON listings
  FOR EACH ROW
  EXECUTE FUNCTION purge_listing_notifications_on_status();

DROP TRIGGER IF EXISTS on_listing_delete_purge_notifications ON listings;
CREATE TRIGGER on_listing_delete_purge_notifications
  AFTER DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION purge_listing_notifications();
