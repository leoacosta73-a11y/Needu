-- Exercises actual production policies with synthetic identities, never real chats.
-- Everything is rolled back; no usable login credentials are created.
begin;
insert into auth.users(id) values
('00000000-0000-4000-8000-000000000031'),
('00000000-0000-4000-8000-000000000032'),
('00000000-0000-4000-8000-000000000033');
insert into public.profiles(id,name,title,category,locality_id) values
('00000000-0000-4000-8000-000000000031','QA A','Prueba','Hogar','0663804008'),
('00000000-0000-4000-8000-000000000032','QA B','Prueba','Hogar','0663804008'),
('00000000-0000-4000-8000-000000000033','QA C','Prueba','Hogar','0663804008');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
insert into public.messages(sender_id,recipient_id,body) values
(auth.uid(),'00000000-0000-4000-8000-000000000032','QA mensaje de A a B');
insert into public.favorites(user_id,profile_id) values(auth.uid(),'00000000-0000-4000-8000-000000000032');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000032',true);
do $$ begin
 if not exists(select 1 from public.messages where body='QA mensaje de A a B' and sender_id='00000000-0000-4000-8000-000000000031' and recipient_id=auth.uid()) then raise exception 'B did not receive message';end if;
 if exists(select 1 from public.favorites where user_id='00000000-0000-4000-8000-000000000031') then raise exception 'Private favorite leaked';end if;
end $$;
insert into public.messages(sender_id,recipient_id,body) values
(auth.uid(),'00000000-0000-4000-8000-000000000031','QA respuesta de B a A');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
do $$ begin
 if (select count(*) from public.messages where sender_id in ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000032') and recipient_id in ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000032'))<>2 then raise exception 'Roundtrip failed';end if;
 begin
  insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'00000000-0000-4000-8000-000000000032','   ');
  raise exception 'Blank accepted';
 exception when check_violation then null;end;
 begin
  insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'00000000-0000-4000-8000-000000000032',repeat('x',1001));
  raise exception 'Oversized accepted';
 exception when check_violation then null;end;
 begin
  insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),auth.uid(),'Self');
  raise exception 'Self message accepted';
 exception when check_violation then null;end;
end $$;
delete from public.favorites where user_id=auth.uid();
do $$ begin
 if exists(select 1 from public.favorites where user_id=auth.uid()) then raise exception 'Unsave failed';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000033',true);
do $$ begin
 if exists(select 1 from public.messages where sender_id in ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000032')) then raise exception 'Third-party message leak';end if;
end $$;
reset role;
rollback;
select 'PASS: authenticated send, recipient read, reply, third-party isolation, validation, favorites, rollback' as verification;
