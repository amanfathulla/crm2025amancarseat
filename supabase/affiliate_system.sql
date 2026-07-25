-- ============================================================
-- AFFILIATE MANAGEMENT SYSTEM
-- Run ONCE in the Supabase SQL Editor, then refresh the app.
-- ============================================================

-- Helper: returns true when the request carries the admin session header
-- (mirrors how the existing admin client authenticates).
CREATE OR REPLACE FUNCTION public.is_admin_session()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_headers jsonb;
  v_token text;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::jsonb;
    v_token := v_headers->>'x-admin-session';
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  RETURN v_token IS NOT NULL AND v_token <> '';
END;
$$;

-- ------------------------------------------------------------
-- affiliates: profile + auth link + referral
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id text UNIQUE NOT NULL,          -- e.g. AFF00125
  referral_code text UNIQUE NOT NULL,         -- e.g. AHMADZAKI01
  name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  status text NOT NULL DEFAULT 'pending',    -- pending | active | rejected | frozen
  created_at timestamptz NOT NULL DEFAULT now(),
  frozen_until timestamptz,
  custom_freeze_date date
);

-- ------------------------------------------------------------
-- affiliate_clicks: referral link clicks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id text NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  source text
);

-- ------------------------------------------------------------
-- affiliate_commissions: per-order commission records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id text NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
  order_id text,
  customer_name_masked text,
  car_model text,
  material text,
  order_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',       -- pending | approved | paid
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- ------------------------------------------------------------
-- affiliate_withdrawals: payout requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id text NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',        -- pending | approved | paid
  method text,
  account text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- ------------------------------------------------------------
-- affiliate_settings: global freeze rules (single row)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id int PRIMARY KEY DEFAULT 1,
  freeze_months int NOT NULL DEFAULT 3,
  custom_freeze_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.affiliate_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- products: per-product fixed affiliate commission (RM)
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS affiliate_commission numeric NOT NULL DEFAULT 0;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

-- affiliates: owner (by auth user) + admin
DROP POLICY IF EXISTS "affiliates owner" ON public.affiliates;
CREATE POLICY "affiliates owner" ON public.affiliates
  FOR ALL USING (user_id = auth.uid() OR public.is_admin_session()) WITH CHECK (user_id = auth.uid() OR public.is_admin_session());

DROP POLICY IF EXISTS "affiliate_clicks owner" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks owner" ON public.affiliate_clicks
  FOR ALL USING (
    affiliate_id IN (SELECT affiliate_id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.is_admin_session()
  ) WITH CHECK (
    affiliate_id IN (SELECT affiliate_id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.is_admin_session()
  );

DROP POLICY IF EXISTS "affiliate_commissions owner" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions owner" ON public.affiliate_commissions
  FOR ALL USING (
    affiliate_id IN (SELECT affiliate_id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.is_admin_session()
  ) WITH CHECK (
    affiliate_id IN (SELECT affiliate_id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.is_admin_session()
  );

DROP POLICY IF EXISTS "affiliate_withdrawals owner" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals owner" ON public.affiliate_withdrawals
  FOR ALL USING (
    affiliate_id IN (SELECT affiliate_id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.is_admin_session()
  ) WITH CHECK (
    affiliate_id IN (SELECT affiliate_id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.is_admin_session()
  );

DROP POLICY IF EXISTS "affiliate_settings admin" ON public.affiliate_settings;
CREATE POLICY "affiliate_settings admin" ON public.affiliate_settings
  FOR SELECT USING (public.is_admin_session() OR true);

-- ------------------------------------------------------------
-- RPC: admin approves / rejects an affiliate
-- (status: 'active' | 'rejected')
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_affiliate_status(p_affiliate_id text, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_session() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.affiliates SET status = p_status WHERE affiliate_id = p_affiliate_id;
END;
$$;

-- ------------------------------------------------------------
-- RPC: admin lists pending affiliates (id, name, whatsapp, created_at)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_pending_affiliates()
RETURNS TABLE (
  affiliate_id text, name text, whatsapp text, email text, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_session() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT a.affiliate_id, a.name, a.whatsapp, a.email, a.created_at
    FROM public.affiliates a
    WHERE a.status = 'pending'
    ORDER BY a.created_at DESC;
END;
$$;
