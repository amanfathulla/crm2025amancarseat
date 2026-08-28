-- Tambah column untuk simpan pilihan produk testimoni per sale page
ALTER TABLE public.sale_pages
  ADD COLUMN IF NOT EXISTS testimonial_product text NULL;

COMMENT ON COLUMN public.sale_pages.testimonial_product IS
  'Product ID untuk filter testimoni ikut produk. Null = ikut material saja. Contoh: product_id dari public_products.';
