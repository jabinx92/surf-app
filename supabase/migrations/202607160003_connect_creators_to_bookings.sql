create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  application_id uuid unique references public.creator_applications(id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  city text not null check (char_length(trim(city)) between 2 and 120),
  services text[] not null check (
    cardinality(services) between 1 and 3
    and services <@ array['Photography', 'Video', 'Drone']::text[]
  ),
  portfolio_url text not null check (char_length(trim(portfolio_url)) between 3 and 500),
  starting_rate integer not null check (starting_rate between 1 and 10000),
  bio text not null default '',
  travel_miles integer not null default 20 check (travel_miles between 0 and 200),
  avatar_url text,
  is_listed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

create policy "Anyone can view listed creator profiles"
on public.creator_profiles
for select
to anon, authenticated
using (is_listed = true or auth.uid() = owner_id);

alter table public.booking_requests
add column if not exists creator_profile_id uuid references public.creator_profiles(id) on delete restrict;

alter table public.booking_requests
alter column creator_id drop not null;

create index if not exists booking_requests_creator_profile_id_session_date_idx
on public.booking_requests (creator_profile_id, session_date);

create policy "Creators can view their received booking requests"
on public.booking_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles
    where creator_profiles.id = booking_requests.creator_profile_id
      and creator_profiles.owner_id = auth.uid()
  )
);

create policy "Creators can update their received booking requests"
on public.booking_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles
    where creator_profiles.id = booking_requests.creator_profile_id
      and creator_profiles.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.creator_profiles
    where creator_profiles.id = booking_requests.creator_profile_id
      and creator_profiles.owner_id = auth.uid()
  )
);
