-- Grant table-level privileges that Supabase does not set automatically when
-- migrations are pushed via the CLI.
--
-- service_role: used by trusted server actions (admin client). Needs full
--   access so it can bypass RLS and perform the coordinated writes that
--   client-side code is not allowed to do directly.
--
-- authenticated: used by the user-scoped server client for reads. RLS
--   policies then further restrict which rows each user can see.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.campaigns   to service_role;
grant select, insert, update, delete on public.memberships to service_role;

grant select on public.campaigns   to authenticated;
grant select on public.memberships to authenticated;
