-- Broadcast map image and pin changes so open maps can live-refresh.
-- Events are filtered per-subscriber through the existing select policies.
alter publication supabase_realtime add table campaign_maps, map_pins;
