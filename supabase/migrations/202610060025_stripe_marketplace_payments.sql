create table if not exists public.creator_payout_accounts (
  creator_profile_id uuid primary key references public.creator_profiles(id) on delete cascade,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.creator_payout_accounts enable row level security;
create policy "Creators can view their payout readiness"
on public.creator_payout_accounts for select to authenticated
using (exists (
  select 1 from public.creator_profiles
  where creator_profiles.id = creator_payout_accounts.creator_profile_id
    and creator_profiles.owner_id = auth.uid()
));

alter table public.booking_requests
add column if not exists amount_cents integer check (amount_cents is null or amount_cents > 0),
add column if not exists platform_fee_cents integer check (platform_fee_cents is null or platform_fee_cents >= 0),
add column if not exists currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
add column if not exists paid_at timestamptz;

update public.booking_requests booking
set amount_cents = creator.starting_rate * booking.session_hours * 100
from public.creator_profiles creator
where creator.id = booking.creator_profile_id
  and booking.amount_cents is null;

create or replace function public.snapshot_booking_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare hourly_rate integer;
begin
  select starting_rate into hourly_rate
  from public.creator_profiles
  where id = new.creator_profile_id and is_listed = true;
  if hourly_rate is null then raise exception 'This creator is not available for booking.'; end if;
  new.amount_cents := hourly_rate * new.session_hours * 100;
  new.currency := 'usd';
  new.payment_status := 'unpaid';
  new.paid_at := null;
  return new;
end;
$$;

drop trigger if exists snapshot_booking_price_trigger on public.booking_requests;
create trigger snapshot_booking_price_trigger
before insert on public.booking_requests
for each row execute function public.snapshot_booking_price();

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null unique references public.booking_requests(id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0 and platform_fee_cents <= amount_cents),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  status text not null check (status in ('processing', 'paid', 'failed', 'refunded')),
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_payments enable row level security;

create policy "Booking participants can view payment status"
on public.booking_payments for select to authenticated
using (
  exists (
    select 1
    from public.booking_requests booking
    left join public.creator_profiles creator on creator.id = booking.creator_profile_id
    where booking.id = booking_payments.booking_request_id
      and (booking.customer_id = auth.uid() or creator.owner_id = auth.uid())
  )
);

create index if not exists booking_payments_booking_idx
on public.booking_payments (booking_request_id);

create or replace function public.protect_payment_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and (
      new.amount_cents is distinct from old.amount_cents
      or new.platform_fee_cents is distinct from old.platform_fee_cents
      or new.currency is distinct from old.currency
      or new.payment_status is distinct from old.payment_status
      or new.paid_at is distinct from old.paid_at
    ) then
    raise exception 'Payment fields can only be changed by the payment service.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_booking_payment_fields on public.booking_requests;
create trigger protect_booking_payment_fields
before update on public.booking_requests
for each row execute function public.protect_payment_fields();

create or replace function public.require_creator_payouts_before_acceptance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted'
    and not exists (
      select 1 from public.creator_payout_accounts payout
      where payout.creator_profile_id = new.creator_profile_id
        and payout.charges_enabled = true
        and payout.payouts_enabled = true
    ) then
    raise exception 'Set up creator payouts before accepting a paid booking.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_creator_payouts_before_acceptance_trigger on public.booking_requests;
create trigger require_creator_payouts_before_acceptance_trigger
before update of status on public.booking_requests
for each row execute function public.require_creator_payouts_before_acceptance();

drop policy if exists "Customers can cancel their booking requests" on public.booking_requests;
create policy "Customers can cancel unpaid booking requests"
on public.booking_requests for update to authenticated
using (auth.uid() = customer_id and payment_status <> 'paid')
with check (auth.uid() = customer_id and status = 'cancelled' and payment_status <> 'paid');

