create table if not exists public.creator_portfolio_media (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text not null,
  position smallint not null check (position between 0 and 5),
  created_at timestamptz not null default now(),
  unique (creator_profile_id, position)
);

alter table public.creator_portfolio_media enable row level security;

create policy "Portfolio media is public"
on public.creator_portfolio_media for select to anon, authenticated
using (true);

create policy "Creators can add their portfolio media"
on public.creator_portfolio_media for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.creator_profiles
    where id = creator_profile_id and owner_id = auth.uid()
  )
);

create policy "Creators can remove their portfolio media"
on public.creator_portfolio_media for delete to authenticated
using (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creator-portfolio',
  'creator-portfolio',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Creator portfolio files are public"
on storage.objects for select to anon, authenticated
using (bucket_id = 'creator-portfolio');

create policy "Creators can upload portfolio files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'creator-portfolio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Creators can delete portfolio files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'creator-portfolio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create index if not exists creator_portfolio_media_profile_position_idx
on public.creator_portfolio_media (creator_profile_id, position);
