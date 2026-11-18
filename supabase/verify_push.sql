-- Transactional tests: no persisted identities/subscriptions, no push sent.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000041'),('00000000-0000-4000-8000-000000000042');
insert into public.profiles(id,name,title,category,locality_id) values
('00000000-0000-4000-8000-000000000041','QA Push A','Prueba','Hogar','0663804008'),
('00000000-0000-4000-8000-000000000042','QA Push B','Prueba','Hogar','0663804008');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000042',true);
select public.register_push_subscription('https://fcm.googleapis.com/fcm/send/needu-transaction-only');
select public.register_push_subscription('https://fcm.googleapis.com/fcm/send/needu-transaction-only');
do $$ begin
 if (select count(*) from public.push_subscriptions where user_id=auth.uid())<>1 then raise exception 'Registration not idempotent';end if;
 begin perform public.register_push_subscription('https://localhost/private');raise exception 'Invalid endpoint accepted';exception when raise_exception then if SQLERRM='Invalid endpoint accepted' then raise;end if;end;
 begin perform public.claim_push_jobs();raise exception 'Queue accessible';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000041',true);
do $$ begin
 if exists(select 1 from public.push_subscriptions where user_id='00000000-0000-4000-8000-000000000042') then raise exception 'Subscription leaked';end if;
end $$;
insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'00000000-0000-4000-8000-000000000042','QA push transactional');
reset role;
do $$ begin
 if not exists(select 1 from public.push_jobs where recipient_id='00000000-0000-4000-8000-000000000042' and state='pending') then raise exception 'Message did not enqueue';end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='messages') then raise exception 'Realtime not enabled';end if;
end $$;
set local role service_role;
do $$ begin
 if not exists(select 1 from public.claim_push_jobs() where recipient_id='00000000-0000-4000-8000-000000000042' and attempts=1) then raise exception 'Claim failed';end if;
end $$;
reset role;
rollback;
select 'PASS: realtime publication, subscription isolation, endpoint validation, queue permissions, enqueue, claim and rollback' as verification;
