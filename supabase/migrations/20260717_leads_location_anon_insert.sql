-- Add location column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location text;

-- Add phone column if not exists (shouldn't exist, but just in case)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;

-- Drop old restrictive policies (admin-only INSERT blocks public website leads)
DROP POLICY IF EXISTS "Admin session can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow insert leads" ON public.leads;

-- Allow public INSERT (website QuickOrderForm saves lead before WhatsApp redirect)
CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin-only UPDATE/DELETE/SELECT stay as-is
