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
  'iPhone 13 Pro',
  'Graphite iPhone 13 Pro with 256GB storage. Lightly used, battery health 92%, box and cable included.',
  245000,
  'Electronics',
  ARRAY[
    'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=1200&q=80'
  ],
  'visible',
  'active'
);
