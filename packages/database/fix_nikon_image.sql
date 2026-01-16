-- Fix the Nikon image (replace the missing 'camera.jpg' with a real Unsplash URL)
-- This ensures it looks good in the grid without needing manual bucket uploads.

UPDATE listings
SET images = ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop']
WHERE title = 'Vintage Nikon F3';
