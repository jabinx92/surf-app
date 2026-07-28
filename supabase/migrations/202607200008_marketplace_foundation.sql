create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_wavelens_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_wavelens_admin() from public;
grant execute on function public.is_wavelens_admin() to authenticated;

create policy "Admins can view admin membership"
on public.admin_users for select to authenticated
using (public.is_wavelens_admin());

create policy "Admins can review creator applications"
on public.creator_applications for select to authenticated
using (public.is_wavelens_admin());

create table if not exists public.creator_availability (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  available_date date not null check (available_date >= current_date),
  start_time time not null,
  end_time time not null,
  surf_spot text not null default '',
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (creator_profile_id, available_date, start_time, end_time, surf_spot)
);

alter table public.creator_availability enable row level security;

create policy "Anyone can view listed creator availability"
on public.creator_availability for select to anon, authenticated
using (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_availability.creator_profile_id
    and creator_profiles.is_listed = true
));

create policy "Creators can manage their availability"
on public.creator_availability for all to authenticated
using (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_availability.creator_profile_id
    and creator_profiles.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_availability.creator_profile_id
    and creator_profiles.owner_id = auth.uid()
));

create index if not exists creator_availability_lookup_idx
on public.creator_availability (available_date, surf_spot, creator_profile_id);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  kind text not null check (kind in ('booking', 'application', 'system')),
  booking_request_id uuid references public.booking_requests(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_notifications enable row level security;

create policy "Users can view their notifications"
on public.user_notifications for select to authenticated
using (auth.uid() = user_id);

create policy "Users can mark their notifications read"
on public.user_notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_notifications_user_created_idx
on public.user_notifications (user_id, created_at desc);

alter table public.booking_requests
drop constraint if exists booking_requests_status_check;

alter table public.booking_requests
add constraint booking_requests_status_check
check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed'));

create policy "Customers can cancel their booking requests"
on public.booking_requests for update to authenticated
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id and status = 'cancelled');

create or replace function public.approve_creator_application(application_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  application_record public.creator_applications;
  profile_uuid uuid;
begin
  if not public.is_wavelens_admin() then
    raise exception 'Admin access required';
  end if;

  select * into application_record
  from public.creator_applications
  where id = application_uuid and status = 'pending'
  for update;

  if not found then raise exception 'Pending application not found'; end if;

  insert into public.creator_profiles (
    owner_id, application_id, display_name, city, services, portfolio_url,
    starting_rate, bio, travel_miles, is_listed
  ) values (
    application_record.applicant_id, application_record.id,
    application_record.display_name, application_record.city,
    application_record.services, application_record.portfolio_url,
    application_record.starting_rate, application_record.bio,
    application_record.travel_miles, true
  )
  on conflict (owner_id) do update set
    application_id = excluded.application_id,
    display_name = excluded.display_name,
    city = excluded.city,
    services = excluded.services,
    portfolio_url = excluded.portfolio_url,
    starting_rate = excluded.starting_rate,
    bio = excluded.bio,
    travel_miles = excluded.travel_miles,
    is_listed = true
  returning id into profile_uuid;

  update public.creator_applications set status = 'approved'
  where id = application_record.id;

  return profile_uuid;
end;
$$;

create or replace function public.reject_creator_application(application_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_wavelens_admin() then
    raise exception 'Admin access required';
  end if;
  update public.creator_applications set status = 'rejected'
  where id = application_uuid and status = 'pending';
  if not found then raise exception 'Pending application not found'; end if;
end;
$$;

revoke all on function public.approve_creator_application(uuid) from public;
revoke all on function public.reject_creator_application(uuid) from public;
grant execute on function public.approve_creator_application(uuid) to authenticated;
grant execute on function public.reject_creator_application(uuid) to authenticated;

create or replace function public.notify_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare creator_owner uuid;
begin
  if tg_op = 'INSERT' then
    select owner_id into creator_owner from public.creator_profiles where id = new.creator_profile_id;
    if creator_owner is not null then
      insert into public.user_notifications (user_id, title, body, kind, booking_request_id)
      values (creator_owner, 'New booking request', new.service_type || ' at ' || new.surf_spot || ' on ' || new.session_date, 'booking', new.id);
    end if;
  elsif old.status is distinct from new.status then
    insert into public.user_notifications (user_id, title, body, kind, booking_request_id)
    values (new.customer_id, 'Booking ' || new.status, new.surf_spot || ' on ' || new.session_date, 'booking', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_booking_change_trigger on public.booking_requests;
create trigger notify_booking_change_trigger
after insert or update of status on public.booking_requests
for each row execute function public.notify_booking_change();

create or replace function public.notify_application_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.user_notifications (user_id, title, body, kind)
    values (
      new.applicant_id,
      'Creator application ' || new.status,
      case when new.status = 'approved'
        then 'Your creator profile is now live on WaveLens.'
        else 'Your application was not approved. Contact support if you have questions.' end,
      'application'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_application_change_trigger on public.creator_applications;
create trigger notify_application_change_trigger
after update of status on public.creator_applications
for each row execute function public.notify_application_change();
