-- Sale Pages (video salespage) — ACS Legacy CRM
-- Run di Supabase SQL Editor. Idempotent.
create extension if not exists "pgcrypto";

create table if not exists public.sale_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  headline text,
  subheadline text,
  video_url text,
  poster_url text,
  product_id uuid references public.products(id) on delete set null,
  cta_label text default 'Buy Now',
  badge_text text,
  is_published boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_sale_pages_updated_at on public.sale_pages;
create trigger trg_sale_pages_updated_at
before update on public.sale_pages
for each row execute function public.set_updated_at();

-- RLS
alter table public.sale_pages enable row level security;

-- Public (anon) boleh baca page yang published sahaja
drop policy if exists "sale_pages_public_read" on public.sale_pages;
create policy "sale_pages_public_read"
on public.sale_pages for select
to anon, authenticated
using (is_published = true);

-- Admin (authenticated) boleh CRUD semua
drop policy if exists "sale_pages_admin_all" on public.sale_pages;
create policy "sale_pages_admin_all"
on public.sale_pages
for all
to authenticated
using (true)
with check (true);

-- Increment views (anon boleh update views sahaja — bukan data lain)
drop policy if exists "sale_pages_anon_bump_views" on public.sale_pages;
create policy "sale_pages_anon_bump_views"
on public.sale_pages
for update
to anon
using (is_published = true)
with check (views = old.views + 1);
