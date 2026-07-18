create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  city text not null check (char_length(trim(city)) between 2 and 120),
  services text[] not null check (
    cardinality(services) between 1 and 3
    and services <@ array['Photography', 'Video', 'Drone']::text[]
  ),
  portfolio_url text not null check (char_length(trim(portfolio_url)) between 3 and 500),
  starting_rate integer not null check (starting_rate between 1 and 10000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.creator_applications enable row level security;

create policy "Creators can submit their own application"
on public.creator_applications
for insert
to authenticated
with check (auth.uid() = applicant_id and status = 'pending');

create policy "Creators can view their own application"
on public.creator_applications
for select
to authenticated
using (auth.uid() = applicant_id);

create index if not exists creator_applications_status_created_at_idx
on public.creator_applications (status, created_at asc);
