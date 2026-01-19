-- Add full-text search column to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate search vector with existing data
UPDATE listings SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C');

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(search_vector);

-- Trigger to auto-update search vector on insert/update
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_search_vector_update ON listings;

CREATE TRIGGER listings_search_vector_update
BEFORE INSERT OR UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_listing_search_vector();

-- Add location columns if not present (for distance sorting)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Popular searches table for suggestions
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own search history
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history"
ON search_history FOR SELECT
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
CREATE POLICY "Users can insert own search history"
ON search_history FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Categories table for structured navigation
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, -- e.g., 'electronics', 'vehicles'
  name TEXT NOT NULL,
  icon TEXT, -- Lucide icon name
  parent_id TEXT REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0
);

-- Seed default categories
INSERT INTO categories (id, name, icon, sort_order) VALUES
  ('electronics', 'Electronics', 'Smartphone', 1),
  ('vehicles', 'Vehicles', 'Car', 2),
  ('property', 'Property', 'Home', 3),
  ('fashion', 'Fashion', 'Shirt', 4),
  ('furniture', 'Furniture', 'Sofa', 5),
  ('sports', 'Sports', 'Dumbbell', 6),
  ('books', 'Books', 'BookOpen', 7),
  ('other', 'Other', 'Package', 99)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;
