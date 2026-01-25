-- Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
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
  condition TEXT CHECK (condition IN ('new', 'like_new', 'used', 'fair')) DEFAULT 'used',
  auction_mode TEXT CHECK (auction_mode IN ('hidden', 'visible', 'sealed')) DEFAULT 'visible',
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled', 'hidden')) DEFAULT 'active',
  ends_at TIMESTAMP WITH TIME ZONE,
  search_vector TSVECTOR,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_slug ON listings(slug);

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
