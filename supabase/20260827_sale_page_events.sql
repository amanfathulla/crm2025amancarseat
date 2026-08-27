-- Analytics events untuk sale_pages
-- Track: view (unique per session), cta_click, info_open, buy_click, video_complete
create table if not exists public.sale_page_events (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.sale_pages(id) on delete cascade,
  event_type  text not null,  -- view | cta_click | info_open | buy_click | video_complete
  variation_id text,
  visitor_key text,           -- session/device id utk dedupe view
  created_at  timestamptz not null default now()
);

create index if not exists idx_sale_page_events_page on public.sale_page_events(page_id);
create index if not exists idx_sale_page_events_type on public.sale_page_events(event_type);

alter table public.sale_page_events enable row level security;

-- Public (anon) boleh INSERT event (tracking)
drop policy if exists "sale_page_events_anon_insert" on public.sale_page_events;
create policy "sale_page_events_anon_insert"
  on public.sale_page_events for insert
  to anon, authenticated
  with check (true);

-- Admin baca
drop policy if exists "sale_page_events_admin_read" on public.sale_page_events;
create policy "sale_page_events_admin_read"
  on public.sale_page_events for select
  using (public.is_valid_admin_session() or auth.role() = 'authenticated');

-- RPC: kira event per type untuk satu page
create or replace function public.sale_page_event_counts(p_page_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'view',          coalesce(sum(case when event_type = 'view' then 1 else 0 end), 0),
    'cta_click',     coalesce(sum(case when event_type = 'cta_click' then 1 else 0 end), 0),
    'info_open',     coalesce(sum(case when event_type = 'info_open' then 1 else 0 end), 0),
    'buy_click',     coalesce(sum(case when event_type = 'buy_click' then 1 else 0 end), 0),
    'video_complete',coalesce(sum(case when event_type = 'video_complete' then 1 else 0 end), 0)
  )
  from public.sale_page_events
  where page_id = p_page_id;
$$;

revoke all on function public.sale_page_event_counts(uuid) from public;
grant execute on function public.sale_page_event_counts(uuid) to anon, authenticated;
