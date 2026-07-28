alter table public.creator_profiles
add column if not exists is_verified boolean not null default false;

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.booking_messages enable row level security;

create policy "Booking participants can view messages"
on public.booking_messages for select to authenticated
using (exists (
  select 1 from public.booking_requests b
  left join public.creator_profiles c on c.id = b.creator_profile_id
  where b.id = booking_messages.booking_request_id
    and (b.customer_id = auth.uid() or c.owner_id = auth.uid())
));

create policy "Booking participants can send messages"
on public.booking_messages for insert to authenticated
with check (
  sender_id = auth.uid() and exists (
    select 1 from public.booking_requests b
    left join public.creator_profiles c on c.id = b.creator_profile_id
    where b.id = booking_messages.booking_request_id
      and (b.customer_id = auth.uid() or c.owner_id = auth.uid())
      and b.status in ('pending', 'accepted', 'completed')
  )
);

create index if not exists booking_messages_booking_created_idx
on public.booking_messages (booking_request_id, created_at);

create table if not exists public.creator_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null unique references public.booking_requests(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.creator_reviews enable row level security;

create policy "Anyone can view creator reviews"
on public.creator_reviews for select to anon, authenticated using (true);

create policy "Customers can review completed bookings"
on public.creator_reviews for insert to authenticated
with check (
  reviewer_id = auth.uid() and exists (
    select 1 from public.booking_requests b
    where b.id = creator_reviews.booking_request_id
      and b.customer_id = auth.uid()
      and b.creator_profile_id = creator_reviews.creator_profile_id
      and b.status = 'completed'
  )
);

create index if not exists creator_reviews_profile_created_idx
on public.creator_reviews (creator_profile_id, created_at desc);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  creator_profile_id uuid references public.creator_profiles(id) on delete set null,
  booking_request_id uuid references public.booking_requests(id) on delete set null,
  message_id uuid references public.booking_messages(id) on delete set null,
  reason text not null check (reason in ('spam', 'harassment', 'safety', 'fraud', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (creator_profile_id is not null or booking_request_id is not null or message_id is not null)
);

alter table public.user_reports enable row level security;

create policy "Users can submit reports"
on public.user_reports for insert to authenticated
with check (reporter_id = auth.uid() and status = 'open');

create policy "Users can view their reports"
on public.user_reports for select to authenticated
using (reporter_id = auth.uid() or public.is_wavelens_admin());

create policy "Admins can update reports"
on public.user_reports for update to authenticated
using (public.is_wavelens_admin())
with check (public.is_wavelens_admin());

create index if not exists user_reports_status_created_idx
on public.user_reports (status, created_at desc);

create or replace function public.set_creator_verified(profile_uuid uuid, verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_wavelens_admin() then raise exception 'Admin access required'; end if;
  update public.creator_profiles set is_verified = verified where id = profile_uuid;
  if not found then raise exception 'Creator profile not found'; end if;
end;
$$;

revoke all on function public.set_creator_verified(uuid, boolean) from public;
grant execute on function public.set_creator_verified(uuid, boolean) to authenticated;

create or replace function public.notify_new_booking_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare booking public.booking_requests; creator_owner uuid; recipient uuid;
begin
  select * into booking from public.booking_requests where id = new.booking_request_id;
  select owner_id into creator_owner from public.creator_profiles where id = booking.creator_profile_id;
  recipient := case when new.sender_id = booking.customer_id then creator_owner else booking.customer_id end;
  if recipient is not null then
    insert into public.user_notifications (user_id, title, body, kind, booking_request_id)
    values (recipient, 'New booking message', left(new.body, 160), 'booking', booking.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_new_booking_message_trigger on public.booking_messages;
create trigger notify_new_booking_message_trigger after insert on public.booking_messages
for each row execute function public.notify_new_booking_message();
