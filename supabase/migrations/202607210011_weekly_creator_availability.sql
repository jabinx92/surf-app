create table if not exists public.creator_weekly_availability (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  surf_spot text not null default '',
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (creator_profile_id, weekday, start_time, end_time, surf_spot)
);

alter table public.creator_weekly_availability enable row level security;

create policy "Anyone can view listed creator weekly availability"
on public.creator_weekly_availability for select to anon, authenticated
using (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_weekly_availability.creator_profile_id
    and creator_profiles.is_listed = true
));

create policy "Creators can manage weekly availability"
on public.creator_weekly_availability for all to authenticated
using (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_weekly_availability.creator_profile_id
    and creator_profiles.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_weekly_availability.creator_profile_id
    and creator_profiles.owner_id = auth.uid()
));

create index if not exists creator_weekly_availability_lookup_idx
on public.creator_weekly_availability (weekday, surf_spot, creator_profile_id);
