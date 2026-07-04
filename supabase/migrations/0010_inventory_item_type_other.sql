-- Allow "other" as an inventory item type.
alter table inventory_items drop constraint inventory_items_item_type_check;

alter table inventory_items add constraint inventory_items_item_type_check
  check (item_type in ('normal', 'magic', 'consumable', 'other'));
