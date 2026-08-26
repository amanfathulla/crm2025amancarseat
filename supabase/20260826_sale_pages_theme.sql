-- Sale pages: theme warna custom untuk salespage
-- Run di Supabase SQL Editor. Idempotent.

alter table public.sale_pages
  add column if not exists theme text not null default 'amber';

-- Nilai sah: amber, red, blue, green, pink, purple
-- ( enforced di app, bukan DB constraint supaya senang tambah warna lain nanti )
