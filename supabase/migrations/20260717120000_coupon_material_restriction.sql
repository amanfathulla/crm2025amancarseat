-- Add material eligibility + landing-page featured flag to coupons

ALTER TABLE public.coupons
  ADD COLUMN applicable_materials text[] DEFAULT NULL,
  ADD COLUMN is_featured_landing boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.coupons.applicable_materials IS
  'Material labels (e.g. "Kain Mesh", "Semi Leather Kalis Air") this coupon is valid for. NULL or empty array = valid for all materials.';

COMMENT ON COLUMN public.coupons.is_featured_landing IS
  'If true, this coupon code is shown on the main landing page "Order Sekarang" button. Only one coupon can be featured at a time.';

-- Enforce only ONE featured landing coupon at a time at the DB level
CREATE UNIQUE INDEX idx_coupons_single_featured_landing
  ON public.coupons (is_featured_landing)
  WHERE is_featured_landing = true;
