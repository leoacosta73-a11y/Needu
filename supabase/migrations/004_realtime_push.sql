-- Apply with a project administrator. Message contents never enter the push queue.
begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create extension if not exists supabase_vault with schema vault;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
  alter publication supabase_realtime add table public.messages;
 end if;
end $$;

create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique check(length(endpoint)<2048),
 created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon,authenticated;
grant select,delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;
create policy push_own_read on public.push_subscriptions for select to authenticated using(user_id=auth.uid());
create policy push_own_delete on public.push_subscriptions for delete to authenticated using(user_id=auth.uid());
create or replace function public.register_push_subscription(p_endpoint text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Ingresá para activar los avisos'; end if;
 if length(p_endpoint)>=2048 or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com)/[^[:space:]]+$' then raise exception 'Servicio de avisos no admitido'; end if;
 -- Serialize registrations for this account so the limit cannot be raced.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.push_subscriptions where endpoint=p_endpoint and user_id<>auth.uid()) then raise exception 'Volvé a activar los avisos desde este dispositivo'; end if;
 if exists(select 1 from public.push_subscriptions where endpoint=p_endpoint and user_id=auth.uid()) then return; end if;
 if (select count(*) from public.push_subscriptions where user_id=auth.uid())>=5 then raise exception 'Ya tenés avisos en 5 dispositivos. Desactivá uno para agregar otro.'; end if;
 insert into public.push_subscriptions(user_id,endpoint) values(auth.uid(),p_endpoint);
end $$;
revoke all on function public.register_push_subscription(text) from public,anon;
grant execute on function public.register_push_subscription(text) to authenticated;

create table if not exists public.push_jobs (
 message_id uuid primary key references public.messages(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 state text not null default 'pending' check(state in ('pending','processing','sent','failed')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 locked_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.push_jobs enable row level security;
revoke all on public.push_jobs from public,anon,authenticated;
grant all on public.push_jobs to service_role;
create index if not exists push_jobs_due on public.push_jobs(state,available_at);
create or replace function public.claim_push_jobs() returns setof public.push_jobs
language sql security definer set search_path='' as $$
 update public.push_jobs j set state='processing',attempts=j.attempts+1,locked_at=now()
 where j.message_id in (
  select message_id from public.push_jobs
  where attempts<5 and ((state='pending' and available_at<=now()) or (state='processing' and locked_at<now()-interval '2 minutes'))
  order by created_at for update skip locked limit 20
 ) returning j.*;
$$;
revoke all on function public.claim_push_jobs() from public,anon,authenticated;
grant execute on function public.claim_push_jobs() to service_role;
create or replace function public.dispatch_needu_push() returns void
language plpgsql security definer set search_path='' as $$
declare secret text; gateway_key text;
begin
 delete from public.push_jobs where created_at<now()-interval '7 days';
 update public.push_jobs set state='failed' where state='processing' and attempts>=5 and locked_at<now()-interval '2 minutes';
 if not exists(select 1 from public.push_jobs where (state='pending' and available_at<=now()) or (state='processing' and locked_at<now()-interval '2 minutes' and attempts<5)) then return; end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='needu_push_webhook' limit 1;
 select decrypted_secret into gateway_key from vault.decrypted_secrets where name='needu_push_gateway' limit 1;
 if secret is null or gateway_key is null then return; end if;
 perform net.http_post(
  url:='https://qrldafaakjpffbinansp.supabase.co/functions/v1/needu-push',
  headers:=jsonb_build_object('Content-Type','application/json','X-Needu-Push-Secret',secret,'Authorization','Bearer '||gateway_key),
  body:='{}'::jsonb,timeout_milliseconds:=10000
 );
end $$;
revoke all on function public.dispatch_needu_push() from public,anon,authenticated;
create or replace function public.queue_needu_push() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.push_subscriptions where user_id=new.recipient_id) then
  insert into public.push_jobs(message_id,recipient_id) values(new.id,new.recipient_id) on conflict do nothing;
  begin perform public.dispatch_needu_push(); exception when others then
   -- A transient push outage must never block a chat message. Cron retries.
   null;
  end;
 end if;
 return new;
end $$;
revoke all on function public.queue_needu_push() from public,anon,authenticated;
create trigger messages_push after insert on public.messages for each row execute function public.queue_needu_push();
select cron.schedule('needu-push-retry','* * * * *','select public.dispatch_needu_push()');
commit;
