-- Sale pages: playlist video (multiple videos, played in order then looped)
-- Run di Supabase SQL Editor. Idempotent.

alter table public.sale_pages
  add column if not exists video_urls text[] not null default '{}';

-- Backfill: kalau ada page lama dengan video_url tunggal, masukkan ke dalam playlist
update public.sale_pages
   set video_urls = array[video_url]
 where video_url is not null
   and video_urls = '{}';
