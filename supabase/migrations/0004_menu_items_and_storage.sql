-- Migration: Create menu-images storage bucket and set up RLS policies for menu_items and storage.objects
-- Created: 2026-07-24

-- 1. Create the 'menu-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist to allow rerunning the script safely
DROP POLICY IF EXISTS "Allow public read-only access to menu images" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff to upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff to update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff to delete menu images" ON storage.objects;

-- 3. Set up RLS policies for storage.objects under 'menu-images' bucket

-- Policy A: Allow public read-only access to menu-images
CREATE POLICY "Allow public read-only access to menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Policy B: Allow authenticated staff to upload menu images to their own restaurant folder
CREATE POLICY "Allow staff to upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images' AND
  (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id::text = split_part(name, '/', 1)
  ))
);

-- Policy C: Allow authenticated staff to update menu images in their own restaurant folder
CREATE POLICY "Allow staff to update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id::text = split_part(name, '/', 1)
  ))
)
WITH CHECK (
  bucket_id = 'menu-images' AND
  (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id::text = split_part(name, '/', 1)
  ))
);

-- Policy D: Allow authenticated staff to delete menu images in their own restaurant folder
CREATE POLICY "Allow staff to delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id::text = split_part(name, '/', 1)
  ))
);

-- 4. Set up RLS policies for menu_items table
-- Drop existing policies if any to avoid errors
DROP POLICY IF EXISTS "Allow staff to insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow staff to update menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow staff to delete menu items" ON menu_items;

-- Policy A: Allow staff to insert menu items for their own restaurant
CREATE POLICY "Allow staff to insert menu items"
ON menu_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id = menu_items.restaurant_id
  )
);

-- Policy B: Allow staff to update menu items for their own restaurant
CREATE POLICY "Allow staff to update menu items"
ON menu_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id = menu_items.restaurant_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id = menu_items.restaurant_id
  )
);

-- Policy C: Allow staff to delete menu items for their own restaurant
CREATE POLICY "Allow staff to delete menu items"
ON menu_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.restaurant_id = menu_items.restaurant_id
  )
);
