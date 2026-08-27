-- Tukar page 'purple' jadi mode KATEGORI (Kain Mesh) + publish
-- Copy-paste ke Supabase SQL Editor, Run.
update sale_pages
set
  product_mode = 'category',
  product_category = 'Kain Mesh',
  product_id = null,
  is_published = true
where slug = 'purple';

-- Verify
select slug, title, product_mode, product_category, is_published
from sale_pages
where slug = 'purple';
