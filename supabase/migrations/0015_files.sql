-- Campaign file metadata + shared "show handout to table" broadcast.

create table files (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  uploader_id   uuid not null references auth.users(id),
  bucket        text not null
                check (bucket in ('public-assets', 'private-files')),
  path          text not null,
  filename      text not null,
  content_type  text,
  size_bytes    bigint,
  visibility    text not null default 'public'
                check (visibility in ('public', 'private')),
  created_at    timestamptz not null default now(),
  unique (bucket, path)
);

create index files_campaign_idx on files (campaign_id, created_at desc);
create index files_uploader_idx on files (uploader_id, created_at desc);

-- One active shared handout per campaign (null file_id = nothing showing).
create table campaign_handout_broadcasts (
  campaign_id  uuid primary key references campaigns(id) on delete cascade,
  file_id      uuid references files(id) on delete set null,
  shown_by     uuid references auth.users(id) on delete set null,
  updated_at   timestamptz not null default now()
);

alter table files enable row level security;

-- Shared files: any campaign member.
-- Personal (private) files: only the uploader.
create policy "read campaign files" on files for select
  using (
    (
      visibility = 'public'
      and is_member(campaign_id)
    )
    or (
      visibility = 'private'
      and uploader_id = auth.uid()
    )
  );

alter table campaign_handout_broadcasts enable row level security;

create policy "read handout broadcasts" on campaign_handout_broadcasts for select
  using (is_member(campaign_id));

grant select on public.files to authenticated;
grant select, insert, update, delete on public.files to service_role;

grant select on public.campaign_handout_broadcasts to authenticated;
grant select, insert, update, delete on public.campaign_handout_broadcasts to service_role;

alter publication supabase_realtime
  add table files, campaign_handout_broadcasts;
