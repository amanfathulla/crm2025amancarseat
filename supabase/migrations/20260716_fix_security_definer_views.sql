
-- Fix Supabase linter ERROR: SECURITY DEFINER views.
-- admin_products / admin_product_variations were created WITH (security_invoker = false),
-- which runs the view as the owner (SECURITY DEFINER) instead of the querying user.
-- Switch to security_invoker = true so RLS / session checks apply to the caller.
-- The WHERE is_valid_admin_session() still gates access: anon -> empty, admin -> full data.

ALTER VIEW public.admin_products SET (security_invoker = true);
ALTER VIEW public.admin_product_variations SET (security_invoker = true);
