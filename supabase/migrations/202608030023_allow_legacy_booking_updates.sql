alter table public.booking_requests
drop constraint if exists booking_requests_start_time_required;

create or replace function public.require_new_booking_start_time()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.session_start_time is null
    and (tg_op = 'INSERT' or old.session_start_time is not null) then
    raise exception 'Choose a start time before sending a booking request.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_new_booking_start_time_trigger on public.booking_requests;
create trigger require_new_booking_start_time_trigger
before insert or update of session_start_time on public.booking_requests
for each row execute function public.require_new_booking_start_time();
