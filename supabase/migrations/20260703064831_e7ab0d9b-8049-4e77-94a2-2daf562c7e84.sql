
-- Helper: resolve product cost from product name + variation name
CREATE OR REPLACE FUNCTION public.resolve_product_cost(p_product text, p_variation text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost numeric;
BEGIN
  IF p_product IS NULL OR btrim(p_product) = '' THEN
    RETURN 0;
  END IF;

  -- Try variation cost first
  IF p_variation IS NOT NULL AND btrim(p_variation) <> '' THEN
    SELECT pv.cost INTO v_cost
    FROM public.product_variations pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE p.name = p_product
      AND pv.name = p_variation
    LIMIT 1;
    IF v_cost IS NOT NULL THEN
      RETURN v_cost;
    END IF;
  END IF;

  -- Fallback to product cost
  SELECT p.cost INTO v_cost
  FROM public.products p
  WHERE p.name = p_product
  LIMIT 1;

  RETURN COALESCE(v_cost, 0);
END;
$$;

-- Trigger function: auto-fill gross_profit
CREATE OR REPLACE FUNCTION public.customers_autofill_gross_profit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost numeric;
  v_should_recalc boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- On insert: fill in if missing/zero
    IF NEW.gross_profit IS NULL OR NEW.gross_profit = 0 THEN
      v_should_recalc := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recompute when status becomes completed
    IF NEW.order_status = 'completed'
       AND (OLD.order_status IS DISTINCT FROM 'completed'
            OR NEW.gross_profit IS NULL OR NEW.gross_profit = 0
            OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
            OR NEW.product IS DISTINCT FROM OLD.product
            OR NEW.product_variation IS DISTINCT FROM OLD.product_variation) THEN
      v_should_recalc := true;
    END IF;
  END IF;

  IF v_should_recalc THEN
    v_cost := public.resolve_product_cost(NEW.product, NEW.product_variation);
    NEW.gross_profit := COALESCE(NEW.paid_amount, 0) - COALESCE(v_cost, 0);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_autofill_gross_profit ON public.customers;
CREATE TRIGGER trg_customers_autofill_gross_profit
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.customers_autofill_gross_profit();

-- Bulk backfill function: recompute for all orders where gross_profit is 0/null
CREATE OR REPLACE FUNCTION public.recalculate_gross_profit_all(p_only_zero boolean DEFAULT true)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  IF NOT public.is_valid_admin_session() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.customers c
  SET gross_profit = COALESCE(c.paid_amount, 0)
                     - COALESCE(public.resolve_product_cost(c.product, c.product_variation), 0),
      updated_at = now()
  WHERE (NOT p_only_zero OR c.gross_profit IS NULL OR c.gross_profit = 0)
    AND c.product IS NOT NULL
    AND btrim(c.product) <> '';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_gross_profit_all(boolean) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.resolve_product_cost(text, text) TO authenticated, anon, service_role;
