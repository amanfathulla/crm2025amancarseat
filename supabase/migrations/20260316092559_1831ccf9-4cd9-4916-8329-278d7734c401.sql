
CREATE TABLE IF NOT EXISTS public.telegram_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token text NOT NULL DEFAULT '',
  chat_id text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false,
  notify_new_order boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin session can manage telegram_settings"
  ON public.telegram_settings FOR ALL TO public
  USING (is_valid_admin_session())
  WITH CHECK (is_valid_admin_session());

INSERT INTO public.telegram_settings (bot_token, chat_id, is_enabled, notify_new_order)
VALUES ('', '', false, true)
ON CONFLICT DO NOTHING;
