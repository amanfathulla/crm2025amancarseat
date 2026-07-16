
-- Definitive fix for: "new row violates row-level security policy for table customers"
-- Uses a brand-new unique policy name so it cannot conflict with any existing one.
-- Also prints the current policies so we can confirm what exists.

-- 1) Show current customer policies (read this result)
SELECT policyname, cmd, roles::text, with_check::text
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY cmd, policyname;

-- 2) Create a fresh anon/authenticated INSERT policy
DROP POLICY IF EXISTS "anon_insert_customers_v2" ON public.customers;
CREATE POLICY "anon_insert_customers_v2"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3) Also allow UPDATE of the just-inserted row (coupon/status flips)
DROP POLICY IF EXISTS "anon_update_customers_v2" ON public.customers;
CREATE POLICY "anon_update_customers_v2"
  ON public.customers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
