CREATE TABLE IF NOT EXISTS public.pixel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_pixel_id text NOT NULL DEFAULT '',
  meta_enabled boolean NOT NULL DEFAULT false,
  tiktok_pixel_id text NOT NULL DEFAULT '',
  tiktok_enabled boolean NOT NULL DEFAULT false,
  gtm_id text NOT NULL DEFAULT '',
  gtm_enabled boolean NOT NULL DEFAULT false,
  ga4_id text NOT NULL DEFAULT '',
  ga4_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pixel_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.pixel_settings TO authenticated;
GRANT ALL ON public.pixel_settings TO service_role;

ALTER TABLE public.pixel_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pixel_settings public read" ON public.pixel_settings;
CREATE POLICY "pixel_settings public read" ON public.pixel_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "pixel_settings admin insert" ON public.pixel_settings;
CREATE POLICY "pixel_settings admin insert" ON public.pixel_settings FOR INSERT WITH CHECK (public.is_valid_admin_session());

DROP POLICY IF EXISTS "pixel_settings admin update" ON public.pixel_settings;
CREATE POLICY "pixel_settings admin update" ON public.pixel_settings FOR UPDATE USING (public.is_valid_admin_session()) WITH CHECK (public.is_valid_admin_session());

DROP TRIGGER IF EXISTS update_pixel_settings_updated_at ON public.pixel_settings;
CREATE TRIGGER update_pixel_settings_updated_at BEFORE UPDATE ON public.pixel_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pixel_settings (meta_pixel_id)
SELECT '' WHERE NOT EXISTS (SELECT 1 FROM public.pixel_settings);