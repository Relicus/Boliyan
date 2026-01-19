-- Revert listing_bid_stats to SECURITY DEFINER to fix access to private bids
-- Date: 2026-01-19

DO $$
BEGIN
    -- The previous migration set this to true, which caused listing_bid_stats to run as the USER.
    -- If the user (public/authenticated) cannot see ALL bids (due to RLS on bids), 
    -- then listing_bid_stats fails to calculate high_bid/count correctly or throws an error if policies interfere.
    
    -- We revert it to false (SECURITY DEFINER) so it runs as the View Owner (admin/postgres)
    -- This allows it to aggregate ALL bids while keeping the 'bids' table RLS strict for direct access.
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'listing_bid_stats') THEN
        ALTER VIEW listing_bid_stats SET (security_invoker = false);
    END IF;
END $$;
