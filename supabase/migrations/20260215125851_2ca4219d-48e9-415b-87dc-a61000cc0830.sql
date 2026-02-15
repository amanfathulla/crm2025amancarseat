
-- Function to update admin password (requires current password verification)
CREATE OR REPLACE FUNCTION public.update_admin_password(
  p_admin_id uuid,
  p_current_password text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password_hash text;
BEGIN
  -- Get current password hash
  SELECT password INTO v_password_hash
  FROM public.admins
  WHERE id = p_admin_id;
  
  IF v_password_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify current password
  IF crypt(p_current_password, v_password_hash) != v_password_hash THEN
    RETURN false;
  END IF;
  
  -- Update to new hashed password
  UPDATE public.admins
  SET password = crypt(p_new_password, gen_salt('bf', 10))
  WHERE id = p_admin_id;
  
  RETURN true;
END;
$$;

-- Function to update admin email (requires password verification)
CREATE OR REPLACE FUNCTION public.update_admin_email(
  p_admin_id uuid,
  p_password text,
  p_new_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password_hash text;
BEGIN
  -- Get current password hash
  SELECT password INTO v_password_hash
  FROM public.admins
  WHERE id = p_admin_id;
  
  IF v_password_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password
  IF crypt(p_password, v_password_hash) != v_password_hash THEN
    RETURN false;
  END IF;
  
  -- Update email
  UPDATE public.admins
  SET email = p_new_email
  WHERE id = p_admin_id;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_admin_password(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_email(uuid, text, text) TO anon, authenticated;
