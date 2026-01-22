-- ==========================================
-- SUPABASE STORAGE SETUP FOR BOLIYAN
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create the 'listings' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow Public Access to view images
-- This ensures images load for all users on the marketplace.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'listings' );

-- 4. Policy: Allow Authenticated Users to Upload
-- Restricted to the 'listings' bucket and their own folder (userId/).
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Allow Users to Delete their own images
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Allow Users to Update their own images (optional but recommended)
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
