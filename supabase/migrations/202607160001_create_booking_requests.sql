create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  creator_id integer not null,
  service_type text not null check (service_type in ('Photography', 'Video', 'Drone')),
  session_date date not null,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;

create policy "Customers can create their own booking requests"
on public.booking_requests
for insert
to authenticated
with check (auth.uid() = customer_id);

create policy "Customers can view their own booking requests"
on public.booking_requests
for select
to authenticated
using (auth.uid() = customer_id);

create index if not exists booking_requests_customer_id_created_at_idx
on public.booking_requests (customer_id, created_at desc);

create index if not exists booking_requests_creator_id_session_date_idx
on public.booking_requests (creator_id, session_date);
