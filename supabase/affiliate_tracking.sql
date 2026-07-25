-- ============================================================
-- AFFILIATE TRACKING (storefront side)
-- Run ONCE in Supabase SQL Editor.
-- Lets the public storefront record clicks + orders for an affiliate
-- by referral code, bypassing RLS (SECURITY DEFINER).
-- ============================================================

-- Record a click when a visitor lands on /order?ref=CODE
CREATE OR REPLACE FUNCTION public.record_affiliate_click(p_ref text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aid text;
BEGIN
  SELECT affiliate_id INTO aid
    FROM public.affiliates
    WHERE referral_code = p_ref AND status = 'active';
  IF aid IS NOT NULL THEN
    INSERT INTO public.affiliate_clicks (affiliate_id, source)
      VALUES (aid, 'storefront');
  END IF;
END;
$$;

-- Mask a customer name: "Ahmad" -> "A***", "Siti Nurhaliza" -> "S***"
CREATE OR REPLACE FUNCTION public.mask_customer_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  n text := trim(p_name);
  len int;
BEGIN
  len := length(n);
  IF len <= 1 THEN RETURN n; END IF;
  IF len = 2 THEN RETURN left(n,1) || '*'; END IF;
  RETURN left(n,1) || repeat('*', len - 2) || right(n,1);
END;
$$;

-- Record an order -> commission for the affiliate (pending, masked customer)
CREATE OR REPLACE FUNCTION public.record_affiliate_order(
  p_ref text,
  p_order_id text,
  p_material text,
  p_order_amount numeric,
  p_commission_amount numeric,
  p_customer_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aid text;
BEGIN
  SELECT affiliate_id INTO aid
    FROM public.affiliates
    WHERE referral_code = p_ref AND status = 'active';
  IF aid IS NOT NULL THEN
    INSERT INTO public.affiliate_commissions
      (affiliate_id, order_id, customer_name_masked, car_model, material, order_amount, commission_amount, status)
    VALUES
      (aid, p_order_id, public.mask_customer_name(p_customer_name), NULL, p_material, p_order_amount, p_commission_amount, 'pending');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_affiliate_click(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mask_customer_name(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_order(text,text,text,numeric,numeric,text) TO anon, authenticated;
