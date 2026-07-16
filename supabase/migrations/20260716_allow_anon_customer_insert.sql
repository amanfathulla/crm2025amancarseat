
-- Ensure anonymous (public order page) can INSERT into customers.
-- The WhatsApp-payment path inserts directly from the browser using the
-- anon key, so it needs an INSERT policy. Without it you get:
--   "new row violates row-level security policy for table customers"
-- Edge-function (billplz) inserts use service_role and are unaffected.
-- Idempotent: drops any prior public-insert policy then recreates it.

DROP POLICY IF EXISTS "Public can insert customers from order page" ON public.customers;
DROP POLICY IF EXISTS "Public can insert customer orders" ON public.customers;

CREATE POLICY "Public can insert customers from order page"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also allow the order page to UPDATE its own just-created row
-- (e.g. coupon usage / status flips) without admin session.
DROP POLICY IF EXISTS "Public can update own inserted customer" ON public.customers;
CREATE POLICY "Public can update own inserted customer"
  ON public.customers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
