-- Remove the unique constraint on customers.email
-- Multiple orders can come from the same email address
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_email_key;