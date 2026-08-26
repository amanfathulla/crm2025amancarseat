-- Tambah column template (1-10) untuk sale_pages
-- Setiap nombor = satu template video layout berbeza

alter table public.sale_pages
  add column if not exists template integer not null default 1;

-- Index untuk performance (optional)
-- create index if not exists idx_sale_pages_template on public.sale_pages(template);
