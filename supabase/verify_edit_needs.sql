-- Synthetic fixtures only. Rollback leaves existing publications untouched.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000011'),('00000000-0000-4000-8000-000000000012');
insert into public.profiles(id,name,title,category,locality_id) values
('00000000-0000-4000-8000-000000000011','Test owner','Test','Clases','0663804008'),
('00000000-0000-4000-8000-000000000012','Test other','Test','Clases','0663804008');
insert into public.needs(id,owner_id,name,title,description,category,area,locality_id) values
('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000011','Test owner','Original','Apoyo escolar','Clases','Pilar, Buenos Aires','0663804008');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
do $$ declare n integer; begin
 update public.needs set title='Unauthorized' where id='00000000-0000-4000-8000-000000000013';
 get diagnostics n=row_count; if n<>0 then raise exception 'Other user edited need'; end if;
 delete from public.needs where id='00000000-0000-4000-8000-000000000013';
 get diagnostics n=row_count; if n<>0 then raise exception 'Other user deleted need'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
do $$ declare n integer; begin
 update public.needs set title='Edited',description='Nuevo contenido',category='Clases',budget='A convenir',locality_id='14119160',area='Spoof' where id='00000000-0000-4000-8000-000000000013';
 get diagnostics n=row_count; if n<>1 then raise exception 'Owner edit failed'; end if;
 if not exists(select 1 from public.needs where id='00000000-0000-4000-8000-000000000013' and title='Edited' and area='Pilar, Córdoba') then raise exception 'Edit or canonical locality failed'; end if;
 begin
 update public.needs set owner_id='00000000-0000-4000-8000-000000000012' where id='00000000-0000-4000-8000-000000000013';
 raise exception 'Ownership transfer permitted';
 exception when insufficient_privilege then null; end;
 delete from public.needs where id='00000000-0000-4000-8000-000000000013';
 get diagnostics n=row_count; if n<>1 then raise exception 'Owner delete failed'; end if;
end $$;
reset role;
select 'PASS: owner edit/delete, other user blocked, immutable ownership, canonical locality' as verification;
rollback;
