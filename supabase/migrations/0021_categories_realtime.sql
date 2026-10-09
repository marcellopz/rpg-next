-- Broadcast category changes so open sidebars can live-refresh.
-- Pages are already in the publication (0016_pages_realtime.sql).
-- Events are filtered per-subscriber through the existing select policies.
alter publication supabase_realtime add table categories;
