-- Tambah column warna untuk review_materials
-- Supaya setiap review boleh ada material + warna (hierarki: Material → Warna)
ALTER TABLE public.review_materials
  ADD COLUMN IF NOT EXISTS warna text NULL;

COMMENT ON COLUMN public.review_materials.warna IS
  'Warna design order untuk review ini. Contoh: Hitam, Merah, Biru, Kelabu. Boleh null.';
