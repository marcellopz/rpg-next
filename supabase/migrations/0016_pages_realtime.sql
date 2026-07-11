-- Broadcast page content saves so open editors can live-refresh.
-- Events are filtered per-subscriber through the existing is_member select policies.
alter publication supabase_realtime add table pages;
