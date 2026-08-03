alter table public.creator_profiles
add column if not exists equipment_setup text not null default '';

alter table public.creator_profiles
drop constraint if exists creator_profiles_equipment_setup_length_check;

alter table public.creator_profiles
add constraint creator_profiles_equipment_setup_length_check
check (char_length(equipment_setup) <= 500);

create or replace function public.populate_creator_equipment_setup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if trim(coalesce(new.equipment_setup, '')) = '' then
    select left(coalesce(raw_user_meta_data ->> 'equipment_setup', ''), 500)
    into new.equipment_setup
    from auth.users
    where id = new.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists populate_creator_equipment_setup_trigger on public.creator_profiles;
create trigger populate_creator_equipment_setup_trigger
before insert on public.creator_profiles
for each row execute function public.populate_creator_equipment_setup();

revoke update on public.creator_profiles from authenticated;
grant update (display_name, portfolio_url, portfolio_urls, bio, equipment_setup, avatar_url, avatar_color)
on public.creator_profiles to authenticated;
