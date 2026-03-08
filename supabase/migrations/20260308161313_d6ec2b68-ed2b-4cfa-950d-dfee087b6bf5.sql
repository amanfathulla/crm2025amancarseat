
-- =====================================================================
-- SECURITY HARDENING: Rate limiting, Server-side sessions, RLS policies
-- =====================================================================

-- 1. LOGIN ATTEMPTS TABLE (rate limiting)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
  ON public.login_attempts(email, attempted_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to login_attempts"
  ON public.login_attempts FOR ALL USING (false);

-- 2. ADMIN SESSIONS TABLE (server-side session management)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to admin_sessions"
  ON public.admin_sessions FOR ALL USING (false);

-- 3. UPDATE check_admin_password WITH RATE LIMITING
CREATE OR REPLACE FUNCTION public.check_admin_password(
  email text,
  password text,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_admin_id uuid;
  v_password_hash text;
  v_recent_failures int;
BEGIN
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.login_attempts
  WHERE login_attempts.email = check_admin_password.email
    AND attempted_at > now() - interval '15 minutes'
    AND success = false;

  IF v_recent_failures >= 5 THEN
    INSERT INTO public.login_attempts (email, user_agent, success)
    VALUES (check_admin_password.email, p_user_agent, false);
    PERFORM extensions.crypt(check_admin_password.password, extensions.gen_salt('bf'));
    RETURN NULL;
  END IF;

  SELECT id, admins.password INTO v_admin_id, v_password_hash
  FROM public.admins
  WHERE admins.email = check_admin_password.email
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    PERFORM extensions.crypt(check_admin_password.password, extensions.gen_salt('bf'));
    INSERT INTO public.login_attempts (email, user_agent, success)
    VALUES (check_admin_password.email, p_user_agent, false);
    RETURN NULL;
  END IF;

  IF extensions.crypt(check_admin_password.password, v_password_hash) = v_password_hash THEN
    INSERT INTO public.login_attempts (email, user_agent, success)
    VALUES (check_admin_password.email, p_user_agent, true);
    DELETE FROM public.login_attempts
    WHERE login_attempts.email = check_admin_password.email
      AND success = false
      AND attempted_at < now() - interval '1 hour';
    RETURN v_admin_id;
  ELSE
    INSERT INTO public.login_attempts (email, user_agent, success)
    VALUES (check_admin_password.email, p_user_agent, false);
    RETURN NULL;
  END IF;
END;
$$;

-- 4. CREATE ADMIN SESSION FUNCTION
CREATE OR REPLACE FUNCTION public.create_admin_session(
  p_admin_id uuid,
  p_user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_token text;
BEGIN
  DELETE FROM public.admin_sessions WHERE expires_at < now();
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.admin_sessions (admin_id, token, expires_at, last_activity)
  VALUES (p_admin_id, v_token, now() + interval '24 hours', now());
  RETURN v_token;
END;
$$;

-- 5. VALIDATE ADMIN SESSION FUNCTION
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  UPDATE public.admin_sessions
  SET last_activity = now()
  WHERE token = p_token AND expires_at > now()
  RETURNING admin_id INTO v_admin_id;
  RETURN v_admin_id;
END;
$$;

-- 6. INVALIDATE SESSION FUNCTION (logout)
CREATE OR REPLACE FUNCTION public.invalidate_admin_session(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.admin_sessions WHERE token = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_password(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_session(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_admin_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_admin_session(text) TO anon, authenticated;

-- 7. SESSION VALIDATION HELPER FOR RLS
CREATE OR REPLACE FUNCTION public.is_valid_admin_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
DECLARE
  v_token text;
  v_headers jsonb;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::jsonb;
    v_token := v_headers->>'x-admin-session';
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  IF v_token IS NULL OR v_token = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_sessions
    WHERE token = v_token AND expires_at > now()
  );
END;
$$;

-- 8. CUSTOMERS RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous select from customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous insert to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous update to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous delete from customers" ON public.customers;

CREATE POLICY "Admin session can select customers"
  ON public.customers FOR SELECT USING (public.is_valid_admin_session());
CREATE POLICY "Admin session can insert customers"
  ON public.customers FOR INSERT WITH CHECK (public.is_valid_admin_session());
CREATE POLICY "Admin session can update customers"
  ON public.customers FOR UPDATE USING (public.is_valid_admin_session());
CREATE POLICY "Admin session can delete customers"
  ON public.customers FOR DELETE USING (public.is_valid_admin_session());
CREATE POLICY "Public can insert customer orders"
  ON public.customers FOR INSERT WITH CHECK (true);

-- 9. LEADS RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select leads" ON public.leads;
DROP POLICY IF EXISTS "Allow insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow delete leads" ON public.leads;

CREATE POLICY "Admin session can select leads"
  ON public.leads FOR SELECT USING (public.is_valid_admin_session());
CREATE POLICY "Admin session can insert leads"
  ON public.leads FOR INSERT WITH CHECK (public.is_valid_admin_session());
CREATE POLICY "Admin session can update leads"
  ON public.leads FOR UPDATE USING (public.is_valid_admin_session());
CREATE POLICY "Admin session can delete leads"
  ON public.leads FOR DELETE USING (public.is_valid_admin_session());

-- 10. YEARLY SALES RLS
ALTER TABLE public.yearly_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write access for all users" ON public.yearly_sales;
CREATE POLICY "Admin session can access yearly_sales"
  ON public.yearly_sales FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- 11. SALES RECORDS RLS
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin session can access sales_records"
  ON public.sales_records FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- 12. MARKETING CONTENT RLS
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable select for all users" ON public.marketing_content;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.marketing_content;
DROP POLICY IF EXISTS "Enable update for all users" ON public.marketing_content;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.marketing_content;
CREATE POLICY "Admin session can access marketing_content"
  ON public.marketing_content FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- 13. MARKETING EVENTS RLS
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for marketing_events" ON public.marketing_events;
CREATE POLICY "Admin session can access marketing_events"
  ON public.marketing_events FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- 14. MARKETING TASKS RLS
ALTER TABLE public.marketing_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin session can access marketing_tasks"
  ON public.marketing_tasks FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- 15. PRODUCTS RLS (public SELECT for order page)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin session can write products" ON public.products FOR INSERT WITH CHECK (public.is_valid_admin_session());
CREATE POLICY "Admin session can update products" ON public.products FOR UPDATE USING (public.is_valid_admin_session());
CREATE POLICY "Admin session can delete products" ON public.products FOR DELETE USING (public.is_valid_admin_session());

-- 16. PRODUCT VARIATIONS RLS (public SELECT for order page)
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to product_variations" ON public.product_variations;
CREATE POLICY "Public can read product_variations" ON public.product_variations FOR SELECT USING (true);
CREATE POLICY "Admin session can write product_variations" ON public.product_variations FOR INSERT WITH CHECK (public.is_valid_admin_session());
CREATE POLICY "Admin session can update product_variations" ON public.product_variations FOR UPDATE USING (public.is_valid_admin_session());
CREATE POLICY "Admin session can delete product_variations" ON public.product_variations FOR DELETE USING (public.is_valid_admin_session());

-- 17. ORDERS RLS (public INSERT for placing orders)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin session can access orders" ON public.orders FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());

-- 18. ORDER ITEMS RLS (public INSERT for placing orders)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;
CREATE POLICY "Public can insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin session can access order_items" ON public.order_items FOR ALL
  USING (public.is_valid_admin_session())
  WITH CHECK (public.is_valid_admin_session());
