create table if not exists public.push_notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique check (char_length(expo_push_token) between 20 and 300),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  platform text not null check (platform in ('ios', 'android')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.push_notification_devices enable row level security;
create policy "Users can view their push devices" on public.push_notification_devices
for select to authenticated using (auth.uid() = user_id);

create or replace function public.register_push_device(push_token text, device_timezone text, device_platform text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  insert into public.push_notification_devices (user_id, expo_push_token, timezone, platform, enabled, updated_at)
  values (auth.uid(), push_token, device_timezone, device_platform, true, now())
  on conflict (expo_push_token) do update set
    user_id = excluded.user_id, timezone = excluded.timezone,
    platform = excluded.platform, enabled = true, updated_at = now();
end;
$$;

create or replace function public.disable_push_devices()
returns void language sql security definer set search_path = public as $$
  update public.push_notification_devices set enabled = false, updated_at = now() where user_id = auth.uid();
$$;

revoke all on function public.register_push_device(text,text,text) from public;
revoke all on function public.disable_push_devices() from public;
grant execute on function public.register_push_device(text,text,text) to authenticated;
grant execute on function public.disable_push_devices() to authenticated;

create table if not exists public.booking_push_deliveries (
  expo_push_token text not null,
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  reminder_date date not null,
  created_at timestamptz not null default now(),
  primary key (expo_push_token, booking_request_id, reminder_date)
);
alter table public.booking_push_deliveries enable row level security;
