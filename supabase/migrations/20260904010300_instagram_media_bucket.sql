insert into storage.buckets (id, name, public) values ('instagram-media', 'instagram-media', false);

create policy "instagram_media_auth_insert_out" on storage.objects for insert to authenticated
  with check (bucket_id = 'instagram-media' and (storage.foldername(name))[1] = 'out');

create policy "instagram_media_auth_read" on storage.objects for select to authenticated
  using (bucket_id = 'instagram-media');
