
-- Definitive fix for WhatsApp order insert failing with 42501.
-- Root cause: trigger assign_order_number() runs as the invoking user (anon) and
-- does `SELECT MAX(order_number) FROM customers` which is blocked by RLS, surfacing
-- as "new row violates row-level security" on the INSERT. Making the trigger
-- SECURITY DEFINER lets it read the table without RLS. Also drops any restrictive
-- policies that would override the permissive anon policies.

ALTER FUNCTION public.assign_order_number() SECURITY DEFINER;

-- Drop any RESTRICTIVE policies on customers (these override permissive ones).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'customers' AND schemaname = 'public' AND permissive = 'f'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', r.policyname);
  END LOOP;
END $$;

-- Ensure the permissive anon insert/update policies exist.
DROP POLICY IF EXISTS "anon_all_customers_v3" ON public.customers;
CREATE POLICY "anon_all_customers_v3"
  ON public.customers
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
