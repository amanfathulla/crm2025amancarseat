GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.product_variations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variations TO authenticated;
GRANT ALL ON public.product_variations TO service_role;

GRANT SELECT ON public.category_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_settings TO authenticated;
GRANT ALL ON public.category_settings TO service_role;