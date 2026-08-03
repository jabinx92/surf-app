alter table public.booking_requests
drop constraint if exists booking_requests_start_time_required;

alter table public.booking_requests
add constraint booking_requests_start_time_required
check (session_start_time is not null) not valid;

comment on constraint booking_requests_start_time_required on public.booking_requests
is 'Requires a start time for every new or updated booking while preserving historical rows created before start times were collected.';
