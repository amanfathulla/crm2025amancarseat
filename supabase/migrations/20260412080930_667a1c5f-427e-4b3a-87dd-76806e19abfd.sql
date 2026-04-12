-- Allow public/anonymous users to insert customers (for order page)
CREATE POLICY "Public can insert customers from order page"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (true);
