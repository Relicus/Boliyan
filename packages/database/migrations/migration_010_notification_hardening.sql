-- Migration: Notification Hardening & Bid Expiration alerts
-- Date: 2026-01-24

-- 1. Trigger Function: Notify on Bid Expiration
CREATE OR REPLACE FUNCTION handle_bid_expiration() RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
BEGIN
    -- Only trigger when status changes to 'expired'
    IF OLD.status != 'expired' AND NEW.status = 'expired' THEN
        
        SELECT title INTO v_listing_title
        FROM listings
        WHERE id = NEW.listing_id;

        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            NEW.bidder_id,
            'outbid', -- Reusing 'outbid' type or we can add 'bid_expired' to enum
            'Bid Expired',
            'Your bid on ' || v_listing_title || ' has left the pool. Bid again to stay in the auction!',
            '/product/' || NEW.listing_id,
            jsonb_build_object('itemId', NEW.listing_id, 'bidId', NEW.id, 'reason', 'expired')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger Function: Notify on Conversation Creation (Deal Accepted)
CREATE OR REPLACE FUNCTION handle_new_conversation() RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
BEGIN
    -- This runs when a seller accepts a bid and a conversation is created
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = NEW.listing_id;

    -- Notify the Bidder
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
        NEW.bidder_id,
        'bid_accepted',
        'Deal Accepted! 🚀',
        'The seller accepted your bid for ' || v_listing_title || '. Chat now to finalize!',
        '/inbox?id=' || NEW.id,
        jsonb_build_object('itemId', NEW.listing_id, 'conversationId', NEW.id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update 'Outbid' logic to be more specific (Optional but good)
-- We keep handle_new_bid as is but ensure it only notifies if the previous high bid was FRESH
CREATE OR REPLACE FUNCTION handle_new_bid_v2() RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
    v_seller_id UUID;
    v_prev_high_bidder_id UUID;
    v_prev_high_bid_amount NUMERIC;
BEGIN
    SELECT title, seller_id INTO v_listing_title, v_seller_id
    FROM listings
    WHERE id = NEW.listing_id;

    -- A. Notify Seller
    IF v_seller_id != NEW.bidder_id THEN
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            v_seller_id,
            'bid_received',
            'New Bid Received',
            'You received a bid of ' || NEW.amount || ' on ' || v_listing_title,
            '/dashboard?tab=active-bids',
            jsonb_build_object('itemId', NEW.listing_id, 'bidId', NEW.id, 'amount', NEW.amount)
        );
    END IF;

    -- B. Notify Previous FRESH High Bidder
    SELECT bidder_id, amount INTO v_prev_high_bidder_id, v_prev_high_bid_amount
    FROM bids
    WHERE listing_id = NEW.listing_id
      AND id != NEW.id
      AND status = 'pending' -- Only notify active bidders
      AND expires_at > NOW() -- Only notify FRESH bidders
    ORDER BY amount DESC
    LIMIT 1;

    IF v_prev_high_bidder_id IS NOT NULL 
       AND v_prev_high_bidder_id != NEW.bidder_id 
       AND NEW.amount > v_prev_high_bid_amount THEN
       
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            v_prev_high_bidder_id,
            'outbid',
            'You''ve been outbid!',
            'Someone placed a higher bid on ' || v_listing_title,
            '/product/' || NEW.listing_id,
            jsonb_build_object('itemId', NEW.listing_id, 'newAmount', NEW.amount)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Hardening
-- Remove the old bid_accepted trigger from bids (it's now on conversations)
DROP TRIGGER IF EXISTS on_bid_status_change ON bids;

-- Replace handle_new_bid
DROP TRIGGER IF EXISTS on_new_bid ON bids;
CREATE TRIGGER on_new_bid
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_bid_v2();

-- Add expiration trigger
DROP TRIGGER IF EXISTS on_bid_expiration ON bids;
CREATE TRIGGER on_bid_expiration
    AFTER UPDATE ON bids
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_bid_expiration();

-- Add conversation trigger
DROP TRIGGER IF EXISTS on_new_conversation ON conversations;
CREATE TRIGGER on_new_conversation
    AFTER INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_conversation();
