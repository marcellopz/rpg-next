-- Pin types for the campaign map. Existing pins default to 'location'.
-- 'group' marks the party's position trail: its pins are numbered in
-- creation order in the UI.
alter table map_pins add column type text not null default 'location'
  check (type in ('location', 'settlement', 'dungeon', 'quest', 'danger', 'group'));
