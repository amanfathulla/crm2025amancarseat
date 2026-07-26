-- ============================================================================
--  AMANCARSEAT — WhatsApp Follow-up System (clean consolidated setup)
--  Run this ONCE in the Supabase SQL Editor (project ywjblrnqygowfixxmigw).
--  Idempotent: safe to re-run. Does NOT recreate public.leads (CRM already has it).
--  ORDER MATTERS: referenced tables are created before anything that uses them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Roles + RBAC helpers (CRM does not have these yet; WhatsApp RLS needs them)
-- ---------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;

-- First user to sign up becomes admin; others become staff.
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- ---------------------------------------------------------------------------
-- 2) Phone normalizers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_my_phone(raw TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE digits TEXT;
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  digits := regexp_replace(raw, '\D', '', 'g');
  IF digits = '' THEN RETURN NULL; END IF;
  IF left(digits, 2) = '60' THEN RETURN digits;
  ELSIF left(digits, 1) = '0' THEN RETURN '60' || substring(digits from 2);
  ELSE RETURN '60' || digits;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leads_normalize_phone()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.phone := public.normalize_my_phone(NEW.phone);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) followup_sequences (created BEFORE leads references it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.followup_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_sequences TO authenticated;
GRANT ALL ON public.followup_sequences TO service_role;
ALTER TABLE public.followup_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff can view sequences" ON public.followup_sequences;
CREATE POLICY "staff can view sequences" ON public.followup_sequences FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "admin can manage sequences" ON public.followup_sequences;
CREATE POLICY "admin can manage sequences" ON public.followup_sequences FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------------
-- 4) followup_steps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.followup_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  day_offset INT NOT NULL,
  message_template TEXT NOT NULL,
  media_type text,
  media_url text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.followup_steps DROP CONSTRAINT IF EXISTS followup_steps_media_type_check;
ALTER TABLE public.followup_steps ADD CONSTRAINT followup_steps_media_type_check
  CHECK (media_type IS NULL OR media_type IN ('image','video','audio','document'));
CREATE INDEX IF NOT EXISTS idx_followup_steps_sequence ON public.followup_steps(sequence_id, step_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_steps TO authenticated;
GRANT ALL ON public.followup_steps TO service_role;
ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff can view steps" ON public.followup_steps;
CREATE POLICY "staff can view steps" ON public.followup_steps FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "admin can manage steps" ON public.followup_steps;
CREATE POLICY "admin can manage steps" ON public.followup_steps FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------------
-- 5) whatsapp_senders (created BEFORE leads/lead_followups reference it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  gap_seconds INT NOT NULL DEFAULT 5,
  daily_limit INT NOT NULL DEFAULT 200,
  current_lead_count INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  connection_status text NOT NULL DEFAULT 'unknown',
  last_checked_at timestamptz,
  consecutive_failures int NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_senders TO authenticated;
GRANT ALL ON public.whatsapp_senders TO service_role;
ALTER TABLE public.whatsapp_senders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff/admin read senders" ON public.whatsapp_senders;
CREATE POLICY "staff/admin read senders" ON public.whatsapp_senders FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "admin write senders" ON public.whatsapp_senders;
CREATE POLICY "admin write senders" ON public.whatsapp_senders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.senders_normalize_phone()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.phone_number := public.normalize_my_phone(NEW.phone_number);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_senders_normalize ON public.whatsapp_senders;
CREATE TRIGGER trg_senders_normalize BEFORE INSERT OR UPDATE ON public.whatsapp_senders
  FOR EACH ROW EXECUTE FUNCTION public.senders_normalize_phone();

CREATE OR REPLACE FUNCTION public.assign_lead_sender()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE chosen UUID;
BEGIN
  IF NEW.assigned_sender_id IS NULL THEN
    SELECT id INTO chosen FROM public.whatsapp_senders
     WHERE is_active = true ORDER BY current_lead_count ASC, created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
    NEW.assigned_sender_id := chosen;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_leads_assign_sender ON public.leads;
CREATE TRIGGER trg_leads_assign_sender BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.assign_lead_sender();

CREATE OR REPLACE FUNCTION public.bump_sender_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.assigned_sender_id IS NOT NULL THEN
    UPDATE public.whatsapp_senders SET current_lead_count = current_lead_count + 1 WHERE id = NEW.assigned_sender_id;
  ELSIF TG_OP = 'DELETE' AND OLD.assigned_sender_id IS NOT NULL THEN
    UPDATE public.whatsapp_senders SET current_lead_count = GREATEST(current_lead_count - 1, 0) WHERE id = OLD.assigned_sender_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.assigned_sender_id IS DISTINCT FROM OLD.assigned_sender_id THEN
    IF OLD.assigned_sender_id IS NOT NULL THEN
      UPDATE public.whatsapp_senders SET current_lead_count = GREATEST(current_lead_count - 1, 0) WHERE id = OLD.assigned_sender_id;
    END IF;
    IF NEW.assigned_sender_id IS NOT NULL THEN
      UPDATE public.whatsapp_senders SET current_lead_count = current_lead_count + 1 WHERE id = NEW.assigned_sender_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_leads_bump_sender_ins ON public.leads;
CREATE TRIGGER trg_leads_bump_sender_ins AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.bump_sender_count();
DROP TRIGGER IF EXISTS trg_leads_bump_sender_del ON public.leads;
CREATE TRIGGER trg_leads_bump_sender_del AFTER DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.bump_sender_count();
DROP TRIGGER IF EXISTS trg_leads_bump_sender_upd ON public.leads;
CREATE TRIGGER trg_leads_bump_sender_upd AFTER UPDATE OF assigned_sender_id ON public.leads FOR EACH ROW EXECUTE FUNCTION public.bump_sender_count();

-- ---------------------------------------------------------------------------
-- 6) EXTEND existing public.leads (now followup_sequences & whatsapp_senders exist)
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS product TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS followup_sequence_id UUID REFERENCES public.followup_sequences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS followup_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_sender_id UUID REFERENCES public.whatsapp_senders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chatbot_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_pp_url TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_sender ON public.leads(assigned_sender_id);
CREATE INDEX IF NOT EXISTS idx_leads_followup_status ON public.leads(followup_status);

DROP TRIGGER IF EXISTS trg_leads_normalize_phone ON public.leads;
CREATE TRIGGER trg_leads_normalize_phone
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_normalize_phone();

-- ---------------------------------------------------------------------------
-- 7) lead_followups (references leads, sequences, steps, senders — all exist)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES public.followup_sequences(id) ON DELETE SET NULL,
  step_id UUID REFERENCES public.followup_steps(id) ON DELETE SET NULL,
  step_order INT,
  day_offset INT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error_message TEXT,
  rendered_message TEXT,
  sender_id_used UUID REFERENCES public.whatsapp_senders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_followups_status_scheduled ON public.lead_followups(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lead_followups_lead ON public.lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_sender_sent ON public.lead_followups(sender_id_used, sent_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_followups TO authenticated;
GRANT ALL ON public.lead_followups TO service_role;
ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff can view followups" ON public.lead_followups;
CREATE POLICY "staff can view followups" ON public.lead_followups FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "staff can update followups" ON public.lead_followups;
CREATE POLICY "staff can update followups" ON public.lead_followups FOR UPDATE TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "staff can insert followups" ON public.lead_followups;
CREATE POLICY "staff can insert followups" ON public.lead_followups FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 8) Auto-generate follow-up schedule when a lead is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_lead_followups()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE step RECORD; seq_id UUID;
BEGIN
  seq_id := COALESCE(
    NEW.followup_sequence_id,
    (SELECT id FROM public.followup_sequences WHERE is_active = true ORDER BY created_at LIMIT 1)
  );
  IF seq_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.followup_sequence_id IS NULL THEN
    UPDATE public.leads SET followup_sequence_id = seq_id WHERE id = NEW.id;
  END IF;
  FOR step IN SELECT * FROM public.followup_steps WHERE sequence_id = seq_id ORDER BY step_order LOOP
    INSERT INTO public.lead_followups (lead_id, sequence_id, step_id, step_order, day_offset, scheduled_at)
    VALUES (NEW.id, seq_id, step.id, step.step_order, step.day_offset,
            NEW.created_at + (step.day_offset || ' days')::interval);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_generate_followups ON public.leads;
CREATE TRIGGER trg_generate_followups AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.generate_lead_followups();

-- Cancel pending followups when lead leaves 'active'
CREATE OR REPLACE FUNCTION public.cancel_pending_on_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.followup_status <> 'active' AND (OLD.followup_status IS DISTINCT FROM NEW.followup_status) THEN
    UPDATE public.lead_followups SET status = 'cancelled', updated_at = now() WHERE lead_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_cancel_pending_on_status_change ON public.leads;
CREATE TRIGGER trg_cancel_pending_on_status_change AFTER UPDATE OF followup_status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.cancel_pending_on_status_change();

-- ---------------------------------------------------------------------------
-- 9) WhatsApp credentials + settings (admin-only via service role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_credentials (
  id INT PRIMARY KEY DEFAULT 1,
  api_key TEXT,
  sender_number TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_cred_row CHECK (id = 1)
);
INSERT INTO public.whatsapp_credentials (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT ALL ON public.whatsapp_credentials TO service_role;
ALTER TABLE public.whatsapp_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id INT PRIMARY KEY DEFAULT 1,
  automation_enabled BOOLEAN NOT NULL DEFAULT false,
  sender_number TEXT,
  api_key_configured BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.whatsapp_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.whatsapp_settings TO authenticated;
GRANT ALL ON public.whatsapp_settings TO service_role;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff can view settings" ON public.whatsapp_settings;
CREATE POLICY "staff can view settings" ON public.whatsapp_settings FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "admin can update settings" ON public.whatsapp_settings;
CREATE POLICY "admin can update settings" ON public.whatsapp_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------------
-- 10) lead_messages (history) + chatbot settings/credentials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.whatsapp_senders(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','video','audio','document')),
  content text,
  media_url text,
  is_read boolean NOT NULL DEFAULT false,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead ON public.lead_messages(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_messages_sender ON public.lead_messages(sender_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_messages TO authenticated;
GRANT ALL ON public.lead_messages TO service_role;
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff/admin read lead_messages" ON public.lead_messages;
CREATE POLICY "Staff/admin read lead_messages" ON public.lead_messages FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff/admin insert lead_messages" ON public.lead_messages;
CREATE POLICY "Staff/admin insert lead_messages" ON public.lead_messages FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff/admin update lead_messages" ON public.lead_messages;
CREATE POLICY "Staff/admin update lead_messages" ON public.lead_messages FOR UPDATE TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='lead_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_messages';
  END IF;
END $$;
ALTER TABLE public.lead_messages REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.chatbot_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active boolean NOT NULL DEFAULT false,
  ai_provider text NOT NULL DEFAULT 'gemini' CHECK (ai_provider IN ('claude','openai','gemini','lovable')),
  model_name text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  product_knowledge text,
  tone_instruction text NOT NULL DEFAULT 'Balas mesra dan santai macam admin sebenar, bukan robot. Guna Bahasa Melayu santai.',
  api_key_configured boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.chatbot_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT, UPDATE ON public.chatbot_settings TO authenticated;
GRANT ALL ON public.chatbot_settings TO service_role;
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff/admin read chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "Staff/admin read chatbot_settings" ON public.chatbot_settings FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Admin update chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "Admin update chatbot_settings" ON public.chatbot_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.chatbot_credentials (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  claude_api_key text,
  openai_api_key text,
  gemini_api_key text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.chatbot_credentials (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.chatbot_credentials TO service_role;
GRANT ALL ON public.chatbot_credentials TO service_role;
ALTER TABLE public.chatbot_credentials ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 11) API logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  phone TEXT,
  sender TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_body TEXT,
  ok BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  lead_id UUID,
  followup_id UUID,
  sender_id UUID,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_api_logs_created_at ON public.whatsapp_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_api_logs_ok ON public.whatsapp_api_logs(ok, created_at DESC);
GRANT SELECT ON public.whatsapp_api_logs TO authenticated;
GRANT ALL ON public.whatsapp_api_logs TO service_role;
ALTER TABLE public.whatsapp_api_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff/admin boleh lihat log API" ON public.whatsapp_api_logs;
CREATE POLICY "Staff/admin boleh lihat log API" ON public.whatsapp_api_logs FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 12) Storage buckets + policies (for media follow-ups)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('followup-media','followup-media', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inbound-media','inbound-media', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Staff read followup-media" ON storage.objects;
CREATE POLICY "Staff read followup-media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'followup-media' AND public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff insert followup-media" ON storage.objects;
CREATE POLICY "Staff insert followup-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'followup-media' AND public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff update followup-media" ON storage.objects;
CREATE POLICY "Staff update followup-media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'followup-media' AND public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff delete followup-media" ON storage.objects;
CREATE POLICY "Staff delete followup-media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'followup-media' AND public.is_staff_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff read inbound-media" ON storage.objects;
CREATE POLICY "Staff read inbound-media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'inbound-media' AND public.is_staff_or_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 13) Seed default sequence (10 steps: D0, D3, D7, D10, D14, D17, D21, D24, D27, D30)
--     Only seeds if no sequence exists yet.
-- ---------------------------------------------------------------------------
DO $$
DECLARE seq_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.followup_sequences) THEN
    INSERT INTO public.followup_sequences (name, description, is_active)
    VALUES ('Standard Lead', 'Sequence followup standard 10x sebulan', true)
    RETURNING id INTO seq_id;
    INSERT INTO public.followup_steps (sequence_id, step_order, day_offset, message_template) VALUES
      (seq_id, 1, 0,  'Salam {{nama}}, terima kasih hubungi kami tentang {{produk}}. Boleh saya bantu lagi?'),
      (seq_id, 2, 3,  'Hai {{nama}}, cuma nak follow up. Ada apa-apa soalan tentang {{produk}}?'),
      (seq_id, 3, 7,  'Salam {{nama}}, minggu ni kami ada promosi menarik untuk {{produk}}. Nak saya kongsi?'),
      (seq_id, 4, 10, 'Hi {{nama}}, dah dapat brochure kami? Kalau perlu penjelasan lanjut boleh reply mesej ni ya.'),
      (seq_id, 5, 14, 'Salam {{nama}}, ramai customer kami dah upgrade ke {{produk}}. Nak saya emailkan testimoni?'),
      (seq_id, 6, 17, 'Hai {{nama}}, ada apa-apa yang buatkan awak masih fikirkan? Saya boleh bantu jelaskan.'),
      (seq_id, 7, 21, 'Salam {{nama}}, minggu ni last chance dapat harga promo untuk {{produk}}.'),
      (seq_id, 8, 24, 'Hi {{nama}}, kalau masa tak sesuai kami boleh follow up bulan depan. Just reply "NANTI".'),
      (seq_id, 9, 27, 'Salam {{nama}}, kami masih di sini bila-bila awak sedia teruskan.'),
      (seq_id, 10, 30, 'Hi {{nama}}, ini reminder terakhir. Kalau berminat, reply mesej ni ya. Terima kasih!');
  END IF;
END $$;

-- ============================================================================
--  DONE. Next steps (handled separately):
--   - Set WhatsApp API key + sender in whatsapp_credentials (service role / admin UI).
--   - Enable automation: UPDATE whatsapp_settings SET automation_enabled = true WHERE id = 1;
--   - Deploy the send-followups Edge Function + cron so messages actually send daily.
-- ============================================================================
