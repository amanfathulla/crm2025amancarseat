
-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Hash the existing plaintext admin password
UPDATE public.admins 
SET password = crypt(password, gen_salt('bf', 10))
WHERE password NOT LIKE '$2%';

-- 3. Update check_admin_password to use bcrypt verification
CREATE OR REPLACE FUNCTION public.check_admin_password(email text, password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_password_hash text;
BEGIN
  SELECT id, admins.password INTO v_admin_id, v_password_hash
  FROM public.admins
  WHERE admins.email = check_admin_password.email
  LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    PERFORM crypt(check_admin_password.password, gen_salt('bf'));
    RETURN NULL;
  END IF;
  
  IF crypt(check_admin_password.password, v_password_hash) = v_password_hash THEN
    RETURN v_admin_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- 4. Lock down admins table - enable RLS with NO public policies
-- check_admin_password is SECURITY DEFINER so it bypasses RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- No policies = table inaccessible via API, only via SECURITY DEFINER functions

-- 5. Lock down api_keys table - remove permissive policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.api_keys;
-- No policies = table inaccessible via API

-- 6. Remove duplicate customer SELECT policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
