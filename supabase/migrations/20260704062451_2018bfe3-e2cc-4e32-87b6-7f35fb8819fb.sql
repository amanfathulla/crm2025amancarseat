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
    IF NEW.product IS NOT NULL
       AND btrim(NEW.product) <> ''
       AND (NEW.gross_profit IS NULL OR NEW.gross_profit = 0) THEN
      v_should_recalc := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.product IS NOT NULL
       AND btrim(NEW.product) <> ''
       AND (
         NEW.order_status IS DISTINCT FROM OLD.order_status
         OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
         OR NEW.sales_amount IS DISTINCT FROM OLD.sales_amount
         OR NEW.product IS DISTINCT FROM OLD.product
         OR NEW.product_variation IS DISTINCT FROM OLD.product_variation
         OR NEW.gross_profit IS NULL
         OR NEW.gross_profit = 0
       )
       AND (
         NEW.order_status = 'completed'
         OR NEW.gross_profit IS NULL
         OR NEW.gross_profit = 0
       ) THEN
      v_should_recalc := true;
    END IF;
  END IF;

  IF v_should_recalc THEN
    v_cost := public.resolve_product_cost(NEW.product, NEW.product_variation);
    NEW.gross_profit := GREATEST(COALESCE(NEW.sales_amount, NEW.paid_amount, 0) - COALESCE(v_cost, 0), 0);
  END IF;

  RETURN NEW;
END;
$$;

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
  SET gross_profit = GREATEST(
        COALESCE(c.sales_amount, c.paid_amount, 0)
        - COALESCE(public.resolve_product_cost(c.product, c.product_variation), 0),
        0
      ),
      updated_at = now()
  WHERE (NOT p_only_zero OR c.gross_profit IS NULL OR c.gross_profit = 0)
    AND c.product IS NOT NULL
    AND btrim(c.product) <> '';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_gross_profit_all(boolean) TO authenticated, anon;