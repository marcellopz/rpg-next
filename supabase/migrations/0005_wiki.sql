-- Wiki: categories, pages, recovery snapshots.
-- Categories with owner_id null form the shared campaign tree ("Campaign
-- notes"); categories with owner_id set form that user's private tree
-- ("My notes"). Pages may live at the tree root (category_id null).

create table categories (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  parent_id   uuid references categories(id) on delete cascade,
  owner_id    uuid references auth.users(id),  -- null = shared campaign tree; set = that user's "My notes" tree
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table pages (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid not null references campaigns(id) on delete cascade,
  category_id           uuid references categories(id) on delete set null,  -- null = root-level page
  title                 text not null,
  content_json          jsonb,                 -- SOURCE OF TRUTH: Tiptap document
  content_text          text,                  -- DERIVED on server: search + wipe-guard
  previous_content_json jsonb,                 -- last-known-good (recovery Layer 1)
  visibility            text not null default 'public', -- 'public' | 'private'
  owner_id              uuid not null references auth.users(id),
  deleted_at            timestamptz,           -- soft delete
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index pages_content_text_idx on pages using gin (to_tsvector('simple', coalesce(content_text, '')));

create table page_recovery_snapshots (
  id           uuid primary key default gen_random_uuid(),
  page_id      uuid not null references pages(id) on delete cascade,
  content_json jsonb not null,
  content_text text,
  saved_by     uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index on page_recovery_snapshots (page_id, created_at desc);

-- RLS: reads only; writes go through trusted server actions (service role),
-- which also means the savePage wipe guard cannot be bypassed by clients.
alter table categories enable row level security;
create policy "read categories" on categories for select
  using (is_member(campaign_id) and (owner_id is null or owner_id = auth.uid()));

alter table pages enable row level security;
create policy "read pages" on pages for select
  using (
    is_member(campaign_id)
    and deleted_at is null
    and (visibility = 'public' or owner_id = auth.uid())
  );

alter table page_recovery_snapshots enable row level security;
-- no client policies: snapshots are only touched by server actions

-- Grants (mirrors 0003_grants.sql)
grant select, insert, update, delete on public.categories              to service_role;
grant select, insert, update, delete on public.pages                   to service_role;
grant select, insert, update, delete on public.page_recovery_snapshots to service_role;
grant select on public.categories to authenticated;
grant select on public.pages      to authenticated;
