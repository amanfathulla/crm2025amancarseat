-- Add editable material description phrases (shown on /products and /order)
ALTER TABLE public.category_settings ADD COLUMN IF NOT EXISTS description text;

-- Seed the 4 default phrases
UPDATE public.category_settings SET description = 'Berjalur, selesa & sejuk'        WHERE name = 'Kain Mesh';
UPDATE public.category_settings SET description = 'Tahan lama, mudah dicuci'         WHERE name = 'Kain Nylon';
UPDATE public.category_settings SET description = 'Mewah, lembut & tahan panas'      WHERE name = 'Kain Fullsilk';
UPDATE public.category_settings SET description = 'Kalis air, mudah dibersihkan'     WHERE name = 'Semi Leather Kalis Air';
