create table if not exists public.date_call_signals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  virtual_date_id uuid not null references public.virtual_dates(id) on delete cascade,
  sender_id uuid not null,
  recipient_id uuid not null,
  signal_type text not null check (signal_type in ('call-request','call-accepted','call-rejected','offer','answer','ice-candidate','hangup','screen-started','screen-stopped','ping')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.date_call_signals enable row level security;

create index if not exists idx_date_call_signals_room_recent
  on public.date_call_signals (couple_id, virtual_date_id, created_at desc);

create index if not exists idx_date_call_signals_recipient_recent
  on public.date_call_signals (recipient_id, created_at desc);

create policy "couple can view their date call signals"
  on public.date_call_signals
  for select
  using (
    couple_id = public.current_couple_id()
    and (sender_id = auth.uid() or recipient_id = auth.uid())
    and expires_at > now()
  );

create policy "couple members can create date call signals"
  on public.date_call_signals
  for insert
  with check (
    couple_id = public.current_couple_id()
    and sender_id = auth.uid()
    and exists (
      select 1
      from public.profiles partner
      where partner.id = recipient_id
        and partner.couple_id = public.current_couple_id()
    )
    and exists (
      select 1
      from public.virtual_dates vd
      where vd.id = virtual_date_id
        and vd.couple_id = public.current_couple_id()
    )
  );