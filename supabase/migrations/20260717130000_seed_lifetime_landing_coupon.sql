-- Seed one permanent, always-active coupon for the main landing page CTA.
-- - Lifetime: valid_until set far in the future (does not expire)
-- - Applies to ALL materials (applicable_materials left NULL = no restriction)
-- - is_featured_landing = true -> this is the code shown on the "Order Sekarang & Jimat" button
--
-- To change the code or discount amount later, just UPDATE this row directly
-- in Supabase (Table Editor -> coupons -> row where is_featured_landing = true).
-- No need to insert a new row or touch the code again.

INSERT INTO public.coupons (
  code,
  discount_amount,
  discount_type,
  usage_limit,
  valid_from,
  valid_until,
  is_active,
  applicable_materials,
  is_featured_landing
)
VALUES (
  'SPECIALACS',
  30,                          -- RM30 off; change anytime via UPDATE
  'fixed',                     -- or 'percentage'
  999999,                      -- effectively unlimited usage
  now(),
  '2099-12-31 23:59:59+08',    -- lifetime, never expires
  true,
  NULL,                        -- NULL = valid for ALL materials
  true                         -- shown as the featured code on the landing page
)
ON CONFLICT (code) DO NOTHING;
