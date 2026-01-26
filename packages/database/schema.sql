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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_slug ON listings(slug);

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
