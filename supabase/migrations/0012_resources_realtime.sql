-- Broadcast resource dashboard changes so open clients can live-refresh.
alter publication supabase_realtime
  add table resource_cards, resource_items, resource_dashboard_layouts;
