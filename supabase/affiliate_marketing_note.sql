-- Add a marketing note column to affiliate_settings (admin-editable note shown to affiliates)
ALTER TABLE public.affiliate_settings ADD COLUMN IF NOT EXISTS marketing_note text;
