BEGIN;
SELECT plan(4);

-- 1. Test Listing Creation
SELECT has_table('listings');

-- 2. Test Bidding Constraints (70% Rule)
-- Insert a test listing
INSERT INTO listings (id, asked_price, title) VALUES ('00000000-0000-0000-0000-000000000001', 1000, 'Test Item');

-- Test 1: Valid bid (70%)
SELECT lives_ok(
    $$ INSERT INTO bids (listing_id, amount) VALUES ('00000000-0000-0000-0000-000000000001', 700) $$,
    'Should allow a bid of 70% of asked price'
);

-- Test 2: Invalid bid (69%)
SELECT throws_ok(
    $$ INSERT INTO bids (listing_id, amount) VALUES ('00000000-0000-0000-0000-000000000001', 699) $$,
    'P0001', -- Custom exception code or generic
    NULL, -- We don't check the exact message here but we could
    'Should block a bid below 70% of asked price'
);

SELECT * FROM finish();
ROLLBACK;
