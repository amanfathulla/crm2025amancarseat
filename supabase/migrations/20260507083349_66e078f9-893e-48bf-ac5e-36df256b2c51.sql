
-- 1) Restrict cost columns on products and product_variations
REVOKE ALL ON public.products FROM anon, authenticated;
REVOKE ALL ON public.product_variations FROM anon, authenticated;

GRANT SELECT (id, name, price, category, description, sku, status, image_url, image_urls, youtube_url, inventory, sales, created_at, updated_at)
  ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT SELECT (id, product_id, name, price, inventory, created_at)
  ON public.product_variations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variations TO authenticated;

-- 2) Lock down customer-seat-images: make bucket private and restrict SELECT to admin sessions
UPDATE storage.buckets SET public = false WHERE id = 'customer-seat-images';

DROP POLICY IF EXISTS "Public can view customer seat images" ON storage.objects;
CREATE POLICY "Admin can view customer seat images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'customer-seat-images' AND public.is_valid_admin_session());

-- 3) Tighten coupons public SELECT policy
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
CREATE POLICY "Public can read active coupons"
  ON public.coupons FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND valid_until > now());
