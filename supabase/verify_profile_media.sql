begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000021'),('00000000-0000-4000-8000-000000000022');
insert into public.profiles(id,name,title,category,locality_id) values
('00000000-0000-4000-8000-000000000021','Media A','Test','Hogar','0663804008'),
('00000000-0000-4000-8000-000000000022','Media B','Test','Hogar','0663804008');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000021',true);
insert into storage.objects(bucket_id,name) values('profile-media','00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg');
update public.profiles set avatar_path='00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg' where id=auth.uid();
do $$ begin
 begin
  update public.profiles set work_photos=array_fill('00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg'::text,array[7]) where id=auth.uid();
  raise exception 'Seven photos accepted';
 exception when check_violation then null; end;
 begin
  insert into storage.objects(bucket_id,name) values('profile-media','00000000-0000-4000-8000-000000000022/00000000-0000-4000-8000-000000000024.jpg');
  raise exception 'Foreign folder upload accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000022',true);
do $$ declare n integer; begin
 if (select count(*) from storage.objects where bucket_id='profile-media' and name='00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg')<>1 then raise exception 'Shared profile image not visible to signed in user';end if;
 update public.profiles set avatar_path=null where id='00000000-0000-4000-8000-000000000021';
 get diagnostics n=row_count;if n<>0 then raise exception 'Other profile modified';end if;
 begin
  update public.profiles set avatar_path='00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg' where id=auth.uid();
  raise exception 'Foreign image attached';
 exception when check_violation then null;end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000021',true);
update public.profiles set avatar_path=null where id=auth.uid();
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000022',true);
do $$ begin
 if exists(select 1 from storage.objects where bucket_id='profile-media' and name='00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg') then raise exception 'Removed image still discoverable by other user';end if;
end $$;
reset role;
set local role anon;
do $$ begin
 if exists(select 1 from storage.objects where bucket_id='profile-media' and name='00000000-0000-4000-8000-000000000021/00000000-0000-4000-8000-000000000023.jpg') then raise exception 'Anonymous storage access';end if;
end $$;
reset role;
select 'PASS: owned uploads, shared authenticated reads, anonymous isolation, own profile only, six photo limit, removed image hidden' as verification;
rollback;
