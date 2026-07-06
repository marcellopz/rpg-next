-- Resources dashboard: draggable character cards with current/total resource rows.
-- Layout JSON is stored per campaign so all members share the same board.

create table resource_cards (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  character_id  uuid references characters(id) on delete set null,
  name          text not null,
  created_at    timestamptz not null default now()
);
create index resource_cards_campaign_idx on resource_cards (campaign_id);

create table resource_items (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  card_id        uuid not null references resource_cards(id) on delete cascade,
  name           text not null,
  current_value  int  not null default 0,
  total_value    int  not null default 1 check (total_value >= 0),
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now(),
  check (current_value >= 0)
);
create index resource_items_card_idx on resource_items (card_id, sort_order);
create index resource_items_campaign_idx on resource_items (campaign_id);

create table resource_dashboard_layouts (
  campaign_id  uuid primary key references campaigns(id) on delete cascade,
  layouts      jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- RLS: member reads only; writes go through trusted server actions.
alter table resource_cards enable row level security;
create policy "read resource cards" on resource_cards for select
  using (is_member(campaign_id));

alter table resource_items enable row level security;
create policy "read resource items" on resource_items for select
  using (is_member(campaign_id));

alter table resource_dashboard_layouts enable row level security;
create policy "read resource layouts" on resource_dashboard_layouts for select
  using (is_member(campaign_id));

grant select, insert, update, delete on public.resource_cards              to service_role;
grant select, insert, update, delete on public.resource_items              to service_role;
grant select, insert, update, delete on public.resource_dashboard_layouts to service_role;
grant select on public.resource_cards              to authenticated;
grant select on public.resource_items              to authenticated;
grant select on public.resource_dashboard_layouts to authenticated;
