-- Tambah column image_urls untuk carousel gambar (customer installed result)
alter table public.sale_pages
  add column if not exists image_urls text[] default '{}';
