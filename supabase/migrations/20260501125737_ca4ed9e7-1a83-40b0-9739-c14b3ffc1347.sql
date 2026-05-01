
-- Add columns to customers table for seat reference images and notes
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS seat_image_front text,
  ADD COLUMN IF NOT EXISTS seat_image_back text,
  ADD COLUMN IF NOT EXISTS seat_image_third_row text,
  ADD COLUMN IF NOT EXISTS additional_notes text;

-- Create public storage bucket for customer seat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-seat-images', 'customer-seat-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can upload (anon customers placing orders)
CREATE POLICY "Public can upload customer seat images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'customer-seat-images');

-- Public can view images (bucket is public)
CREATE POLICY "Public can view customer seat images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'customer-seat-images');

-- Only admin sessions can delete
CREATE POLICY "Admin can delete customer seat images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'customer-seat-images' AND is_valid_admin_session());
