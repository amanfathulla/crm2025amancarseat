-- Add missing columns to the coupons table so per-material coupon
-- eligibility and landing-page featuring actually persist in the DB.
-- Run this ONCE in the Supabase SQL Editor, then refresh the app.

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS applicable_materials text[] NULL,
  ADD COLUMN IF NOT EXISTS is_featured_landing boolean NOT NULL DEFAULT false;
