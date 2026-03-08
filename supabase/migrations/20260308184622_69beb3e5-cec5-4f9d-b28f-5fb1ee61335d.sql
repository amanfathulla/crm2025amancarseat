-- Create billplz_settings table to store configurable Billplz credentials
CREATE TABLE IF NOT EXISTS public.billplz_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL DEFAULT '',
  x_signature_key TEXT NOT NULL DEFAULT '',
  collection_id TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only ever one row
ALTER TABLE public.billplz_settings ENABLE ROW LEVEL SECURITY;

-- Admin session can read and write
CREATE POLICY "Admin session can read billplz_settings"
  ON public.billplz_settings FOR SELECT
  USING (public.is_valid_admin_session());

CREATE POLICY "Admin session can upsert billplz_settings"
  ON public.billplz_settings FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- Seed with current env-based values as placeholder (empty, user will fill via UI)
INSERT INTO public.billplz_settings (api_key, x_signature_key, collection_id)
VALUES ('', '', '')
ON CONFLICT DO NOTHING;