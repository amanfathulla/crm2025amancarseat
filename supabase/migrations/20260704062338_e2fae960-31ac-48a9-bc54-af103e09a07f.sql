DO $$
DECLARE
  v_settings record;
BEGIN
  IF to_regclass('public.billplz_settings') IS NOT NULL THEN
    SELECT api_key, x_signature_key, collection_id
    INTO v_settings
    FROM public.billplz_settings
    ORDER BY updated_at ASC NULLS LAST
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.payment_gateways pg
      SET credentials = COALESCE(pg.credentials, '{}'::jsonb)
        || jsonb_strip_nulls(jsonb_build_object(
          'api_key', NULLIF(v_settings.api_key, ''),
          'collection_id', NULLIF(v_settings.collection_id, ''),
          'x_signature_key', NULLIF(v_settings.x_signature_key, '')
        )),
        updated_at = now()
      WHERE pg.provider = 'billplz'
        AND (
          pg.credentials IS NULL
          OR pg.credentials = '{}'::jsonb
          OR COALESCE(pg.credentials->>'api_key', '') = ''
          OR COALESCE(pg.credentials->>'collection_id', '') = ''
        );
    END IF;

    DROP TABLE public.billplz_settings;
  END IF;
END $$;