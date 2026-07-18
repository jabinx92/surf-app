alter table public.booking_requests
add column if not exists session_hours smallint not null default 1
check (session_hours between 1 and 12);
