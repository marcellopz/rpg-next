-- Campaign invitations addressed to an email address. No outbound email is sent;
-- pending invites are shown in-app on /account for a user with a matching email.
create table campaign_invites (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  invitee_email  text not null,
  role           text not null default 'player' check (role in ('player', 'dm')),
  invited_by     uuid not null references auth.users(id),
  accepted_by    uuid references auth.users(id),
  accepted_at    timestamptz,
  revoked_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index campaign_invites_campaign_idx on campaign_invites (campaign_id, created_at desc);
create index campaign_invites_email_idx on campaign_invites (lower(invitee_email));

-- Only one open invite per campaign/email.
create unique index campaign_invites_pending_unique_idx
  on campaign_invites (campaign_id, lower(invitee_email))
  where accepted_at is null and revoked_at is null;

alter table campaign_invites enable row level security;

-- User-scoped reads for invitees. Settings/admin views use server-side trusted queries
-- after checking campaign admin permissions.
create policy "read own campaign invites" on campaign_invites for select
  using (lower(invitee_email) = lower(coalesce(auth.jwt()->>'email', '')));

grant select, insert, update, delete on public.campaign_invites to service_role;
grant select on public.campaign_invites to authenticated;
