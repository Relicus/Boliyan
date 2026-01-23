-- Migration: Enable RLS and add policies for Bids
-- Date: 2026-01-23

-- 1. Enable RLS on Bids Table
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS Policies for Bids

-- Policy: Users can view their own bids
DROP POLICY IF EXISTS "Users can view own bids" ON bids;
CREATE POLICY "Users can view own bids"
ON bids FOR SELECT
USING ((SELECT auth.uid()) = bidder_id);

-- Policy: Sellers can view bids on their listings
DROP POLICY IF EXISTS "Sellers can view bids on own listings" ON bids;
CREATE POLICY "Sellers can view bids on own listings"
ON bids FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM listings
        WHERE listings.id = bids.listing_id
        AND listings.seller_id = (SELECT auth.uid())
    )
);

-- Policy: Public can view public bids (auction_mode = 'visible')
DROP POLICY IF EXISTS "Public can view visible bids" ON bids;
CREATE POLICY "Public can view visible bids"
ON bids FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM listings
        WHERE listings.id = bids.listing_id
        AND listings.auction_mode = 'visible'
    )
);

-- Policy: Authenticated users can place bids
DROP POLICY IF EXISTS "Users can place bids" ON bids;
CREATE POLICY "Users can place bids"
ON bids FOR INSERT
WITH CHECK (
    (SELECT auth.uid()) = bidder_id
    AND EXISTS (
        SELECT 1 FROM listings
        WHERE listings.id = listing_id
        AND listings.seller_id != (SELECT auth.uid())
        AND listings.status = 'active'
    )
);

-- Policy: Users can update their own bids
DROP POLICY IF EXISTS "Users can update own bids" ON bids;
CREATE POLICY "Users can update own bids"
ON bids FOR UPDATE
USING ((SELECT auth.uid()) = bidder_id)
WITH CHECK ((SELECT auth.uid()) = bidder_id);
