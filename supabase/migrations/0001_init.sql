-- RPG Campaign Manager — initial schema
-- Covers: campaigns and memberships.
-- Other tables (invites, wiki, characters, combat log, files, library)
-- will be added in separate migrations as each feature is built.

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  owner_id    uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table memberships (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  role        text not null default 'player', -- 'dm' | 'player'
  created_at  timestamptz not null default now(),
  unique (campaign_id, user_id)
);
