-- Create admin-only product views so the CRM can read full product data without exposing base tables publicly
DROP VIEW IF EXISTS public.admin_product_variations;
DROP VIEW IF EXISTS public.admin_products;

CREATE VIEW public.admin_products
WITH (security_invoker = false) AS
SELECT
  id,
  name,
  description,
  category,
  price,
  cost,
  sales,
  image_url,
  sku,
  created_at,
  updated_at,
  status,
  youtube_url,
  image_urls,
  inventory
FROM public.products
WHERE public.is_valid_admin_session();

CREATE VIEW public.admin_product_variations
WITH (security_invoker = false) AS
SELECT
  id,
  product_id,
  name,
  price,
  cost,
  inventory,
  created_at
FROM public.product_variations
WHERE public.is_valid_admin_session();

GRANT SELECT ON public.admin_products TO anon, authenticated;
GRANT SELECT ON public.admin_product_variations TO anon, authenticated;