alter table public.creator_profiles
add column if not exists avatar_color text not null default '#2ed3b7';

alter table public.creator_profiles
drop constraint if exists creator_profiles_avatar_color_check;

alter table public.creator_profiles
add constraint creator_profiles_avatar_color_check
check (avatar_color in (
  '#f97066', '#f79009', '#fdb022', '#32d583', '#2ed3b7',
  '#2e90fa', '#6172f3', '#9b8afb', '#ee46bc', '#f04438'
));

revoke update on public.creator_profiles from authenticated;
grant update (display_name, portfolio_url, portfolio_urls, bio, avatar_url, avatar_color)
on public.creator_profiles to authenticated;
