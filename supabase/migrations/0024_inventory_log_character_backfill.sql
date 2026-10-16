-- One-time backfill for inventory_log_entries.character_id / target_character_id
-- (added in 0023). Old entries only have a description, so the character is
-- recovered from the text those entries were written with.
--
-- Conservative on purpose:
--   * only rows whose character_id is still null are touched (safe to re-run)
--   * only characters whose name is unique within their campaign can match
--   * an entry is linked only when exactly one character matches it
--   * entries about deleted or since-renamed characters stay null and keep
--     appearing in the campaign-wide log
-- Nothing but these two columns is modified.

-- Single-character entries: stats, photo, party add, rename, item changes.
with names as (
  select
    c.id,
    c.campaign_id,
    c.name,
    -- escape LIKE wildcards so a name like "100%_Bob" matches literally
    replace(replace(replace(c.name, '\', '\\'), '%', '\%'), '_', '\_') as pat
  from characters c
  where (
    select count(*) from characters o
    where o.campaign_id = c.campaign_id and o.name = c.name
  ) = 1
),
matches as (
  select e.id as entry_id, n.id as char_id
  from inventory_log_entries e
  join names n on n.campaign_id = e.campaign_id
  where e.character_id is null
    and (
      (e.change_type in (
          'update_strength', 'update_platinum', 'update_gold',
          'update_silver', 'update_copper')
        and e.description like 'Changed ' || n.pat || '''s %' escape '\')
      or (e.change_type = 'update_photo'
        and (e.description like 'Updated ' || n.pat || '''s photo' escape '\'
          or e.description like 'Removed ' || n.pat || '''s photo' escape '\'))
      or (e.change_type = 'create_character'
        and e.description = 'Added ' || n.name || ' to the party')
      or (e.change_type = 'rename_character'
        and e.description like 'Renamed % to ' || n.pat escape '\')
      or (e.change_type = 'add'
        and e.description like 'Added % to ' || n.pat || '''s inventory' escape '\')
      or (e.change_type = 'delete'
        and e.description like 'Removed % from ' || n.pat || '''s inventory' escape '\')
      or (e.change_type in (
          'update_item_name', 'update_item_type',
          'update_weight', 'update_number_of_items')
        and e.description like '% in ' || n.pat || '''s inventory' escape '\')
    )
),
unique_matches as (
  select entry_id, (array_agg(char_id))[1] as char_id
  from matches
  group by entry_id
  having count(*) = 1
)
update inventory_log_entries e
set character_id = u.char_id
from unique_matches u
where e.id = u.entry_id;

-- Transfers: 'Moved N x "item" from SOURCE to TARGET' links both characters.
with names as (
  select
    c.id,
    c.campaign_id,
    replace(replace(replace(c.name, '\', '\\'), '%', '\%'), '_', '\_') as pat
  from characters c
  where (
    select count(*) from characters o
    where o.campaign_id = c.campaign_id and o.name = c.name
  ) = 1
),
pairs as (
  select e.id as entry_id, a.id as source_id, b.id as target_id
  from inventory_log_entries e
  join names a on a.campaign_id = e.campaign_id
  join names b on b.campaign_id = e.campaign_id and b.id <> a.id
  where e.change_type = 'transfer'
    and e.character_id is null
    and e.description like 'Moved % "%" from ' || a.pat || ' to ' || b.pat escape '\'
),
unique_pairs as (
  select
    entry_id,
    (array_agg(source_id))[1] as source_id,
    (array_agg(target_id))[1] as target_id
  from pairs
  group by entry_id
  having count(*) = 1
)
update inventory_log_entries e
set character_id = p.source_id,
    target_character_id = p.target_id
from unique_pairs p
where e.id = p.entry_id;
