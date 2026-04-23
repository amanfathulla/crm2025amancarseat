-- 1. Buang public SELECT policies dari products & product_variations
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Public can read product_variations" ON public.product_variations;

-- 2. Tambah admin SELECT policy (admin masih boleh baca semua kolum)
CREATE POLICY "Admin session can read products"
ON public.products FOR SELECT
USING (is_valid_admin_session());

CREATE POLICY "Admin session can read product_variations"
ON public.product_variations FOR SELECT
USING (is_valid_admin_session());

-- 3. Cipta security-invoker views yang dedahkan hanya kolum selamat (TIADA cost)
CREATE OR REPLACE VIEW public.public_products
WITH (security_invoker = true) AS
SELECT
  id, name, price, category, description, sku, status,
  image_url, image_urls, youtube_url, inventory, sales,
  created_at, updated_at
FROM public.products
WHERE status = 'active' OR status IS NULL;

CREATE OR REPLACE VIEW public.public_product_variations
WITH (security_invoker = true) AS
SELECT
  id, product_id, name, price, inventory, created_at
FROM public.product_variations;

-- 4. Bagi akses awam ke views (bukan jadual asal)
GRANT SELECT ON public.public_products TO anon, authenticated;
GRANT SELECT ON public.public_product_variations TO anon, authenticated;

-- 5. Public bucket listing — hadkan dengan menambah RLS policy yang lebih ketat
-- Buang policy lama yang terlalu terbuka (jika ada) untuk product-images
DROP POLICY IF EXISTS "Public can list product-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Hanya benarkan SELECT objek individu dengan nama spesifik (tidak boleh senarai semua)
CREATE POLICY "Public can read product images by name"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'product-images'
  AND name IS NOT NULL
);