-- Migration: Sync schema with frontend types
-- Date: 2026-01-14

-- 1. Update listings table with missing columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS expiry_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_duration INTEGER CHECK (listing_duration IN (24, 48, 72));
ALTER TABLE listings ADD COLUMN IF NOT EXISTS current_high_bidder_id UUID REFERENCES profiles(id);

-- 2. Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_id)
);

-- 3. Add index for watchlist lookups
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON watchlist(user_id);

-- 4. Enable RLS on watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for watchlist
CREATE POLICY "Users can view their own watchlist" 
    ON watchlist FOR SELECT 
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can add to their own watchlist" 
    ON watchlist FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can remove from their own watchlist" 
    ON watchlist FOR DELETE 
    USING ((SELECT auth.uid()) = user_id);
