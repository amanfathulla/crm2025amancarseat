
-- 1. Recreate views without SECURITY DEFINER (defaults to security_invoker style behavior on views)
DROP VIEW IF EXISTS public.public_products;
CREATE VIEW public.public_products
WITH (security_invoker = true) AS
SELECT id, name, price, category, description, sku, status, image_url,
       image_urls, youtube_url, inventory, sales, created_at, updated_at
FROM public.products
WHERE status = 'active' OR status IS NULL;

DROP VIEW IF EXISTS public.public_product_variations;
CREATE VIEW public.public_product_variations
WITH (security_invoker = true) AS
SELECT id, product_id, name, price, inventory, created_at
FROM public.product_variations;

-- Allow anon/authenticated to read the views (since underlying tables block them, add permissive policies via grants only — views still respect RLS, so we add SELECT policies on base tables limited to non-sensitive columns isn't trivial; instead we keep base RLS and grant SELECT on views).
GRANT SELECT ON public.public_products TO anon, authenticated;
GRANT SELECT ON public.public_product_variations TO anon, authenticated;

-- Because security_invoker views enforce RLS of the caller, we must add a public SELECT policy
-- on products/product_variations limited to active products. Without it, anon callers will get nothing.
-- To keep cost columns safe, we keep the existing admin-only policies AND add anon SELECT policies
-- (anon will still query through the view which excludes cost). However RLS allows row access,
-- not column-level. To prevent direct base-table access exposing cost, we instead grant column-level SELECT.

-- Revoke broad SELECT on base tables from anon/authenticated, then grant only safe columns.
REVOKE SELECT ON public.products FROM anon, authenticated;
REVOKE SELECT ON public.product_variations FROM anon, authenticated;

GRANT SELECT (id, name, price, category, description, sku, status, image_url, image_urls, youtube_url, inventory, sales, created_at, updated_at)
  ON public.products TO anon, authenticated;
GRANT SELECT (id, product_id, name, price, inventory, created_at)
  ON public.product_variations TO anon, authenticated;

-- Add public SELECT RLS policies for active products / all variations so the views return rows.
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (status = 'active' OR status IS NULL);

DROP POLICY IF EXISTS "Public can read product_variations" ON public.product_variations;
CREATE POLICY "Public can read product_variations"
ON public.product_variations FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Explicit deny policies on admins and api_keys
DROP POLICY IF EXISTS "No public access to admins" ON public.admins;
CREATE POLICY "No public access to admins"
ON public.admins FOR ALL
TO public
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No public access to api_keys" ON public.api_keys;
CREATE POLICY "No public access to api_keys"
ON public.api_keys FOR ALL
TO public
USING (false) WITH CHECK (false);
