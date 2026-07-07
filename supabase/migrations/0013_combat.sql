-- Combat tracker: session state, combatants, and active conditions per combatant.
-- Writes go through trusted server actions (service role); members read only.

create table combat_sessions (
  campaign_id          uuid primary key references campaigns(id) on delete cascade,
  active               boolean not null default true,
  round                int not null default 0,
  turn                 int not null default 0,
  dm_notes             text not null default '',
  show_hp_to_players   boolean not null default false,
  started_by           uuid references auth.users(id),
  updated_at           timestamptz not null default now()
);

create table combat_combatants (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references campaigns(id) on delete cascade,
  name             text not null,
  initiative       int not null default 0,
  hp               int not null default 1,
  max_hp           int not null default 1,
  ac               int not null default 10,
  combatant_type   text not null default 'enemy'
                   check (combatant_type in ('player', 'enemy', 'ally', 'undead')),
  order_index      int not null default 0,
  used_reaction    boolean not null default false,
  visible          boolean not null default true,
  name_hidden      boolean not null default false,
  alias            text,
  created_at       timestamptz not null default now()
);
create index combat_combatants_campaign_idx on combat_combatants (campaign_id, order_index);

create table combat_conditions (
  id             uuid primary key default gen_random_uuid(),
  combatant_id   uuid not null references combat_combatants(id) on delete cascade,
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  name           text not null,
  duration       int not null,
  color          text not null
);
create index combat_conditions_combatant_idx on combat_conditions (combatant_id);
create index combat_conditions_campaign_idx on combat_conditions (campaign_id);

alter table combat_sessions enable row level security;
create policy "read combat sessions" on combat_sessions for select
  using (is_member(campaign_id));

alter table combat_combatants enable row level security;
create policy "read combat combatants" on combat_combatants for select
  using (is_member(campaign_id));

alter table combat_conditions enable row level security;
create policy "read combat conditions" on combat_conditions for select
  using (is_member(campaign_id));

grant select, insert, update, delete on public.combat_sessions   to service_role;
grant select, insert, update, delete on public.combat_combatants to service_role;
grant select, insert, update, delete on public.combat_conditions to service_role;
grant select on public.combat_sessions   to authenticated;
grant select on public.combat_combatants to authenticated;
grant select on public.combat_conditions to authenticated;
