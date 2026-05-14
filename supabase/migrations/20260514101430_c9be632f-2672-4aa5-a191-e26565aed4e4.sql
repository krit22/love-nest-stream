
insert into storage.buckets (id, name, public)
values ('diary-images', 'diary-images', false)
on conflict (id) do nothing;

create policy "couple members view diary images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'diary-images'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.couple_id is not null
      and p.couple_id::text = (storage.foldername(name))[1]
  )
);

create policy "members upload own diary images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.couple_id is not null
      and p.couple_id::text = (storage.foldername(name))[1]
  )
);

create policy "members delete own diary images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[2] = auth.uid()::text
);
