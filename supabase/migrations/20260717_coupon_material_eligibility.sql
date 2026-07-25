-- Add material eligibility column to coupons table
-- Stores which material categories the coupon applies to
-- NULL or empty array = applies to all materials
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS eligible_materials text[] DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.coupons.eligible_materials IS 
  'Array of material category names this coupon is valid for. NULL = all materials. Values: Kain Mesh, Kain Nylon, Kain Fullsilk, Semi Leather Kalis Air';
