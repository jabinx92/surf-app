alter table public.creator_applications
add column if not exists bio text not null default ''
check (char_length(bio) <= 500),
add column if not exists travel_miles integer not null default 20
check (travel_miles between 0 and 200);
