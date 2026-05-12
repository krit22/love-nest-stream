
-- Storage bucket
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media" on storage.objects for select using (bucket_id = 'media');
create policy "Authenticated upload media" on storage.objects for insert
  to authenticated with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners delete own media" on storage.objects for delete
  to authenticated using (bucket_id = 'media' and owner = auth.uid());

-- Media items
create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  user_id uuid not null,
  kind text not null check (kind in ('photo','video','voice')),
  url text not null,
  caption text,
  tag text,
  diary_entry_id uuid,
  vault_category text,
  duration_seconds int,
  created_at timestamptz not null default now()
);
alter table public.media_items enable row level security;
create policy "couple view media" on public.media_items for select using (couple_id = current_couple_id());
create policy "members insert media" on public.media_items for insert
  with check (user_id = auth.uid() and couple_id = current_couple_id());
create policy "members delete own media" on public.media_items for delete
  using (user_id = auth.uid() and couple_id = current_couple_id());

-- Vault items (Open When)
create table public.vault_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  user_id uuid not null,
  category text not null,
  kind text not null check (kind in ('text','photo','video','voice')),
  content text,
  url text,
  created_at timestamptz not null default now()
);
alter table public.vault_items enable row level security;
create policy "couple view vault" on public.vault_items for select using (couple_id = current_couple_id());
create policy "members insert vault" on public.vault_items for insert
  with check (user_id = auth.uid() and couple_id = current_couple_id());
create policy "members delete own vault" on public.vault_items for delete
  using (user_id = auth.uid() and couple_id = current_couple_id());

-- Virtual dates
create table public.virtual_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  created_by uuid not null,
  title text not null,
  scheduled_at timestamptz not null,
  recurrence text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.virtual_dates enable row level security;
create policy "couple view dates" on public.virtual_dates for select using (couple_id = current_couple_id());
create policy "members create dates" on public.virtual_dates for insert
  with check (created_by = auth.uid() and couple_id = current_couple_id());
create policy "couple update dates" on public.virtual_dates for update using (couple_id = current_couple_id());
create policy "couple delete dates" on public.virtual_dates for delete using (couple_id = current_couple_id());

-- Game results
create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  user_id uuid not null,
  game text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.game_results enable row level security;
create policy "couple view games" on public.game_results for select using (couple_id = current_couple_id());
create policy "members insert games" on public.game_results for insert
  with check (user_id = auth.uid() and couple_id = current_couple_id());
