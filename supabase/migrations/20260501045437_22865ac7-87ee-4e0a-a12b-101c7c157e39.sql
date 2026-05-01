ALTER VIEW public.public_products SET (security_invoker = false);
ALTER VIEW public.public_product_variations SET (security_invoker = false);

GRANT SELECT ON public.public_products TO anon, authenticated;
GRANT SELECT ON public.public_product_variations TO anon, authenticated;