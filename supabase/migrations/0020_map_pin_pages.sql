-- Links a map pin to one or more wiki pages (many-to-many). The read policy
-- mirrors pages' own visibility rule so a link to a private note owned by
-- someone else never surfaces to other members, even though map_pins are
-- collaboratively editable.

create table map_pin_pages (
  pin_id      uuid not null references map_pins(id) on delete cascade,
  page_id     uuid not null references pages(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  primary key (pin_id, page_id)
);
create index map_pin_pages_page_id_idx on map_pin_pages (page_id);

alter table map_pin_pages enable row level security;

create policy "read map_pin_pages" on map_pin_pages for select
  using (
    exists (
      select 1 from map_pins pin
      join campaign_maps m on m.id = pin.map_id
      where pin.id = pin_id and is_member(m.campaign_id)
    )
    and exists (
      select 1 from pages pg
      where pg.id = page_id
        and pg.deleted_at is null
        and (pg.visibility = 'public' or pg.owner_id = auth.uid())
    )
  );

grant select on public.map_pin_pages to authenticated;
grant select, insert, delete on public.map_pin_pages to service_role;
