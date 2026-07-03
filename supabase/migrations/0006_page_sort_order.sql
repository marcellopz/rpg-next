-- Manual ordering for pages (categories already have sort_order)
alter table pages add column sort_order int not null default 0;

-- Backfill: keep the current (creation-date) order within each container
update pages set sort_order = t.rn
from (
  select id, row_number() over (
    partition by campaign_id, category_id, visibility
    order by created_at
  ) as rn
  from pages
) t
where pages.id = t.id;
