
-- Ensure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Re-hash the admin password (it may have been corrupted)
-- First check if password is already hashed
UPDATE public.admins 
SET password = extensions.crypt('Muhsin@2026', extensions.gen_salt('bf', 10))
WHERE email = 'amancarseat@gmail.com';

-- Update check_admin_password to use extensions schema
CREATE OR REPLACE FUNCTION public.check_admin_password(email text, password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
    PERFORM extensions.crypt(check_admin_password.password, extensions.gen_salt('bf'));
    RETURN NULL;
  END IF;
  
  IF extensions.crypt(check_admin_password.password, v_password_hash) = v_password_hash THEN
    RETURN v_admin_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Update password and email functions too
CREATE OR REPLACE FUNCTION public.update_admin_password(
  p_admin_id uuid, p_current_password text, p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_password_hash text;
BEGIN
  SELECT password INTO v_password_hash FROM public.admins WHERE id = p_admin_id;
  IF v_password_hash IS NULL THEN RETURN false; END IF;
  IF extensions.crypt(p_current_password, v_password_hash) != v_password_hash THEN RETURN false; END IF;
  UPDATE public.admins SET password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)) WHERE id = p_admin_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_email(
  p_admin_id uuid, p_password text, p_new_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_password_hash text;
BEGIN
  SELECT password INTO v_password_hash FROM public.admins WHERE id = p_admin_id;
  IF v_password_hash IS NULL THEN RETURN false; END IF;
  IF extensions.crypt(p_password, v_password_hash) != v_password_hash THEN RETURN false; END IF;
  UPDATE public.admins SET email = p_new_email WHERE id = p_admin_id;
  RETURN true;
END;
$$;
