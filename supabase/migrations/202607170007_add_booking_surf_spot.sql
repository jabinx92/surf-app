alter table public.booking_requests
add column if not exists surf_spot text not null default ''
check (surf_spot = '' or char_length(trim(surf_spot)) between 2 and 120);

alter policy "Customers can create their own booking requests"
on public.booking_requests
with check (
  auth.uid() = customer_id
  and creator_profile_id is not null
  and char_length(trim(contact_details)) between 2 and 300
  and char_length(trim(surf_spot)) between 2 and 120
);
