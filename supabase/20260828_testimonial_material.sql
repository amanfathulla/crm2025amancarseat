-- Tambah column untuk simpan pilihan material testimoni per sale page
ALTER TABLE public.sale_pages
  ADD COLUMN IF NOT EXISTS testimonial_material text NULL;

COMMENT ON COLUMN public.sale_pages.testimonial_material IS
  'Material testimoni default untuk page ini. Null = Semua. Nilai: "Kain Mesh", "Kain Nylon", "Kain Fullsilk", "Semi Leather Kalis Air"';
