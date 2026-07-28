create or replace function public.is_booking_participant(booking_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.booking_requests b
    left join public.creator_profiles c on c.id = b.creator_profile_id
    where b.id = booking_uuid and (b.customer_id = auth.uid() or c.owner_id = auth.uid())
  );
$$;

create or replace function public.is_booking_creator(booking_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.booking_requests b
    join public.creator_profiles c on c.id = b.creator_profile_id
    where b.id = booking_uuid and c.owner_id = auth.uid()
  );
$$;

revoke all on function public.is_booking_participant(uuid) from public;
revoke all on function public.is_booking_creator(uuid) from public;
grant execute on function public.is_booking_participant(uuid) to authenticated;
grant execute on function public.is_booking_creator(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-media', 'booking-media', false, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Booking participants can read delivery media"
on storage.objects for select to authenticated
using (bucket_id = 'booking-media' and public.is_booking_participant(((storage.foldername(name))[1])::uuid));

create policy "Booking creators can upload delivery media"
on storage.objects for insert to authenticated
with check (bucket_id = 'booking-media' and public.is_booking_creator(((storage.foldername(name))[1])::uuid));

create policy "Booking creators can delete delivery media"
on storage.objects for delete to authenticated
using (bucket_id = 'booking-media' and public.is_booking_creator(((storage.foldername(name))[1])::uuid));

create table if not exists public.booking_media (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  kind text not null check (kind in ('preview', 'final')),
  created_at timestamptz not null default now()
);

alter table public.booking_media enable row level security;
create policy "Booking participants can view media metadata" on public.booking_media for select to authenticated using (public.is_booking_participant(booking_request_id));
create policy "Booking creators can add media metadata" on public.booking_media for insert to authenticated with check (uploader_id = auth.uid() and public.is_booking_creator(booking_request_id));
create policy "Booking creators can remove media metadata" on public.booking_media for delete to authenticated using (uploader_id = auth.uid() and public.is_booking_creator(booking_request_id));
create index if not exists booking_media_booking_created_idx on public.booking_media (booking_request_id, created_at desc);

create table if not exists public.booking_media_favorites (
  media_id uuid not null references public.booking_media(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (media_id, user_id)
);
alter table public.booking_media_favorites enable row level security;
create policy "Participants can view media favorites" on public.booking_media_favorites for select to authenticated using (user_id = auth.uid() and exists (select 1 from public.booking_media m where m.id = media_id and public.is_booking_participant(m.booking_request_id)));
create policy "Participants can add media favorites" on public.booking_media_favorites for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.booking_media m where m.id = media_id and public.is_booking_participant(m.booking_request_id)));
create policy "Participants can remove media favorites" on public.booking_media_favorites for delete to authenticated using (user_id = auth.uid());

create table if not exists public.booking_media_notes (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.booking_media(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.booking_media_notes enable row level security;
create policy "Participants can view editing notes" on public.booking_media_notes for select to authenticated using (exists (select 1 from public.booking_media m where m.id = media_id and public.is_booking_participant(m.booking_request_id)));
create policy "Participants can add editing notes" on public.booking_media_notes for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.booking_media m where m.id = media_id and public.is_booking_participant(m.booking_request_id)));
create index if not exists booking_media_notes_media_created_idx on public.booking_media_notes (media_id, created_at);

alter table public.booking_requests add column if not exists delivery_status text not null default 'awaiting_uploads';
alter table public.booking_requests drop constraint if exists booking_requests_delivery_status_check;
alter table public.booking_requests add constraint booking_requests_delivery_status_check check (delivery_status in ('awaiting_uploads','preview_ready','changes_requested','final_ready','delivered'));
grant update (delivery_status) on public.booking_requests to authenticated;

create policy "Customers can update delivery feedback"
on public.booking_requests for update to authenticated
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id and delivery_status in ('changes_requested','delivered'));
