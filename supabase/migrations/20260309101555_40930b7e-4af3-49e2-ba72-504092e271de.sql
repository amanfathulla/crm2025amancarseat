
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_amount numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  usage_limit integer NOT NULL DEFAULT 100,
  usage_count integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public can read active coupons (for validation on order page)
CREATE POLICY "Public can read active coupons" ON public.coupons
  FOR SELECT USING (true);

-- Admin can manage coupons
CREATE POLICY "Admin session can insert coupons" ON public.coupons
  FOR INSERT WITH CHECK (is_valid_admin_session());

CREATE POLICY "Admin session can update coupons" ON public.coupons
  FOR UPDATE USING (is_valid_admin_session());

CREATE POLICY "Admin session can delete coupons" ON public.coupons
  FOR DELETE USING (is_valid_admin_session());
