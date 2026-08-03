alter table public.user_notifications
add column if not exists action_type text;

update public.user_notifications
set action_type = case
  when title ilike 'New booking message%' then 'message'
  when title ilike 'New booking request%' then 'creator_requests'
  when title ilike '%cancelled their booking' then 'creator_requests'
  when title ilike '%is complete' then 'gallery'
  when title ilike '%accepted your booking' then 'customer_requests'
  when title ilike '%declined your booking' then 'customer_requests'
  when title ilike 'Booking %' then 'customer_requests'
  else 'notifications'
end
where action_type is null;

alter table public.user_notifications
alter column action_type set default 'notifications',
alter column action_type set not null;

alter table public.user_notifications
drop constraint if exists user_notifications_action_type_check;

alter table public.user_notifications
add constraint user_notifications_action_type_check
check (action_type in ('message', 'creator_requests', 'customer_requests', 'gallery', 'notifications'));

create or replace function public.notify_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_owner uuid;
  creator_name text;
  customer_name text;
begin
  select owner_id, display_name
  into creator_owner, creator_name
  from public.creator_profiles
  where id = new.creator_profile_id;

  customer_name := coalesce(public.wavelens_user_display_name(new.customer_id), 'WaveLens user');
  creator_name := coalesce(creator_name, new.creator_display_name, 'your creator');

  if tg_op = 'INSERT' then
    if creator_owner is not null then
      insert into public.user_notifications (user_id, title, body, kind, booking_request_id, action_type)
      values (
        creator_owner,
        'New booking request from ' || customer_name,
        new.service_type || ' at ' || new.surf_spot || ' on ' || new.session_date,
        'booking', new.id, 'creator_requests'
      );
    end if;
  elsif old.status is distinct from new.status then
    if new.status = 'cancelled' and creator_owner is not null then
      insert into public.user_notifications (user_id, title, body, kind, booking_request_id, action_type)
      values (
        creator_owner,
        customer_name || ' cancelled their booking',
        new.surf_spot || ' on ' || new.session_date,
        'booking', new.id, 'creator_requests'
      );
    elsif new.status = 'accepted' then
      insert into public.user_notifications (user_id, title, body, kind, booking_request_id, action_type)
      values (
        new.customer_id,
        creator_name || ' accepted your booking',
        new.surf_spot || ' on ' || new.session_date,
        'booking', new.id, 'customer_requests'
      );
    elsif new.status = 'completed' then
      insert into public.user_notifications (user_id, title, body, kind, booking_request_id, action_type)
      values (
        new.customer_id,
        'Your booking with ' || creator_name || ' is complete',
        'Your final gallery is ready. Open the booking to view your delivery.',
        'booking', new.id, 'gallery'
      );
    elsif new.status = 'declined' then
      insert into public.user_notifications (user_id, title, body, kind, booking_request_id, action_type)
      values (
        new.customer_id,
        creator_name || ' declined your booking',
        new.surf_spot || ' on ' || new.session_date,
        'booking', new.id, 'customer_requests'
      );
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.notify_new_booking_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.booking_requests;
  creator_owner uuid;
  creator_name text;
  sender_name text;
  recipient uuid;
begin
  select * into booking from public.booking_requests where id = new.booking_request_id;
  select owner_id, display_name into creator_owner, creator_name
  from public.creator_profiles where id = booking.creator_profile_id;

  if new.sender_id = booking.customer_id then
    recipient := creator_owner;
    sender_name := coalesce(public.wavelens_user_display_name(new.sender_id), 'WaveLens user');
  else
    recipient := booking.customer_id;
    sender_name := coalesce(creator_name, booking.creator_display_name, 'your creator');
  end if;

  if recipient is not null then
    insert into public.user_notifications (user_id, title, body, kind, booking_request_id, action_type)
    values (
      recipient,
      'New booking message from ' || sender_name,
      left(new.body, 160),
      'booking', booking.id, 'message'
    );
  end if;
  return new;
end;
$$;
