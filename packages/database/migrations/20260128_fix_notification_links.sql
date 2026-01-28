-- Migration: fix_notification_links
-- Created: 2026-01-28
-- Description: Fix notification link parameters for proper navigation
--   1. handle_new_message: ?conversation= -> ?id= (inbox expects ?id=)
--   2. handle_new_conversation: /inbox -> /dashboard?tab=active-bids (buyer sees contact buttons)
--   3. handle_bid_status_change: /item/ -> /dashboard?tab=active-bids

-- Fix 1: handle_new_message - change ?conversation= to ?id=
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
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

    -- Get Sender Name
    SELECT full_name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Insert Notification with FIXED link (was ?conversation=, now ?id=)
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
        v_recipient_id,
        'new_message',
        'New Message',
        COALESCE(v_sender_name, 'Someone') || ' sent you a message about ' || v_listing_title,
        '/inbox?id=' || NEW.conversation_id,
        jsonb_build_object('conversationId', NEW.conversation_id, 'senderId', NEW.sender_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: handle_new_conversation - link to dashboard/active-bids instead of inbox
CREATE OR REPLACE FUNCTION handle_new_conversation()
RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
BEGIN
    -- This runs when a seller accepts a bid and a conversation is created
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = NEW.listing_id;

    -- Notify the Bidder - FIXED: link to dashboard active-bids tab
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
        NEW.bidder_id,
        'bid_accepted',
        'Deal Accepted! 🚀',
        'The seller accepted your bid for ' || v_listing_title || '. Chat now to finalize!',
        '/dashboard?tab=active-bids&id=' || NEW.listing_id,
        jsonb_build_object('itemId', NEW.listing_id, 'conversationId', NEW.id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: handle_bid_status_change - link to dashboard/active-bids instead of /item/
CREATE OR REPLACE FUNCTION handle_bid_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
BEGIN
    -- Only trigger when status changes to 'accepted'
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        
        SELECT title INTO v_listing_title
        FROM listings
        WHERE id = NEW.listing_id;

        -- FIXED: link to dashboard active-bids tab
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
            NEW.bidder_id,
            'bid_accepted',
            'Bid Accepted!',
            'Your bid on ' || v_listing_title || ' has been accepted.',
            '/dashboard?tab=active-bids&id=' || NEW.listing_id,
            jsonb_build_object('itemId', NEW.listing_id, 'bidId', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
