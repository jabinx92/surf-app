create table if not exists public.surf_map_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.surf_map_cache enable row level security;
create index if not exists surf_map_cache_expires_at_idx on public.surf_map_cache (expires_at);
