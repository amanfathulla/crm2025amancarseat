-- Add order_number column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Populate existing customers with order numbers starting from 12199, ordered by created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.customers
)
UPDATE public.customers c
SET order_number = 12198 + r.rn
FROM ranked r
WHERE c.id = r.id;

-- Create a function to auto-assign next order_number on insert
CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    SELECT COALESCE(MAX(order_number), 12198) + 1 INTO NEW.order_number FROM public.customers;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign order_number on new customer
DROP TRIGGER IF EXISTS trigger_assign_order_number ON public.customers;
CREATE TRIGGER trigger_assign_order_number
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_order_number();