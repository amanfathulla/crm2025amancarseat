
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE code = p_code AND is_active = true;
END;
$$;
