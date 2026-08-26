-- Sale Pages (video salespage) — ACS Legacy CRM
-- Run di Supabase SQL Editor. Idempotent (selamat run berulang kali).

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

-- RLS — guna is_valid_admin_session() (custom auth system CRM ini)
alter table public.sale_pages enable row level security;

-- Buang polisi lama (mungkin dari versi awal yang salah)
drop policy if exists "sale_pages_public_read" on public.sale_pages;
drop policy if exists "sale_pages_admin_all" on public.sale_pages;
drop policy if exists "sale_pages_anon_bump_views" on public.sale_pages;
drop policy if exists "sale_pages_admin_read" on public.sale_pages;
drop policy if exists "sale_pages_admin_insert" on public.sale_pages;
drop policy if exists "sale_pages_admin_update" on public.sale_pages;
drop policy if exists "sale_pages_admin_delete" on public.sale_pages;

-- Public (anon) boleh baca page yang published sahaja
create policy "sale_pages_public_read"
on public.sale_pages for select
to anon, authenticated
using (is_published = true);

-- Admin (via custom session token) boleh baca SEMUA page (termasuk draf)
create policy "sale_pages_admin_read"
on public.sale_pages for select
using (public.is_valid_admin_session());

-- Admin boleh INSERT page baru
create policy "sale_pages_admin_insert"
on public.sale_pages for insert
with check (public.is_valid_admin_session());

-- Admin boleh UPDATE page
create policy "sale_pages_admin_update"
on public.sale_pages for update
using (public.is_valid_admin_session())
with check (public.is_valid_admin_session());

-- Admin boleh DELETE page
create policy "sale_pages_admin_delete"
on public.sale_pages for delete
using (public.is_valid_admin_session());

-- Views counter: SECURITY DEFINER function (anon panggil via RPC, tak boleh sentuh data lain)
create or replace function public.bump_sale_page_views(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new integer;
begin
  update public.sale_pages
     set views = views + 1
   where slug = p_slug
     and is_published = true
  returning views into v_new;
  return coalesce(v_new, 0);
end $$;

revoke all on function public.bump_sale_page_views(text) from public;
grant execute on function public.bump_sale_page_views(text) to anon, authenticated;
