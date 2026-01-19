-- Fix Security Definer Views & Enable Listings RLS
-- Date: 2026-01-19

-- 1. Fix Views to use SECURITY INVOKER
-- This forces the view to use the permissions of the user calling it, NOT the view creator.
-- This allows RLS policies on the underlying tables (listings, bids) to work correctly.

DO $$
BEGIN
    -- Fix marketplace_listings view
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'marketplace_listings') THEN
        ALTER VIEW marketplace_listings SET (security_invoker = true);
    END IF;

    -- Fix listing_bid_stats view
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'listing_bid_stats') THEN
        ALTER VIEW listing_bid_stats SET (security_invoker = true);
    END IF;
END $$;

-- 2. Enable RLS on Listings Table
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies for Listings

-- Policy: Public Read Access
-- Everyone (anon and authenticated) can search and view listings.
DROP POLICY IF EXISTS "Public read access" ON listings;
CREATE POLICY "Public read access"
ON listings FOR SELECT
USING (true);

-- Policy: Sellers can insert their own listings
DROP POLICY IF EXISTS "Sellers can create listings" ON listings;
CREATE POLICY "Sellers can create listings"
ON listings FOR INSERT
WITH CHECK ((SELECT auth.uid()) = seller_id);

-- Policy: Sellers can update their own listings
DROP POLICY IF EXISTS "Sellers can update own listings" ON listings;
CREATE POLICY "Sellers can update own listings"
ON listings FOR UPDATE
USING ((SELECT auth.uid()) = seller_id)
WITH CHECK ((SELECT auth.uid()) = seller_id);

-- Policy: Sellers can delete their own listings
DROP POLICY IF EXISTS "Sellers can delete own listings" ON listings;
CREATE POLICY "Sellers can delete own listings"
ON listings FOR DELETE
USING ((SELECT auth.uid()) = seller_id);
