ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full',
ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount numeric DEFAULT 0;