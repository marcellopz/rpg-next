-- Row-Level Security policies.
-- Rule: a user can touch a row if they're a member of that campaign.
-- memberships/invites are managed by trusted server actions, so client writes are denied.

-- Helper: is the current user a member of this campaign?
create or replace function is_member(c_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships
    where campaign_id = c_id and user_id = auth.uid()
  );
$$;

-- =========================================================================
-- campaigns
-- =========================================================================
alter table campaigns enable row level security;

create policy "read campaigns" on campaigns for select
  using (is_member(id));

-- =========================================================================
-- memberships & invites — locked: no client writes. Reads limited to your own.
-- =========================================================================
alter table memberships enable row level security;
create policy "read own memberships" on memberships for select
  using (user_id = auth.uid() or is_member(campaign_id));

alter table invites enable row level security;
-- No select/insert/update policies for clients: server actions use the service key.

-- =========================================================================
-- categories
-- =========================================================================
alter table categories enable row level security;
create policy "read categories" on categories for select using (is_member(campaign_id));
create policy "insert categories" on categories for insert with check (is_member(campaign_id));
create policy "modify categories" on categories for update using (is_member(campaign_id));
create policy "delete categories" on categories for delete using (is_member(campaign_id));

-- =========================================================================
-- pages
-- =========================================================================
alter table pages enable row level security;

create policy "read pages" on pages for select
  using (
    is_member(campaign_id)
    and deleted_at is null
    and (visibility = 'public' or owner_id = auth.uid())
  );

create policy "insert pages" on pages for insert
  with check (is_member(campaign_id) and owner_id = auth.uid());

create policy "modify pages" on pages for update
  using (owner_id = auth.uid());

-- =========================================================================
-- page_recovery_snapshots — written by server actions; owners may read theirs
-- =========================================================================
alter table page_recovery_snapshots enable row level security;
create policy "read own snapshots" on page_recovery_snapshots for select
  using (exists (select 1 from pages p where p.id = page_id and p.owner_id = auth.uid()));

-- =========================================================================
-- characters
-- =========================================================================
alter table characters enable row level security;
create policy "read characters" on characters for select using (is_member(campaign_id));
create policy "insert characters" on characters for insert
  with check (is_member(campaign_id) and owner_id = auth.uid());
create policy "modify characters" on characters for update using (owner_id = auth.uid());
create policy "delete characters" on characters for delete using (owner_id = auth.uid());

-- =========================================================================
-- inventory_items — gated through the owning character
-- =========================================================================
alter table inventory_items enable row level security;
create policy "read inventory" on inventory_items for select
  using (exists (select 1 from characters c where c.id = character_id and is_member(c.campaign_id)));
create policy "write inventory" on inventory_items for all
  using (exists (select 1 from characters c where c.id = character_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from characters c where c.id = character_id and c.owner_id = auth.uid()));

-- =========================================================================
-- combat_log_entries — members read; members append (no edits/deletes)
-- =========================================================================
alter table combat_log_entries enable row level security;
create policy "read combat log" on combat_log_entries for select using (is_member(campaign_id));
create policy "append combat log" on combat_log_entries for insert
  with check (is_member(campaign_id) and author_id = auth.uid());

-- =========================================================================
-- files
-- =========================================================================
alter table files enable row level security;
create policy "read files" on files for select using (is_member(campaign_id));
create policy "insert files" on files for insert
  with check (is_member(campaign_id) and uploader_id = auth.uid());
create policy "delete files" on files for delete using (uploader_id = auth.uid());

-- =========================================================================
-- Personal library — single-user: the owner owns it.
-- =========================================================================
alter table library_folders enable row level security;
create policy "own folders" on library_folders for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table library_items enable row level security;
create policy "own items" on library_items for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Body tables: check ownership through the envelope.
alter table library_character_bodies enable row level security;
create policy "own character bodies" on library_character_bodies for all
  using (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()));

alter table library_note_bodies enable row level security;
create policy "own note bodies" on library_note_bodies for all
  using (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()));

alter table library_spell_bodies enable row level security;
create policy "own spell bodies" on library_spell_bodies for all
  using (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()));

alter table library_image_bodies enable row level security;
create policy "own image bodies" on library_image_bodies for all
  using (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()));

-- =========================================================================
-- Realtime: enable broadcast for the combat log table.
-- =========================================================================
alter publication supabase_realtime add table combat_log_entries;
