do $$
begin
  alter publication supabase_realtime add table public.date_call_signals;
exception
  when duplicate_object then null;
end $$;