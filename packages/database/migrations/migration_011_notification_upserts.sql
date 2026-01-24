-- Migration: Notification Hardening v2 (Handle Upserts)
-- Date: 2026-01-24

CREATE OR REPLACE FUNCTION handle_new_bid_v3() RETURNS TRIGGER AS $$
DECLARE
    v_listing_title TEXT;
    v_seller_id UUID;
    v_prev_high_bidder_id UUID;
    v_prev_high_bid_amount NUMERIC;
BEGIN
    -- Only run if it's an INSERT or the amount has changed in an UPDATE
    IF (TG_OP = 'UPDATE' AND OLD.amount = NEW.amount) THEN
        RETURN NEW;
    END IF;

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
            jsonb_build_object('itemId', NEW.listing_id, 'bidId', NEW.id, 'amount', NEW.amount, 'isUpdate', (TG_OP = 'UPDATE'))
        );
    END IF;

    -- B. Notify Previous FRESH High Bidder
    -- Find the highest FRESH bid that isn't from the current bidder
    SELECT bidder_id, amount INTO v_prev_high_bidder_id, v_prev_high_bid_amount
    FROM bids
    WHERE listing_id = NEW.listing_id
      AND bidder_id != NEW.bidder_id -- Don't notify the person who just bid
      AND status = 'pending' 
      AND expires_at > NOW()
    ORDER BY amount DESC
    LIMIT 1;

    IF v_prev_high_bidder_id IS NOT NULL 
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

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_new_bid ON bids;
CREATE TRIGGER on_new_bid
    AFTER INSERT OR UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_bid_v3();
