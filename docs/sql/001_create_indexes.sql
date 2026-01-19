-- =============================================================================
-- BOLIYAN DATABASE OPTIMIZATION & SETUP SCRIPT
-- =============================================================================
-- Run these in Supabase SQL Editor: https://supabase.com/dashboard
-- 
-- Purpose: Create missing tables, optimize performance with indexes, and add views
-- Created: 2026-01-19
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE MISSING TABLES (If they don't exist)
-- -----------------------------------------------------------------------------

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Search History
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Security) - Simple policies for now
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own data
CREATE POLICY "Users manage their own watchlist" ON watchlist
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own search history" ON search_history
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see their own notifications" ON notifications
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
-- Categories are public
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);


-- -----------------------------------------------------------------------------
-- 2. CREATE INDEXES
-- -----------------------------------------------------------------------------

-- LISTINGS TABLE INDEXES
-- -----------------------------------------------------------------------------

-- Category filter (used in every marketplace view)
CREATE INDEX IF NOT EXISTS idx_listings_category 
ON listings(category);

-- Status filter (active/hidden/sold - used in every query)
CREATE INDEX IF NOT EXISTS idx_listings_status 
ON listings(status);

-- Sort by newest (default sort)
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
ON listings(created_at DESC);

-- Sort by price (luxury filter)
CREATE INDEX IF NOT EXISTS idx_listings_asked_price 
ON listings(asked_price);

-- Composite: Status + Category (most common filter combination)
CREATE INDEX IF NOT EXISTS idx_listings_status_category 
ON listings(status, category);

-- Composite: Status + Created (active items sorted by newest)
CREATE INDEX IF NOT EXISTS idx_listings_status_created 
ON listings(status, created_at DESC);

-- Composite: Status + Price (active items sorted by price)
CREATE INDEX IF NOT EXISTS idx_listings_status_price 
ON listings(status, asked_price DESC);

-- Seller lookup (for seller dashboard)
CREATE INDEX IF NOT EXISTS idx_listings_seller_id 
ON listings(seller_id);

-- Auction mode filter (public/sealed bids)
CREATE INDEX IF NOT EXISTS idx_listings_auction_mode 
ON listings(auction_mode);

-- -----------------------------------------------------------------------------
-- BIDS TABLE INDEXES
-- -----------------------------------------------------------------------------

-- Critical: Lookup bids by listing (used in every card render)
CREATE INDEX IF NOT EXISTS idx_bids_listing_id 
ON bids(listing_id);

-- Composite: Get highest bid per listing efficiently
CREATE INDEX IF NOT EXISTS idx_bids_listing_amount 
ON bids(listing_id, amount DESC);

-- Bidder lookup (for bidder dashboard)
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id 
ON bids(bidder_id);

-- Status filter (pending/accepted/rejected)
CREATE INDEX IF NOT EXISTS idx_bids_status 
ON bids(status);

-- -----------------------------------------------------------------------------
-- WATCHLIST TABLE INDEXES
-- -----------------------------------------------------------------------------

-- User's watchlist lookup
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id 
ON watchlist(user_id);

-- Composite: Check if user is watching a specific item
CREATE INDEX IF NOT EXISTS idx_watchlist_user_listing 
ON watchlist(user_id, listing_id);

-- -----------------------------------------------------------------------------
-- CONVERSATIONS TABLE INDEXES
-- -----------------------------------------------------------------------------

-- Seller's conversations
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id 
ON conversations(seller_id);

-- Bidder's conversations
CREATE INDEX IF NOT EXISTS idx_conversations_bidder_id 
ON conversations(bidder_id);

-- Sort by recent activity
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
ON conversations(updated_at DESC);

-- -----------------------------------------------------------------------------
-- MESSAGES TABLE INDEXES
-- -----------------------------------------------------------------------------

-- Messages per conversation (critical for chat loading)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

-- Composite: Messages in order
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at ASC);

-- Unread messages lookup
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(conversation_id, is_read) 
WHERE is_read = false;

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE INDEXES
-- -----------------------------------------------------------------------------

-- User's notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

-- Unread notifications (for badge count)
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, is_read) 
WHERE is_read = false;

-- -----------------------------------------------------------------------------
-- SEARCH HISTORY TABLE INDEXES
-- -----------------------------------------------------------------------------

-- User's search history (for suggestions)
CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
ON search_history(user_id);

-- Recent searches first
CREATE INDEX IF NOT EXISTS idx_search_history_user_created 
ON search_history(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- PROFILES TABLE INDEXES (if not already indexed)
-- -----------------------------------------------------------------------------

-- Note: Primary key (id) is already indexed
-- Add only if you have lookup patterns not covered

-- -----------------------------------------------------------------------------
-- SERVER-SIDE BID AGGREGATION VIEWS (PHASE 4)
-- -----------------------------------------------------------------------------

-- 1. Helper View: Aggregated stats per listing
-- Calculates count and max bid server-side to avoid downloading all bids
CREATE OR REPLACE VIEW listing_bid_stats AS
SELECT 
  listing_id,
  COUNT(*) as bid_count,
  MAX(amount) as high_bid,
  (
    SELECT bidder_id 
    FROM bids b2 
    WHERE b2.listing_id = bids.listing_id 
      AND b2.status != 'rejected'
    ORDER BY amount DESC, created_at ASC
    LIMIT 1
  ) as high_bidder_id
FROM bids
WHERE status != 'rejected'
GROUP BY listing_id;

-- 2. Master View: Marketplace Listings
-- Joins Listings + Seller Profile + Bid Stats into one queryable virtual table
CREATE OR REPLACE VIEW marketplace_listings AS
SELECT 
  l.*,
  -- Seller Profile Data
  p.full_name as seller_name,
  p.avatar_url as seller_avatar,
  p.rating as seller_rating,
  p.rating_count as seller_rating_count,
  p.location as seller_location,
  -- Bid Stats
  COALESCE(s.bid_count, 0) as bid_count,
  COALESCE(s.high_bid, 0) as high_bid,
  s.high_bidder_id
FROM listings l
LEFT JOIN profiles p ON l.seller_id = p.id
LEFT JOIN listing_bid_stats s ON l.id = s.listing_id;

-- 3. Grant Permissions (Crucial for API Access)
GRANT SELECT ON listing_bid_stats TO authenticated;
GRANT SELECT ON listing_bid_stats TO anon;
GRANT SELECT ON marketplace_listings TO authenticated;
GRANT SELECT ON marketplace_listings TO anon;

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- -----------------------------------------------------------------------------
-- Run these to verify indexes were created:

-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Check index usage (run after some queries):
-- SELECT relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public';
