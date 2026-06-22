-- Add a description to campaigns.
-- Campaigns started as name-only; the create/edit UI now captures a short
-- description shown on campaign cards and the detail header.
alter table campaigns add column description text not null default '';
