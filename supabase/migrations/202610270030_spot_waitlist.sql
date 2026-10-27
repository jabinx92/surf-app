-- Surfers who want a photographer at a break where none are listed yet.
-- Anyone can join; only WaveLens admins can read the list.
create table if not exists public.spot_waitlist (
  id uuid primary key default gen_random_uuid(),
  surf_spot text not null check (char_length(btrim(surf_spot)) between 1 and 120),
  email text not null check (
    char_length(email) between 3 and 254
    and email = lower(email)
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (surf_spot, email)
);

alter table public.spot_waitlist enable row level security;

create index if not exists spot_waitlist_surf_spot_idx on public.spot_waitlist (surf_spot);

create policy "Anyone can join a spot waitlist"
on public.spot_waitlist for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());

create policy "Admins can view the spot waitlist"
on public.spot_waitlist for select to authenticated
using (public.is_wavelens_admin());

create policy "Admins can remove spot waitlist entries"
on public.spot_waitlist for delete to authenticated
using (public.is_wavelens_admin());
