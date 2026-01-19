-- Restore listing_bid_stats to SECURITY DEFINER
-- Date: 2026-01-19

-- CRITICAL FIX:
-- The 'listing_bid_stats' view aggregates bid data (count, max amount).
-- Regular users (and anon) DO NOT have SELECT permission on the raw 'bids' table for privacy reasons
-- (or RLS prevents them from seeing others' bids).
--
-- Therefore, this view MUST be 'SECURITY DEFINER' to execute with the privileges of the view creator,
-- allowing it to calculate aggregates across ALL bids while keeping the raw data secure.
--
-- 'marketplace_listings' remains SECURITY INVOKER because it joins this view with 'listings',
-- and we WANT 'listings' RLS to apply (e.g., hiding drafts/archived items).

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'listing_bid_stats') THEN
        ALTER VIEW listing_bid_stats SET (security_invoker = false);
    END IF;
END $$;
