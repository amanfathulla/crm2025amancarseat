-- ============================================================
-- AFFILIATE AUTH (mirrors admin session system)
-- Enables self-registration WITHOUT Supabase signups.
-- Run ONCE in Supabase SQL Editor (after affiliate_system.sql).
-- ============================================================

-- Store hashed password on the affiliate row (never plaintext).
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS password text;

-- Affiliate sessions (opaque tokens, like admin_sessions).
CREATE TABLE IF NOT EXISTS public.affiliate_sessions (
  token text PRIMARY KEY,
  affiliate_id text NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- True when the request carries a valid affiliate session token.
CREATE OR REPLACE FUNCTION public.affiliate_session_valid()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_headers jsonb;
  v_token text;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::jsonb;
    v_token := v_headers->>'x-affiliate-session';
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  RETURN EXISTS (
    SELECT 1 FROM public.affiliate_sessions
    WHERE token = v_token AND expires_at > now()
  );
END;
$$;

-- Returns the affiliate_id behind the session token (used by app to scope queries).
CREATE OR REPLACE FUNCTION public.affiliate_id_from_session()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_headers jsonb;
  v_token text;
  r text;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::jsonb;
    v_token := v_headers->>'x-affiliate-session';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  SELECT affiliate_id INTO r
    FROM public.affiliate_sessions
    WHERE token = v_token AND expires_at > now();
  RETURN r;
END;
$$;

-- Register: insert with crypt() password, auto-generate referral + affiliate_id.
CREATE OR REPLACE FUNCTION public.register_affiliate(
  p_name text,
  p_phone text,
  p_whatsapp text,
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base text; root text; cand text; i int := 1;
  aff_id text;
BEGIN
  -- referral code from name: A-Z only, min 4, append 01/02 on clash
  base := upper(regexp_replace(p_name, '[^a-zA-Z]', '', 'g'));
  root := CASE WHEN length(base) >= 4 THEN base ELSE rpad(base, 4, 'X') END;
  LOOP
    cand := root || CASE WHEN i = 1 THEN '' ELSE lpad(i::text, 2, '0') END;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE referral_code = cand);
    i := i + 1;
  END LOOP;

  -- next affiliate_id: AFF00001, AFF00002, ...
  SELECT COALESCE(
    'AFF' || lpad((max(substring(affiliate_id FROM 4)::int) + 1)::text, 5, '0'),
    'AFF00001'
  ) INTO aff_id FROM public.affiliates;

  INSERT INTO public.affiliates
    (affiliate_id, referral_code, name, phone, whatsapp, email, password, status)
  VALUES (
    aff_id, cand, p_name, p_phone,
    NULLIF(p_whatsapp, ''), NULLIF(p_email, ''),
    crypt(p_password, gen_salt('bf')), 'pending'
  );

  RETURN jsonb_build_object('affiliate_id', aff_id, 'referral_code', cand);
END;
$$;

-- Login: verify crypt password -> create session token.
CREATE OR REPLACE FUNCTION public.affiliate_login(
  p_login text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec public.affiliates%ROWTYPE;
  tok text;
BEGIN
  SELECT * INTO rec FROM public.affiliates
    WHERE phone = p_login OR email = p_login
       OR referral_code = p_login OR affiliate_id = p_login;
  IF rec.affiliate_id IS NULL OR crypt(p_password, rec.password) <> rec.password THEN
    RAISE EXCEPTION 'invalid';
  END IF;

  tok := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.affiliate_sessions (token, affiliate_id)
    VALUES (tok, rec.affiliate_id);

  RETURN jsonb_build_object(
    'token', tok,
    'affiliate_id', rec.affiliate_id,
    'status', rec.status,
    'name', rec.name,
    'referral_code', rec.referral_code
  );
END;
$$;

-- Validate a stored affiliate session token (app use on load).
CREATE OR REPLACE FUNCTION public.validate_affiliate_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r public.affiliates%ROWTYPE;
BEGIN
  SELECT a.* INTO r FROM public.affiliate_sessions s
    JOIN public.affiliates a ON a.affiliate_id = s.affiliate_id
    WHERE s.token = p_token AND s.expires_at > now();
  IF r.affiliate_id IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'affiliate_id', r.affiliate_id,
    'status', r.status,
    'name', r.name,
    'referral_code', r.referral_code
  );
END;
$$;

-- Logout: drop the session token.
CREATE OR REPLACE FUNCTION public.invalidate_affiliate_session(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.affiliate_sessions WHERE token = p_token;
END;
$$;

-- Widen RLS: admin OR any valid affiliate session. App filters by own id.
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliates owner" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates access" ON public.affiliates;
CREATE POLICY "affiliates access" ON public.affiliates
  FOR ALL USING (public.is_admin_session() OR public.affiliate_session_valid());

DROP POLICY IF EXISTS "affiliate_clicks owner" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks access" ON public.affiliate_clicks
  FOR ALL USING (public.is_admin_session() OR public.affiliate_session_valid());

DROP POLICY IF EXISTS "affiliate_commissions owner" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions access" ON public.affiliate_commissions
  FOR ALL USING (public.is_admin_session() OR public.affiliate_session_valid());

DROP POLICY IF EXISTS "affiliate_withdrawals owner" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals access" ON public.affiliate_withdrawals
  FOR ALL USING (public.is_admin_session() OR public.affiliate_session_valid());

GRANT EXECUTE ON FUNCTION public.register_affiliate(text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_login(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_affiliate_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_affiliate_session(text) TO anon, authenticated;
