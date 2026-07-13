-- Character portraits and campaign cover images. Columns hold the storage
-- object path in the public-assets bucket (null = no image; UI falls back
-- to the generated avatar / gradient). Writes go through server actions;
-- existing RLS read policies already cover these columns.
alter table characters add column image_path text;
alter table campaigns  add column image_path text;
