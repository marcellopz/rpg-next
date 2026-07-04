-- Inventory tool: party characters, their items, and an append-only change log.
-- Characters belong to the campaign (any member can manage them); every
-- mutation is recorded in inventory_log_entries with a human description.

create table characters (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  created_by   uuid not null references auth.users(id),
  name         text not null,
  strength     int  not null default 10,
  platinum     int  not null default 0,
  gold         int  not null default 0,
  silver       int  not null default 0,
  copper       int  not null default 0,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);
create index characters_campaign_idx on characters (campaign_id, sort_order);

create table inventory_items (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  name         text not null,
  item_type    text not null default 'normal'
               check (item_type in ('normal', 'magic', 'consumable')),
  weight       numeric(8,2) not null default 0,   -- per-unit weight in lb
  quantity     int not null default 1,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index inventory_items_character_idx on inventory_items (character_id, sort_order);
create index inventory_items_campaign_idx on inventory_items (campaign_id);

create table inventory_log_entries (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  actor_id      uuid not null references auth.users(id),
  actor_name    text not null,
  change_type   text not null,   -- add | delete | transfer | create_character | delete_character | update_* ...
  description   text not null,   -- human-readable, rendered in the log
  item_snapshot jsonb,           -- item state for add/delete/transfer entries
  created_at    timestamptz not null default now()
);
create index inventory_log_entries_campaign_idx on inventory_log_entries (campaign_id, created_at desc);

-- RLS: member reads only; all writes go through trusted server actions
-- (service role) so log entries can never be skipped by clients.
alter table characters enable row level security;
create policy "read characters" on characters for select
  using (is_member(campaign_id));

alter table inventory_items enable row level security;
create policy "read inventory items" on inventory_items for select
  using (is_member(campaign_id));

alter table inventory_log_entries enable row level security;
create policy "read inventory log" on inventory_log_entries for select
  using (is_member(campaign_id));

-- Grants (mirrors 0003_grants.sql)
grant select, insert, update, delete on public.characters            to service_role;
grant select, insert, update, delete on public.inventory_items       to service_role;
grant select, insert, update, delete on public.inventory_log_entries to service_role;
grant select on public.characters            to authenticated;
grant select on public.inventory_items       to authenticated;
grant select on public.inventory_log_entries to authenticated;
