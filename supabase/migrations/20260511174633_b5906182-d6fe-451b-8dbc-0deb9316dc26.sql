
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Partner',
  couple_id uuid,
  created_at timestamptz not null default now()
);

-- couples
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_couple_fk foreign key (couple_id) references public.couples(id) on delete set null;

-- invite codes
create table public.invite_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  used boolean not null default false,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

-- diary entries
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diary_entries_couple_date_idx on public.diary_entries(couple_id, entry_date desc);

-- moods
create table public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_date date not null default current_date,
  mood text not null,
  created_at timestamptz not null default now(),
  unique (user_id, mood_date)
);

-- streaks
create table public.streaks (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  current_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.invite_codes enable row level security;
alter table public.diary_entries enable row level security;
alter table public.moods enable row level security;
alter table public.streaks enable row level security;

-- Helper: get current user's couple_id (security definer to avoid recursive RLS)
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid()
$$;

-- profiles policies
create policy "Users view own profile or partner's"
  on public.profiles for select
  using (
    id = auth.uid()
    or (couple_id is not null and couple_id = public.current_couple_id())
  );

create policy "Users insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- couples policies
create policy "Members view their couple"
  on public.couples for select
  using (id = public.current_couple_id());

create policy "Authenticated can create couples"
  on public.couples for insert
  to authenticated
  with check (true);

-- invite codes policies
create policy "Users view own codes or unused valid codes"
  on public.invite_codes for select
  using (user_id = auth.uid() or (used = false and expires_at > now()));

create policy "Users create own codes"
  on public.invite_codes for insert
  with check (user_id = auth.uid());

create policy "Anyone authenticated can mark code used"
  on public.invite_codes for update
  to authenticated
  using (used = false and expires_at > now());

-- diary entries policies
create policy "Couple members view diary"
  on public.diary_entries for select
  using (couple_id = public.current_couple_id());

create policy "Members create own diary entries"
  on public.diary_entries for insert
  with check (
    user_id = auth.uid()
    and couple_id = public.current_couple_id()
  );

create policy "Members update own unlocked entries"
  on public.diary_entries for update
  using (
    user_id = auth.uid()
    and couple_id = public.current_couple_id()
    and entry_date = current_date
  );

create policy "Members delete own unlocked entries"
  on public.diary_entries for delete
  using (
    user_id = auth.uid()
    and couple_id = public.current_couple_id()
    and entry_date = current_date
  );

-- moods policies
create policy "Couple members view moods"
  on public.moods for select
  using (couple_id = public.current_couple_id());

create policy "Members upsert own mood"
  on public.moods for insert
  with check (user_id = auth.uid() and couple_id = public.current_couple_id());

create policy "Members update own todays mood"
  on public.moods for update
  using (user_id = auth.uid() and mood_date = current_date);

-- streaks policies
create policy "Couple members view streak"
  on public.streaks for select
  using (couple_id = public.current_couple_id());

create policy "Couple members upsert streak"
  on public.streaks for insert
  with check (couple_id = public.current_couple_id());

create policy "Couple members update streak"
  on public.streaks for update
  using (couple_id = public.current_couple_id());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to join a partner via invite code
create or replace function public.join_partner(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_couple_id uuid;
  v_my_profile record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_my_profile from public.profiles where id = auth.uid();
  if v_my_profile.couple_id is not null then
    raise exception 'You are already linked to a partner';
  end if;

  select * into v_invite from public.invite_codes
    where code = upper(p_code) and used = false and expires_at > now()
    for update;

  if not found then
    raise exception 'Invalid or expired code';
  end if;

  if v_invite.user_id = auth.uid() then
    raise exception 'You cannot use your own invite code';
  end if;

  -- Create couple
  insert into public.couples default values returning id into v_couple_id;

  -- Link both users
  update public.profiles set couple_id = v_couple_id where id in (auth.uid(), v_invite.user_id);

  -- Mark invite used
  update public.invite_codes set used = true, couple_id = v_couple_id where code = v_invite.code;

  -- Init streak
  insert into public.streaks (couple_id, current_streak, last_active_date)
    values (v_couple_id, 0, null);

  return v_couple_id;
end;
$$;

-- Function to bump streak when interaction happens
create or replace function public.bump_streak()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
  v_streak record;
  v_today date := current_date;
begin
  v_couple := public.current_couple_id();
  if v_couple is null then return; end if;

  select * into v_streak from public.streaks where couple_id = v_couple;
  if not found then
    insert into public.streaks (couple_id, current_streak, last_active_date)
      values (v_couple, 1, v_today);
    return;
  end if;

  if v_streak.last_active_date = v_today then
    return;
  elsif v_streak.last_active_date = v_today - 1 then
    update public.streaks set current_streak = current_streak + 1, last_active_date = v_today, updated_at = now()
      where couple_id = v_couple;
  else
    update public.streaks set current_streak = 1, last_active_date = v_today, updated_at = now()
      where couple_id = v_couple;
  end if;
end;
$$;

-- Function to unlink couple
create or replace function public.unlink_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
begin
  v_couple := public.current_couple_id();
  if v_couple is null then return; end if;
  update public.profiles set couple_id = null where couple_id = v_couple;
  delete from public.couples where id = v_couple;
end;
$$;
