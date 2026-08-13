-- Campaign map: one image per campaign with member-placed pins, plus an
-- append-only pin change log (same shape as inventory_log_entries).

create table campaign_maps (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade unique,
  image_path    text not null,        -- object path in the public-assets bucket
  uploaded_by   uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table map_pins (
  id            uuid primary key default gen_random_uuid(),
  map_id        uuid not null references campaign_maps(id) on delete cascade,
  x             numeric not null,     -- fraction (0..1) of the image's natural width
  y             numeric not null,     -- fraction (0..1) of the image's natural height
  label         text not null,
  description   text,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index map_pins_map_id_idx on map_pins (map_id);

-- Keeps a snapshot (pin_label) so the log still reads sensibly after a pin
-- is deleted.
create table map_pin_log_entries (
  id            uuid primary key default gen_random_uuid(),
  map_id        uuid not null references campaign_maps(id) on delete cascade,
  actor_id      uuid not null references auth.users(id),
  action        text not null
                check (action in ('add', 'edit', 'move', 'delete')),
  pin_label     text not null,       -- snapshot of the pin's label at the time of the change
  description   text not null,       -- human-readable summary, e.g. "Added pin \"Ravenholt Village\""
  created_at    timestamptz not null default now()
);
create index map_pin_log_entries_map_id_idx on map_pin_log_entries (map_id, created_at desc);

alter table campaign_maps enable row level security;
alter table map_pins enable row level security;
alter table map_pin_log_entries enable row level security;

create policy "read campaign_maps" on campaign_maps for select
  using (is_member(campaign_id));

create policy "read map_pins" on map_pins for select
  using (exists (select 1 from campaign_maps m where m.id = map_id and is_member(m.campaign_id)));

create policy "read map_pin_log_entries" on map_pin_log_entries for select
  using (exists (select 1 from campaign_maps m where m.id = map_id and is_member(m.campaign_id)));

-- All writes go through server actions (service role); no client insert/update/delete policies.
grant select on public.campaign_maps to authenticated;
grant select on public.map_pins to authenticated;
grant select on public.map_pin_log_entries to authenticated;
grant select, insert, update, delete on public.campaign_maps to service_role;
grant select, insert, update, delete on public.map_pins to service_role;
grant select, insert on public.map_pin_log_entries to service_role;
