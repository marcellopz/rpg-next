-- Tie inventory log entries to the characters they concern so a character's
-- own log can be shown without parsing the description text.
--   character_id        the character the change happened to (the source of a transfer)
--   target_character_id the receiving character of a transfer
-- Both become null if the character is deleted; the entry stays in the
-- campaign-wide log. Existing rows keep null until 0024 backfills them.

alter table inventory_log_entries
  add column character_id        uuid references characters(id) on delete set null,
  add column target_character_id uuid references characters(id) on delete set null;

create index inventory_log_entries_character_idx
  on inventory_log_entries (character_id, created_at desc);
create index inventory_log_entries_target_character_idx
  on inventory_log_entries (target_character_id, created_at desc);
