alter table public.booking_requests
add column if not exists preview_gallery_url text not null default '',
add column if not exists final_gallery_url text not null default '',
add column if not exists delivery_message text not null default '';

alter table public.booking_requests
drop constraint if exists booking_requests_preview_gallery_url_check,
drop constraint if exists booking_requests_final_gallery_url_check,
drop constraint if exists booking_requests_delivery_message_check;

alter table public.booking_requests
add constraint booking_requests_preview_gallery_url_check check (preview_gallery_url = '' or (preview_gallery_url ~ '^https?://' and char_length(preview_gallery_url) <= 2048)),
add constraint booking_requests_final_gallery_url_check check (final_gallery_url = '' or (final_gallery_url ~ '^https?://' and char_length(final_gallery_url) <= 2048)),
add constraint booking_requests_delivery_message_check check (char_length(delivery_message) <= 1000);

grant update (preview_gallery_url, final_gallery_url, delivery_message, delivery_status)
on public.booking_requests to authenticated;

create table if not exists public.booking_delivery_notes (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.booking_delivery_notes enable row level security;

create policy "Booking participants can view delivery notes"
on public.booking_delivery_notes for select to authenticated
using (public.is_booking_participant(booking_request_id));

create policy "Booking participants can add delivery notes"
on public.booking_delivery_notes for insert to authenticated
with check (author_id = auth.uid() and public.is_booking_participant(booking_request_id));

create index if not exists booking_delivery_notes_booking_created_idx
on public.booking_delivery_notes (booking_request_id, created_at);
