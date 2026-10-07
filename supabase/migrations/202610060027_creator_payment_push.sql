create table if not exists public.creator_payment_push_deliveries (
  expo_push_token text not null,
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (expo_push_token, booking_request_id)
);

alter table public.creator_payment_push_deliveries enable row level security;

