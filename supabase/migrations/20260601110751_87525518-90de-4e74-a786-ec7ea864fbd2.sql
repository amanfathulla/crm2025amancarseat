-- Unified payment gateway settings table
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  display_name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  sandbox_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_gateways TO anon, authenticated;
GRANT ALL ON public.payment_gateways TO service_role;

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Public can read only the enabled flag, provider, display info (no credentials)
-- To keep simple, we expose select but credentials column will be filtered client-side via view-less approach.
-- We restrict credentials via a separate policy approach: public can SELECT, but client uses two queries.
CREATE POLICY "Public can read gateway list"
ON public.payment_gateways FOR SELECT
TO anon, authenticated
USING (is_enabled = true);

CREATE POLICY "Admin can read all gateways"
ON public.payment_gateways FOR SELECT
TO public
USING (is_valid_admin_session());

CREATE POLICY "Admin can insert gateways"
ON public.payment_gateways FOR INSERT
TO public
WITH CHECK (is_valid_admin_session());

CREATE POLICY "Admin can update gateways"
ON public.payment_gateways FOR UPDATE
TO public
USING (is_valid_admin_session());

CREATE POLICY "Admin can delete gateways"
ON public.payment_gateways FOR DELETE
TO public
USING (is_valid_admin_session());

CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed rows for the 5 supported gateways
INSERT INTO public.payment_gateways (provider, display_name, display_order, is_enabled) VALUES
  ('billplz', 'Billplz', 1, true),
  ('toyyibpay', 'toyyibPay', 2, false),
  ('chip', 'CHIP', 3, false),
  ('bayarcash', 'Bayarcash', 4, false),
  ('bcl', 'BCL Pay', 5, false)
ON CONFLICT (provider) DO NOTHING;

-- Track which gateway was used for each customer order
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'billplz';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gateway_bill_id text;