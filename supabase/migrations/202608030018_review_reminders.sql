alter table public.booking_requests
add column if not exists completed_at timestamptz;

update public.booking_requests
set completed_at = created_at
where status = 'completed' and completed_at is null;

create or replace function public.set_booking_completed_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at = now();
  elsif new.status <> 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_booking_completed_at_trigger on public.booking_requests;
create trigger set_booking_completed_at_trigger
before update of status on public.booking_requests
for each row execute function public.set_booking_completed_at();

create table if not exists public.review_reminder_deliveries (
  booking_request_id uuid primary key references public.booking_requests(id) on delete cascade,
  in_app_sent_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.review_reminder_deliveries enable row level security;

create index if not exists booking_requests_review_reminder_due_idx
on public.booking_requests (completed_at)
where status = 'completed' and completed_at is not null;
