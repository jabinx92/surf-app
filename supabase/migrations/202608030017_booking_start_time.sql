alter table public.booking_requests
add column if not exists session_start_time time,
add column if not exists creator_display_name text;

update public.booking_requests as booking
set creator_display_name = creator.display_name
from public.creator_profiles as creator
where booking.creator_profile_id = creator.id
  and booking.creator_display_name is null;
