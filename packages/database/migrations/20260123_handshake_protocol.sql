-- Phase 7: Reputation & Handshake Protocol

-- 1. Add Confirmation Timestamps to Conversations (The "Handshake")
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN DEFAULT FALSE GENERATED ALWAYS AS (seller_confirmed_at IS NOT NULL AND buyer_confirmed_at IS NOT NULL) STORED;

-- 2. Add Final Buyer Tracking to Listings
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS final_buyer_id UUID REFERENCES profiles(id);

-- 3. Add Reputation Metrics to Profiles (Denormalized for Performance)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS seller_success_rate INTEGER DEFAULT 100, -- Percentage (0-100)
ADD COLUMN IF NOT EXISTS buyer_success_rate INTEGER DEFAULT 100, -- Percentage (0-100)
ADD COLUMN IF NOT EXISTS deals_sealed_count INTEGER DEFAULT 0;

-- 4. Function to Calculate and Update Reputation
CREATE OR REPLACE FUNCTION update_reputation_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_seller_id UUID;
    v_buyer_id UUID;
    v_total_seller_accepted INTEGER;
    v_total_seller_sealed INTEGER;
    v_total_buyer_accepted INTEGER; -- Bids of theirs that were accepted
    v_total_buyer_sealed INTEGER;
BEGIN
    -- Only run when a conversation becomes sealed
    IF NEW.is_sealed = TRUE AND OLD.is_sealed = FALSE THEN
        v_seller_id := NEW.seller_id;
        v_buyer_id := NEW.bidder_id;

        -- UPDATE SELLER METRICS
        -- Total Accepted: Count conversations where they are seller
        SELECT COUNT(*) INTO v_total_seller_accepted FROM conversations WHERE seller_id = v_seller_id;
        -- Total Sealed: Count sealed conversations
        SELECT COUNT(*) INTO v_total_seller_sealed FROM conversations WHERE seller_id = v_seller_id AND is_sealed = TRUE;
        
        -- Update Profile
        UPDATE profiles 
        SET 
            seller_success_rate = CASE WHEN v_total_seller_accepted = 0 THEN 100 ELSE (v_total_seller_sealed::FLOAT / v_total_seller_accepted::FLOAT * 100)::INTEGER END,
            deals_sealed_count = deals_sealed_count + 1
        WHERE id = v_seller_id;

        -- UPDATE BUYER METRICS
        -- Total Accepted: Count conversations where they are bidder
        SELECT COUNT(*) INTO v_total_buyer_accepted FROM conversations WHERE bidder_id = v_buyer_id;
        -- Total Sealed
        SELECT COUNT(*) INTO v_total_buyer_sealed FROM conversations WHERE bidder_id = v_buyer_id AND is_sealed = TRUE;
        
        UPDATE profiles
        SET buyer_success_rate = CASE WHEN v_total_buyer_accepted = 0 THEN 100 ELSE (v_total_buyer_sealed::FLOAT / v_total_buyer_accepted::FLOAT * 100)::INTEGER END
        WHERE id = v_buyer_id;
        
        -- AUTO-COMPLETE LISTING
        -- Mark listing as completed and set final buyer
        UPDATE listings
        SET status = 'completed', final_buyer_id = v_buyer_id
        WHERE id = NEW.listing_id;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for Reputation Update
DROP TRIGGER IF EXISTS tr_update_reputation ON conversations;
CREATE TRIGGER tr_update_reputation
AFTER UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_reputation_metrics();
