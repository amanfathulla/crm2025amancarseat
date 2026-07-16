
-- Fix per-material sales/ROAS matching in get_public_race_dash.
-- Previously matched product ILIKE '%Kain Mesh%' but products say "Fabric Mesh",
-- so NO orders ever matched -> sales=0 -> ROAS always "—".
-- Now we match by material KEYWORD (fullsilk / nylon / mesh / semi leather),
-- so ROAS per material is computed correctly.
-- Safe to re-run (CREATE OR REPLACE).

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
  v_recent_orders jsonb;
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

  -- Malaysia local day (UTC+8)
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
    SELECT unnest(ARRAY['Kain Fullsilk','Semi Leather Kalis Air','Kain Nylon','Kain Mesh'])
    UNION
    SELECT DISTINCT material FROM public.page_views WHERE viewed_at >= v_today_start AND material IS NOT NULL AND btrim(material) <> ''
  ),
  views AS (
    SELECT COALESCE(NULLIF(btrim(material),''),'Lain-lain') AS name, COUNT(*)::int AS views
      FROM public.page_views
     WHERE viewed_at >= v_today_start
     GROUP BY 1
  ),
  -- Map each order to a material by KEYWORD (product says "Fabric Mesh", not "Kain Mesh")
  sales AS (
    SELECT k.name,
           COUNT(c.id)::int AS orders,
           COALESCE(SUM(COALESCE(c.sales_amount, c.paid_amount, 0)),0) AS sales
      FROM known k
      LEFT JOIN public.customers c
        ON c.created_at >= v_today_start
       AND (
            lower(c.product_variation) LIKE '%' || lower(k.name) || '%'
         OR lower(c.product) LIKE '%fullsilk%'
         OR lower(c.product) LIKE '%nylon%'
         OR lower(c.product) LIKE '%mesh%'
         OR lower(c.product) LIKE '%semi leather%'
       )
       AND (
            (lower(k.name) LIKE '%fullsilk%' AND lower(c.product) LIKE '%fullsilk%')
         OR (lower(k.name) LIKE '%nylon%'    AND lower(c.product) LIKE '%nylon%')
         OR (lower(k.name) LIKE '%mesh%'     AND lower(c.product) LIKE '%mesh%')
         OR (lower(k.name) LIKE '%semi leather%' AND lower(c.product) LIKE '%semi leather%')
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

  -- Recent orders placed today (from /order -> public.customers), newest first, top 10
  SELECT jsonb_agg(
           jsonb_build_object(
             'id', c.id,
             'customer_name', c.name,
             'product', c.product,
             'product_variation', c.product_variation,
             'price', COALESCE(c.sales_amount, c.paid_amount, 0),
             'created_at', c.created_at
           ) ORDER BY c.created_at DESC
         )
    INTO v_recent_orders
    FROM public.customers c
   WHERE c.created_at >= v_today_start;

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
    'recent_orders', COALESCE(v_recent_orders, '[]'::jsonb),
    'as_of', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_race_dash(text) TO anon, authenticated;
