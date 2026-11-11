-- Transactional isolation tests: all fixtures are rolled back.
begin;
insert into auth.users(id) values
('00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002'),
('00000000-0000-4000-8000-000000000003');
insert into public.profiles(id,name,title,category,locality_id) values
('00000000-0000-4000-8000-000000000001','Test A','Prueba','Hogar','0663804008'),
('00000000-0000-4000-8000-000000000002','Test B','Prueba','Hogar','14119160'),
('00000000-0000-4000-8000-000000000003','Test C','Prueba','Hogar','0663804008');
insert into public.messages(sender_id,recipient_id,body) values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Prueba privada');
insert into public.presence(user_id,cell,consent) values
('00000000-0000-4000-8000-000000000001','-34.6,-58.38',true),
('00000000-0000-4000-8000-000000000002','-34.6,-58.38',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$ begin
 if (select count(*) from public.messages)<>0 then raise exception 'Third party can read private messages'; end if;
 if (select count(*) from public.presence)<>0 then raise exception 'Third party can read presence'; end if;
 if (select count(*) from public.nearby_crossings())<>0 then raise exception 'No consent exposes crossings'; end if;
 begin
 insert into public.messages(sender_id,recipient_id,body) values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Spoof');
 raise exception 'Sender spoofing succeeded';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
update public.profiles set area='Pilar Pilar, inventado' where id=auth.uid();
do $$ begin
 if (select area from public.profiles where id=auth.uid())<>'Pilar, Buenos Aires' then raise exception 'Canonical locality not enforced'; end if;
 begin
  update public.profiles set locality_id='invalid' where id=auth.uid();
  raise exception 'Invalid locality accepted';
 exception when raise_exception then
  if SQLERRM='Invalid locality accepted' then raise; end if;
 end;
end $$;
do $$ begin
 if (select count(*) from public.messages)<>1 then raise exception 'Participant cannot read conversation'; end if;
 if (select count(*) from public.presence)<>1 then raise exception 'Presence ownership incorrect'; end if;
 if (select count(*) from public.nearby_crossings())<>1 then raise exception 'Consented crossing absent'; end if;
end $$;
update public.presence set consent=false,cell=null where user_id=auth.uid();
do $$ begin
 if (select count(*) from public.nearby_crossings())<>0 then raise exception 'Revocation failed'; end if;
end $$;
reset role;
select 'PASS: private messages, sender identity, presence isolation, mutual consent, revocation' as verification;
rollback;
