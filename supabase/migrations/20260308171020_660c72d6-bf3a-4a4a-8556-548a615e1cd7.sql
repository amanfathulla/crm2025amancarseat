
-- Fix PUBLIC_DATA_EXPOSURE: Drop the WITH CHECK (true) INSERT policies that allow
-- anonymous users to bypass RLS on customers, orders, and order_items.
-- These are NOT needed because the billplz-create-bill edge function uses
-- SUPABASE_SERVICE_ROLE_KEY which already bypasses RLS.

DROP POLICY IF EXISTS "Public can insert customer orders" ON public.customers;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order_items" ON public.order_items;
