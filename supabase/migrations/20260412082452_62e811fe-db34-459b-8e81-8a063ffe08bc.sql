-- Fix: Make assign_order_number trigger SECURITY DEFINER so it can read MAX(order_number) even for anon inserts
CREATE OR REPLACE FUNCTION public.assign_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    SELECT COALESCE(MAX(order_number), 12198) + 1 INTO NEW.order_number FROM public.customers;
  END IF;
  RETURN NEW;
END;
$function$;

-- Also fix existing WhatsApp orders that got wrong order numbers
-- Re-assign the correct order number to the ahmad order
UPDATE public.customers 
SET order_number = (SELECT COALESCE(MAX(order_number), 12198) + 1 FROM public.customers WHERE order_number > 12199)
WHERE id = '304f1edf-3a39-4a24-b393-1c6c8bf6515c' AND order_number = 12199;