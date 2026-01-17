-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')), -- Who is leaving the review
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One review per user per listing per role
  UNIQUE (reviewer_id, listing_id, role)
);

-- Indexes
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public reputation)
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

-- Users can only insert reviews where they are the reviewer
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- No updates or deletes allowed (immutable reviews)

-- Materialized view for user stats (optional, for performance)
-- For now, we'll calculate on-the-fly with aggregate queries

-- Add rating columns to profiles if needed
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update profile stats after review
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (
      SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) 
      FROM reviews 
      WHERE reviewed_id = NEW.reviewed_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update profile stats
CREATE TRIGGER on_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();
