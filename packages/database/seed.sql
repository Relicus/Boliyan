-- 1. Insert a Dummy User (ID can be random, but we use a fixed one for testing)
-- NOTE: In a real app, users are created by Supabase Auth (GoTrue).
INSERT INTO profiles (id, full_name, avatar_url, location, rating_count, rating)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Demo Seller', 'https://github.com/shadcn.png', 'Karachi', 12, 4.8)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert a Testing Listing
INSERT INTO listings (
  seller_id, 
  title, 
  description, 
  asked_price, 
  category, 
  images, 
  auction_mode,
  status
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Vintage Nikon F3',
  'Classic film camera in excellent condition. Includes 50mm lens.',
  45000,
  'Cameras',
  ARRAY['camera.jpg'], -- Make sure to upload a file named 'camera.jpg' to your 'listings' bucket!
  'visible',
  'active'
);
