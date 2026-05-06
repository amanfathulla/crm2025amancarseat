
-- Page views per material
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referrer text
);

CREATE INDEX idx_page_views_material_date ON public.page_views (material, viewed_at DESC);
CREATE INDEX idx_page_views_viewed_at ON public.page_views (viewed_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert page views"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can read page views"
  ON public.page_views FOR SELECT
  USING (is_valid_admin_session());

CREATE POLICY "Admin can delete page views"
  ON public.page_views FOR DELETE
  USING (is_valid_admin_session());

-- Ads spend daily entries
CREATE TABLE public.ads_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spend_date date NOT NULL,
  platform text NOT NULL DEFAULT 'facebook',
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ads_spend_date ON public.ads_spend (spend_date DESC);

ALTER TABLE public.ads_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage ads_spend"
  ON public.ads_spend FOR ALL
  USING (is_valid_admin_session())
  WITH CHECK (is_valid_admin_session());

CREATE TRIGGER update_ads_spend_updated_at
  BEFORE UPDATE ON public.ads_spend
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
