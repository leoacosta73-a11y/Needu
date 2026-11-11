begin;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists work_photos text[] not null default '{}';
create or replace function public.valid_profile_media(owner uuid, paths text[]) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(bool_and(path ~ ('^'||owner::text||'/[0-9a-f-]{36}\.jpg$')),true) from unnest(paths) path;
$$;
alter table public.profiles add constraint profile_avatar_owned check(avatar_path is null or public.valid_profile_media(id,array[avatar_path]));
alter table public.profiles add constraint profile_work_owned check(cardinality(work_photos)<=6 and array_position(work_photos,null) is null and public.valid_profile_media(id,work_photos));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-media','profile-media',false,3145728,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=3145728,allowed_mime_types=array['image/jpeg'];
create policy media_read on storage.objects for select to authenticated using(bucket_id='profile-media' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.profiles p where p.avatar_path=storage.objects.name or storage.objects.name=any(p.work_photos))));
create policy media_insert on storage.objects for insert to authenticated with check(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text and name ~ ('^'||auth.uid()::text||'/[0-9a-f-]{36}\.jpg$') and exists(select 1 from public.profiles where id=auth.uid()));
create policy media_delete on storage.objects for delete to authenticated using(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
