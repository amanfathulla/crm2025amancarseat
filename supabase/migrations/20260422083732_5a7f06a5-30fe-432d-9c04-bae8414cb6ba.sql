-- Shipping settings table for zone-based costs
CREATE TABLE public.shipping_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semenanjung_cost numeric NOT NULL DEFAULT 10,
  sabah_sarawak_cost numeric NOT NULL DEFAULT 20,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read shipping_settings"
ON public.shipping_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admin session can manage shipping_settings"
ON public.shipping_settings FOR ALL TO public
USING (is_valid_admin_session()) WITH CHECK (is_valid_admin_session());

CREATE TRIGGER update_shipping_settings_updated_at
BEFORE UPDATE ON public.shipping_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default row
INSERT INTO public.shipping_settings (semenanjung_cost, sabah_sarawak_cost) VALUES (10, 20);