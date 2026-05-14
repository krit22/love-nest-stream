-- Make media bucket private
update storage.buckets set public = false where id = 'media';

-- Drop any old permissive policies on storage.objects for media bucket (idempotent)
drop policy if exists "media public read" on storage.objects;
drop policy if exists "media auth upload" on storage.objects;
drop policy if exists "media owner delete" on storage.objects;
drop policy if exists "media couple read" on storage.objects;
drop policy if exists "media owner insert" on storage.objects;
drop policy if exists "media owner update" on storage.objects;

-- Couple-scoped read: only members of the same couple as the file owner can read.
-- Path convention: "<owner_user_id>/<filename>"
create policy "media couple read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1
    from public.profiles me
    join public.profiles owner on owner.couple_id = me.couple_id
    where me.id = auth.uid()
      and me.couple_id is not null
      and owner.id::text = (storage.foldername(name))[1]
  )
);

-- Owner-only insert
create policy "media owner insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Owner-only update (for upserts/metadata)
create policy "media owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Owner-only delete
create policy "media owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);