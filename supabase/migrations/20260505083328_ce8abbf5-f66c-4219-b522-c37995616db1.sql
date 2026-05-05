ALTER TABLE public.category_settings ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS car_model text;