alter table public.booking_requests
add column if not exists contact_details text not null default ''
check (contact_details = '' or char_length(trim(contact_details)) between 2 and 300);

alter policy "Customers can create their own booking requests"
on public.booking_requests
with check (
  auth.uid() = customer_id
  and creator_profile_id is not null
  and char_length(trim(contact_details)) between 2 and 300
);

revoke update on public.booking_requests from authenticated;
grant update (status) on public.booking_requests to authenticated;
