-- Add a short, URL-friendly public code for campaign routes.
-- The UUID primary key remains the internal identifier for relationships and
-- trusted server actions.

alter table campaigns
  add column public_code text;

alter table campaigns
  add constraint campaigns_public_code_format
  check (public_code ~ '^[abcdefghjkmnpqrstuvwxyz23456789]{6}$');

create unique index campaigns_public_code_unique
  on campaigns(public_code);

do $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  generated_code text;
  campaign_row record;
begin
  for campaign_row in
    select id from campaigns where public_code is null
  loop
    loop
      generated_code := '';

      for i in 1..6 loop
        generated_code := generated_code ||
          substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
      end loop;

      begin
        update campaigns
        set public_code = generated_code
        where id = campaign_row.id;

        exit;
      exception when unique_violation then
        -- Extremely unlikely, but retry until this existing row has a unique
        -- public code.
      end;
    end loop;
  end loop;
end $$;

alter table campaigns
  alter column public_code set not null;
