GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variations TO authenticated;
GRANT ALL ON public.product_variations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_settings TO authenticated;
GRANT ALL ON public.category_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_settings TO authenticated;
GRANT ALL ON public.shipping_settings TO service_role;

GRANT SELECT ON public.admin_products TO anon, authenticated;
GRANT SELECT ON public.admin_product_variations TO anon, authenticated;