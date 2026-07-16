
-- v3: most permissive possible anon policy. If this still blocks, a RESTRICTIVE
-- policy exists and must be removed (see diag_customer_policies.sql).
DROP POLICY IF EXISTS "anon_all_customers_v3" ON public.customers;
CREATE POLICY "anon_all_customers_v3"
  ON public.customers
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
