-- Migration: Automate Notification Triggers
-- Date: 2026-01-19
-- Description: Adds triggers to automatically generate notifications for bids, outbids, acceptances, and messages.

-- 1. Trigger Function: Handle New Bids (Seller Alert & Outbid Alert)
CREATE OR REPLACE FUNCTION handle_new_bid() RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
    v_seller_id UUID;
    v_prev_high_bidder_id UUID;
    v_prev_high_bid_amount NUMERIC;
BEGIN
    -- Get Listing Details
    SELECT title, seller_id INTO v_listing_title, v_seller_id
    FROM listings
    WHERE id = NEW.listing_id;

    -- A. Notify Seller (Bid Received)
    -- Don't notify if seller bids on their own item (unlikely but possible in dev)
    IF v_seller_id != NEW.bidder_id THEN
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            v_seller_id,
            'bid_received',
            'New Bid Received',
            'You received a bid of ' || NEW.amount || ' on ' || v_listing_title,
            '/item/' || NEW.listing_id,
            jsonb_build_object('itemId', NEW.listing_id, 'bidId', NEW.id, 'amount', NEW.amount)
        );
    END IF;

    -- B. Notify Previous High Bidder (Outbid)
    -- Find the highest bid that isn't the new one
    SELECT bidder_id, amount INTO v_prev_high_bidder_id, v_prev_high_bid_amount
    FROM bids
    WHERE listing_id = NEW.listing_id
      AND id != NEW.id
      AND status != 'rejected' -- Don't count rejected bids
    ORDER BY amount DESC
    LIMIT 1;

    -- If a previous high bidder exists, is different from the new bidder, and the new bid is higher
    IF v_prev_high_bidder_id IS NOT NULL 
       AND v_prev_high_bidder_id != NEW.bidder_id 
       AND NEW.amount > v_prev_high_bid_amount THEN
       
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            v_prev_high_bidder_id,
            'outbid',
            'You''ve been outbid!',
            'Someone placed a higher bid on ' || v_listing_title,
            '/item/' || NEW.listing_id,
            jsonb_build_object('itemId', NEW.listing_id, 'newAmount', NEW.amount)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger Function: Handle Bid Acceptance
CREATE OR REPLACE FUNCTION handle_bid_status_change() RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
BEGIN
    -- Only trigger when status changes to 'accepted'
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        
        SELECT title INTO v_listing_title
        FROM listings
        WHERE id = NEW.listing_id;

        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            NEW.bidder_id,
            'bid_accepted',
            'Bid Accepted!',
            'Your bid on ' || v_listing_title || ' has been accepted.',
            '/item/' || NEW.listing_id, -- Could link to chat/checkout later
            jsonb_build_object('itemId', NEW.listing_id, 'bidId', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger Function: Handle New Messages
CREATE OR REPLACE FUNCTION handle_new_message() RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_listing_id UUID;
    v_listing_title TEXT;
    v_sender_name TEXT;
BEGIN
    -- Get Conversation Details
    SELECT 
        CASE 
            WHEN seller_id = NEW.sender_id THEN bidder_id
            ELSE seller_id 
        END,
        listing_id
    INTO v_recipient_id, v_listing_id
    FROM conversations
    WHERE id = NEW.conversation_id;

    -- Get Listing Title
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = v_listing_id;

    -- Get Sender Name (Optional, could just say "New Message")
    SELECT full_name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Insert Notification
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
        v_recipient_id,
        'new_message',
        'New Message',
        COALESCE(v_sender_name, 'Someone') || ' sent you a message about ' || v_listing_title,
        '/inbox?conversation=' || NEW.conversation_id,
        jsonb_build_object('conversationId', NEW.conversation_id, 'senderId', NEW.sender_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Triggers
DROP TRIGGER IF EXISTS on_new_bid ON bids;
CREATE TRIGGER on_new_bid
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_bid();

DROP TRIGGER IF EXISTS on_bid_status_change ON bids;
CREATE TRIGGER on_bid_status_change
    AFTER UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION handle_bid_status_change();

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message();
