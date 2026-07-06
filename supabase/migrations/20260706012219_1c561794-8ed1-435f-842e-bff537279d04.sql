
-- 1) Table for public dashboard password + settings
CREATE TABLE IF NOT EXISTS public.public_dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  last_changed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  hide_sensitive_costs boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants: no anon/authenticated direct access (accessed via SECURITY DEFINER RPCs only)
GRANT ALL ON public.public_dashboard_settings TO service_role;

ALTER TABLE public.public_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Deny direct access; access only through RPCs
CREATE POLICY "No direct access to public_dashboard_settings"
  ON public.public_dashboard_settings FOR ALL
  USING (false) WITH CHECK (false);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS pds_updated_at ON public.public_dashboard_settings;
CREATE TRIGGER pds_updated_at
  BEFORE UPDATE ON public.public_dashboard_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Admin RPC: set/rotate the public dashboard password (requires admin session)
CREATE OR REPLACE FUNCTION public.set_public_dashboard_password(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_row public.public_dashboard_settings%ROWTYPE;
BEGIN
  IF NOT public.is_valid_admin_session() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_password IS NULL OR length(p_password) < 4 THEN
    RAISE EXCEPTION 'Password too short';
  END IF;

  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  SELECT * INTO v_row FROM public.public_dashboard_settings LIMIT 1;
  IF v_row.id IS NULL THEN
    INSERT INTO public.public_dashboard_settings (password_hash, last_changed_at, expires_at)
    VALUES (v_hash, now(), now() + interval '30 days')
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.public_dashboard_settings
      SET password_hash = v_hash,
          last_changed_at = now(),
          expires_at = now() + interval '30 days'
      WHERE id = v_row.id
      RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'last_changed_at', v_row.last_changed_at,
    'expires_at', v_row.expires_at,
    'hide_sensitive_costs', v_row.hide_sensitive_costs
  );
END;
$$;

-- 3) Admin RPC: toggle hide_sensitive_costs
CREATE OR REPLACE FUNCTION public.set_public_dashboard_hide_costs(p_hide boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_valid_admin_session() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.public_dashboard_settings SET hide_sensitive_costs = p_hide;
  RETURN p_hide;
END;
$$;

-- 4) Admin RPC: get current settings status
CREATE OR REPLACE FUNCTION public.get_public_dashboard_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.public_dashboard_settings%ROWTYPE;
BEGIN
  IF NOT public.is_valid_admin_session() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_row FROM public.public_dashboard_settings LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('configured', false);
  END IF;
  RETURN jsonb_build_object(
    'configured', true,
    'last_changed_at', v_row.last_changed_at,
    'expires_at', v_row.expires_at,
    'is_expired', v_row.expires_at < now(),
    'hide_sensitive_costs', v_row.hide_sensitive_costs
  );
END;
$$;

-- 5) Public RPC: verify password (returns token-like ok flag + hide flag). No auth required.
CREATE OR REPLACE FUNCTION public.verify_public_dashboard_password(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.public_dashboard_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.public_dashboard_settings LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_configured');
  END IF;
  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  IF extensions.crypt(coalesce(p_password,''), v_row.password_hash) <> v_row.password_hash THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'expires_at', v_row.expires_at,
    'hide_sensitive_costs', v_row.hide_sensitive_costs
  );
END;
$$;

-- 6) Public RPC: fetch aggregated race-dash data (password required each call). No auth required.
CREATE OR REPLACE FUNCTION public.get_public_race_dash(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.public_dashboard_settings%ROWTYPE;
  v_today_start timestamptz;
  v_yest_start timestamptz;
  v_today_date date;
  v_today_sales numeric := 0;
  v_today_orders int := 0;
  v_yest_sales numeric := 0;
  v_ads_spend numeric := 0;
  v_total_views int := 0;
  v_materials jsonb;
BEGIN
  SELECT * INTO v_row FROM public.public_dashboard_settings LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_configured');
  END IF;
  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  IF extensions.crypt(coalesce(p_password,''), v_row.password_hash) <> v_row.password_hash THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;

  -- Malaysia local day (UTC+8) — approximate using (now() at time zone 'Asia/Kuala_Lumpur')::date
  v_today_date := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
  v_today_start := (v_today_date::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur');
  v_yest_start  := v_today_start - interval '1 day';

  SELECT COALESCE(SUM(COALESCE(sales_amount, paid_amount, 0)), 0), COUNT(*)
    INTO v_today_sales, v_today_orders
    FROM public.customers
   WHERE created_at >= v_today_start;

  SELECT COALESCE(SUM(COALESCE(sales_amount, paid_amount, 0)), 0)
    INTO v_yest_sales
    FROM public.customers
   WHERE created_at >= v_yest_start AND created_at < v_today_start;

  SELECT COALESCE(SUM(amount), 0)
    INTO v_ads_spend
    FROM public.ads_spend
   WHERE spend_date = v_today_date;

  SELECT COUNT(*) INTO v_total_views
    FROM public.page_views
   WHERE viewed_at >= v_today_start;

  -- Per-material aggregation
  WITH known(name) AS (
    SELECT unnest(ARRAY['Fullsilk','Semi Leather Kalis Air','Kain Nylon','Kain Mesh'])
    UNION
    SELECT DISTINCT material FROM public.page_views WHERE viewed_at >= v_today_start AND material IS NOT NULL AND btrim(material) <> ''
  ),
  views AS (
    SELECT COALESCE(NULLIF(btrim(material),''),'Lain-lain') AS name, COUNT(*)::int AS views
      FROM public.page_views
     WHERE viewed_at >= v_today_start
     GROUP BY 1
  ),
  sales AS (
    SELECT k.name,
           COUNT(c.id)::int AS orders,
           COALESCE(SUM(COALESCE(c.sales_amount, c.paid_amount, 0)),0) AS sales
      FROM known k
      LEFT JOIN public.customers c
        ON c.created_at >= v_today_start
       AND (
            c.product_variation ILIKE '%' || k.name || '%'
         OR c.product ILIKE '%' || k.name || '%'
       )
     GROUP BY k.name
  )
  SELECT jsonb_agg(
           jsonb_build_object(
             'name', k.name,
             'views', COALESCE(v.views,0),
             'orders', COALESCE(s.orders,0),
             'sales', COALESCE(s.sales,0),
             'cpv', CASE WHEN COALESCE(v.views,0) > 0 AND v_ads_spend > 0
                         THEN ROUND((v_ads_spend * (v.views::numeric / NULLIF(v_total_views,0)) / v.views)::numeric, 2)
                         ELSE 0 END,
             'roas', CASE WHEN v_ads_spend > 0 AND v_total_views > 0 AND COALESCE(v.views,0) > 0
                          THEN ROUND((COALESCE(s.sales,0) / (v_ads_spend * (v.views::numeric / v_total_views)))::numeric, 2)
                          ELSE 0 END
           )
           ORDER BY COALESCE(v.views,0) DESC, k.name
         )
    INTO v_materials
    FROM known k
    LEFT JOIN views v ON v.name = k.name
    LEFT JOIN sales s ON s.name = k.name;

  RETURN jsonb_build_object(
    'ok', true,
    'hide_sensitive_costs', v_row.hide_sensitive_costs,
    'expires_at', v_row.expires_at,
    'today_sales', v_today_sales,
    'today_orders', v_today_orders,
    'yesterday_sales', v_yest_sales,
    'ads_spend', v_ads_spend,
    'total_views', v_total_views,
    'materials', COALESCE(v_materials, '[]'::jsonb),
    'as_of', now()
  );
END;
$$;

-- Allow anon + authenticated to call the public RPCs
GRANT EXECUTE ON FUNCTION public.verify_public_dashboard_password(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_race_dash(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_public_dashboard_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_public_dashboard_hide_costs(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_dashboard_status() TO authenticated;
