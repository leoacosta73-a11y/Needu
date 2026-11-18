-- Reversible real-policy check for first profile and first need.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000041');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000041',true);
insert into public.profiles(id,name,title,bio,skills,category,locality_id,available,initials,color)
values(auth.uid(),'QA alta','Apoyo escolar','Prueba',array['Matematica'],'Clases','0663804008',true,'QA','#e9e1ff');
update public.profiles set available=false,schedule='Lunes 9 a 18' where id=auth.uid();
insert into public.needs(id,owner_id,name,title,description,category,area,locality_id,budget)
values('00000000-0000-4000-8000-000000000042',auth.uid(),'QA alta','QA necesidad','Prueba','Clases','Nombre incorrecto','0663804008','A convenir');
do $$ begin
 if not exists(select 1 from public.profiles where id=auth.uid() and available=false and schedule='Lunes 9 a 18' and area='Pilar, Buenos Aires') then raise exception 'First profile or availability failed';end if;
 if not exists(select 1 from public.needs where id='00000000-0000-4000-8000-000000000042' and owner_id=auth.uid() and area='Pilar, Buenos Aires') then raise exception 'First need failed';end if;
end $$;
reset role;
rollback;
select 'PASS: first authenticated profile, availability, first need, canonical location, rollback' as verification;
