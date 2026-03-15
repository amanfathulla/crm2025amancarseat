ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read category_settings"
  ON public.category_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admin session can manage category_settings"
  ON public.category_settings FOR ALL TO public
  USING (is_valid_admin_session())
  WITH CHECK (is_valid_admin_session());

INSERT INTO public.category_settings (name, is_enabled) VALUES
  ('Kain Mesh', true),
  ('Kain Nylon', true),
  ('Kain Fullsilk', true),
  ('Semi Leather Kalis Air', true)
ON CONFLICT (name) DO NOTHING;