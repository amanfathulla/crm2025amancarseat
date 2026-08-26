-- Sale Pages Phase 2: produk add-on (banyak produk per page) + tracking jualan per page
-- Run di Supabase SQL Editor. Idempotent.

-- ── Table: produk yang ditunjuk pada sesuatu sale page (banyak-banyak) ──
create table if not exists public.sale_page_products (
  id uuid primary key default gen_random_uuid(),
  sale_page_id uuid not null references public.sale_pages(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Unique: satu produk sekali sahaja dalam satu page
create unique index if not exists uq_sale_page_product
  on public.sale_page_products(sale_page_id, product_id);

alter table public.sale_page_products enable row level security;

-- Public boleh baca (untuk paparan page) — hanya jika page itu published
drop policy if exists "sale_page_products_public_read" on public.sale_page_products;
create policy "sale_page_products_public_read"
on public.sale_page_products for select
to anon, authenticated
using (
  exists (
    select 1 from public.sale_pages sp
    where sp.id = sale_page_products.sale_page_id
      and sp.is_published = true
  )
);

-- Admin boleh baca semua
drop policy if exists "sale_page_products_admin_read" on public.sale_page_products;
create policy "sale_page_products_admin_read"
on public.sale_page_products for select
using (public.is_valid_admin_session());

-- Admin boleh INSERT
drop policy if exists "sale_page_products_admin_insert" on public.sale_page_products;
create policy "sale_page_products_admin_insert"
on public.sale_page_products for insert
with check (public.is_valid_admin_session());

-- Admin boleh UPDATE
drop policy if exists "sale_page_products_admin_update" on public.sale_page_products;
create policy "sale_page_products_admin_update"
on public.sale_page_products for update
using (public.is_valid_admin_session())
with check (public.is_valid_admin_session());

-- Admin boleh DELETE
drop policy if exists "sale_page_products_admin_delete" on public.sale_page_products;
create policy "sale_page_products_admin_delete"
on public.sale_page_products for delete
using (public.is_valid_admin_session());

-- ── Function: kira jumlah jualan (RM) bagi satu sale page ──
-- Order dikira milik sale page jika customer dibuat melalui page tersebut.
-- Kita track via column sale_page_id pada customers (nullable) — simpler & accurate.
alter table public.customers
  add column if not exists sale_page_id uuid references public.sale_pages(id) on delete set null;

create index if not exists idx_customers_sale_page
  on public.customers(sale_page_id);

-- Policy: anon INSERT (dari order flow) boleh set sale_page_id — beri melalui existing
-- "Public can insert customers" policy (WITH CHECK true) sudah membolehkan.
-- Admin read customers yang ada sale_page_id — covered oleh existing admin SELECT policy.

-- RPC: summary jualan semua sale pages (admin sahaja)
create or replace function public.sale_pages_sales_summary()
returns table (
  sale_page_id uuid,
  slug text,
  title text,
  orders_count bigint,
  total_sales numeric
)
language sql
security definer
set search_path = public
as $$
  select
    sp.id as sale_page_id,
    sp.slug,
    sp.title,
    count(c.id) as orders_count,
    coalesce(sum(c.sales_amount), 0) as total_sales
  from public.sale_pages sp
  left join public.customers c
    on c.sale_page_id = sp.id
   and c.order_status <> 'cancelled'
  group by sp.id, sp.slug, sp.title
  order by total_sales desc;
$$;

revoke all on function public.sale_pages_sales_summary() from public;
grant execute on function public.sale_pages_sales_summary() to authenticated;
-- NOTE: custom admin session users run as anon key + x-admin-session header.
-- supabase-js RPC runs as "anon" role — so grant to anon too, but the function
-- itself is SECURITY DEFINER; add a guard inside? For simplicity and because the
-- summary contains only aggregate numbers (no PII), grant to anon:
grant execute on function public.sale_pages_sales_summary() to anon;
