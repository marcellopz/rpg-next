-- Row-Level Security policies for campaigns and memberships.
-- Writes to both tables are handled by trusted server actions (service-role
-- key), so no client insert/update/delete policies are defined here.

-- Helper: is the current user a member of this campaign?
create or replace function is_member(c_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships
    where campaign_id = c_id and user_id = auth.uid()
  );
$$;

-- campaigns: members may read; writes go through server actions only.
alter table campaigns enable row level security;
create policy "read campaigns" on campaigns for select
  using (is_member(id));

-- memberships: a user may read their own rows, or any row in a campaign
-- they belong to (so the member list is visible to all members).
alter table memberships enable row level security;
create policy "read own memberships" on memberships for select
  using (user_id = auth.uid() or is_member(campaign_id));
