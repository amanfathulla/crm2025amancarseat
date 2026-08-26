-- Tambah mode produk ikut kategori untuk sale_pages
-- product_mode: 'single' (default) atau 'category'
-- product_category: string kategori (dipadankan dgn public_products.category)

alter table public.sale_pages
  add column if not exists product_mode text not null default 'single';

alter table public.sale_pages
  add column if not exists product_category text;

-- Pastikan RLS tak halang (guna polisi sedia ada — guna is_valid_admin_session)
-- Tiada RLS baru diperlukan; polisi sedia ada cover semua column.

comment on column public.sale_pages.product_mode is 'single = satu produk utama; category = list produk ikut kategori';
comment on column public.sale_pages.product_category is 'Nama kategori (sama dgn public_products.category) bila product_mode=category';
