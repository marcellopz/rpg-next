-- Broadcast inventory changes so open clients can live-refresh. Events are
-- delivered per-subscriber through the existing is_member select policies.
alter publication supabase_realtime
  add table characters, inventory_items, inventory_log_entries;
