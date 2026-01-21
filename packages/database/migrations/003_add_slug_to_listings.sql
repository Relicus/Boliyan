-- Add slug column to listings
ALTER TABLE listings ADD COLUMN slug TEXT UNIQUE;

-- Create an index for faster lookups
CREATE INDEX idx_listings_slug ON listings(slug);
