alter table public.creator_profiles
add column if not exists portfolio_urls text[] not null default '{}';

update public.creator_profiles
set portfolio_urls = array[
  case
    when portfolio_url ~* '^https?://' then portfolio_url
    else 'https://' || portfolio_url
  end
]
where cardinality(portfolio_urls) = 0;

create or replace function public.valid_portfolio_urls(urls text[])
returns boolean
language sql
immutable
set search_path = public
as $$
  select cardinality(urls) between 1 and 5
    and not exists (
      select 1
      from unnest(urls) as portfolio_url
      where portfolio_url !~* '^https?://'
        or char_length(portfolio_url) > 500
        or char_length(trim(portfolio_url)) < 10
    );
$$;

alter table public.creator_profiles
drop constraint if exists creator_profiles_portfolio_urls_check;

alter table public.creator_profiles
add constraint creator_profiles_portfolio_urls_check
check (public.valid_portfolio_urls(portfolio_urls));

revoke update on public.creator_profiles from authenticated;
grant update (display_name, portfolio_url, portfolio_urls, bio, avatar_url) on public.creator_profiles to authenticated;
