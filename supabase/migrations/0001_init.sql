-- RPG Campaign Manager — initial schema
-- Paste into the Supabase SQL editor (or run via the Supabase CLI).
-- Covers: campaigns/memberships/invites, wiki (categories/pages + recovery),
-- characters/inventory, realtime combat log, files, and the personal library.

-- =========================================================================
-- Membership & campaigns
-- =========================================================================

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table memberships (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  role          text not null default 'player', -- 'dm' | 'player'
  created_at    timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create table invites (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  email         text,
  token         text not null unique,
  role          text not null default 'player',
  invited_by    uuid not null references auth.users(id),
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- =========================================================================
-- Wiki content (OneNote-style structure)
-- =========================================================================

create table categories (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  parent_id     uuid references categories(id) on delete cascade,
  name          text not null,
  sort_order    int not null default 0
);

create table pages (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid not null references campaigns(id) on delete cascade,
  category_id           uuid references categories(id) on delete set null,
  title                 text not null,
  content_json          jsonb,                 -- SOURCE OF TRUTH: Tiptap document
  content_text          text,                  -- DERIVED: plain text, for search + wipe-guard
  previous_content_json jsonb,                 -- last-known-good copy (recovery Layer 1)
  visibility            text not null default 'public', -- 'public' | 'private'
  owner_id              uuid not null references auth.users(id),
  deleted_at            timestamptz,           -- soft delete (recovery Layer 1)
  updated_at            timestamptz not null default now()
);

create index pages_content_text_idx on pages using gin (to_tsvector('simple', coalesce(content_text, '')));

create table page_recovery_snapshots (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references pages(id) on delete cascade,
  content_json  jsonb not null,
  content_text  text,
  saved_by      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index on page_recovery_snapshots (page_id, created_at desc);

-- =========================================================================
-- Character sheets & inventory
-- =========================================================================

create table characters (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  owner_id      uuid not null references auth.users(id),
  name          text not null,
  sheet         jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create table inventory_items (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references characters(id) on delete cascade,
  name          text not null,
  quantity      int not null default 1,
  notes         text
);

-- =========================================================================
-- Combat log (the realtime table — append-only)
-- =========================================================================

create table combat_log_entries (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  author_id     uuid not null references auth.users(id),
  message       text not null,
  kind          text not null default 'note', -- 'attack' | 'roll' | 'note' | 'system'
  created_at    timestamptz not null default now()
);

-- =========================================================================
-- Files (metadata; bytes live in Supabase Storage)
-- =========================================================================

create table files (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  uploader_id   uuid not null references auth.users(id),
  bucket        text not null,              -- 'public-assets' | 'private-files'
  path          text not null,
  filename      text not null,
  content_type  text,
  size_bytes    bigint,
  visibility    text not null default 'public',
  created_at    timestamptz not null default now()
);

-- =========================================================================
-- Personal Library (cross-campaign, user-owned): envelope + typed bodies
-- =========================================================================

create table library_folders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id),
  parent_id   uuid references library_folders(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0
);

create table library_items (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id),
  kind          text not null,             -- 'character' | 'image' | 'note' | 'spell' | 'idea'
  title         text not null,
  folder_id     uuid references library_folders(id) on delete set null,
  tags          text[] not null default '{}',
  source_kind   text,
  source_id     uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index library_items_owner_idx on library_items (owner_id, kind);
create index library_items_folder_idx on library_items (folder_id);
create index library_items_tags_idx on library_items using gin (tags);

create table library_character_bodies (
  item_id   uuid primary key references library_items(id) on delete cascade,
  name      text not null,
  sheet     jsonb not null default '{}'
);

create table library_note_bodies (
  item_id        uuid primary key references library_items(id) on delete cascade,
  content_json   jsonb,
  content_text   text
);

create table library_spell_bodies (
  item_id      uuid primary key references library_items(id) on delete cascade,
  level        int,
  school       text,
  casting_time text,
  range        text,
  components   text,
  duration     text,
  description  text
);
create index library_spell_level_idx on library_spell_bodies (level, school);

create table library_image_bodies (
  item_id   uuid primary key references library_items(id) on delete cascade,
  file_id   uuid references files(id) on delete set null,
  bucket    text,
  path      text,
  caption   text
);
