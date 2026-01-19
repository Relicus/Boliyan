-- =============================================================================
-- BOLIYAN DATABASE OPTIMIZATION INDEXES
-- =============================================================================
-- Run these in Supabase SQL Editor: https://supabase.com/dashboard
-- 
-- Purpose: Optimize query performance for filtering, sorting, and joins
-- Created: 2026-01-19
-- Related: docs/CACHING_OPTIMIZATION_PLAN.md
-- =============================================================================

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
-- OPTIONAL: BID STATISTICS VIEW
-- -----------------------------------------------------------------------------
-- Uncomment if you want server-side bid aggregation

/*
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
    ORDER BY amount DESC 
    LIMIT 1
  ) as high_bidder_id
FROM bids
WHERE status != 'rejected'
GROUP BY listing_id;

-- Grant access
GRANT SELECT ON listing_bid_stats TO authenticated;
GRANT SELECT ON listing_bid_stats TO anon;
*/

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- -----------------------------------------------------------------------------
-- Run these to verify indexes were created:

-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Check index usage (run after some queries):
-- SELECT relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public';
