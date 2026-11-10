-- Apply to a NEW Supabase project. No service-role key belongs in the frontend.
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 name text not null check (length(name) between 1 and 80),
 title text not null check (length(title) between 1 and 100),
 bio text not null default '' check (length(bio)<=1000),
 skills text[] not null default '{}' check (cardinality(skills)<=8),
 category text not null, area text not null default '',
 available boolean not null default true, initials text, color text,
 schedule text not null default '' check(length(schedule)<=200)
);
create table public.needs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles on delete cascade,
 name text not null, title text not null check (length(title) between 1 and 100),
 description text not null check (length(description) between 1 and 1000),
 category text not null, area text not null, budget text,
 created_at timestamptz not null default now()
);
create table public.messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles on delete cascade,
 recipient_id uuid not null references public.profiles on delete cascade,
 body text not null check (length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now(), check(sender_id<>recipient_id)
);
create table public.presence (
 user_id uuid primary key references public.profiles on delete cascade,
 cell text, consent boolean not null default false,
 updated_at timestamptz not null default now(),
 check (consent or cell is null),
 check (cell is null or cell ~ '^-?[0-9]{1,2}(\.[0-9]{1,2})?,-?[0-9]{1,3}(\.[0-9]{1,2})?$')
);
alter table public.profiles enable row level security;
alter table public.needs enable row level security;
alter table public.messages enable row level security;
alter table public.presence enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(true);
create policy profiles_insert on public.profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy needs_read on public.needs for select to authenticated using(true);
create policy needs_insert on public.needs for insert to authenticated with check(owner_id=auth.uid());
create policy needs_delete on public.needs for delete to authenticated using(owner_id=auth.uid());
create policy messages_read on public.messages for select to authenticated using(auth.uid() in (sender_id,recipient_id));
create policy messages_insert on public.messages for insert to authenticated with check(sender_id=auth.uid());
create policy presence_read on public.presence for select to authenticated using(user_id=auth.uid());
create policy presence_insert on public.presence for insert to authenticated with check(user_id=auth.uid());
create policy presence_update on public.presence for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
-- Timestamps are server-owned: clients cannot create a non-expiring presence.
create function public.stamp_presence() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger stamp_presence before insert or update on public.presence for each row execute function public.stamp_presence();
-- Returns identities only, never grid coordinates or observation times.
create function public.nearby_crossings() returns table(id uuid,name text)
language sql security definer set search_path='' stable as $$
 select p.id,p.name from public.presence a
 join public.presence b on a.cell=b.cell and a.user_id<>b.user_id
 join public.profiles p on p.id=b.user_id
 where a.user_id=auth.uid() and a.consent and b.consent
 and a.updated_at>now()-interval '24 hours'
 and b.updated_at>now()-interval '24 hours';
$$;
revoke all on function public.nearby_crossings() from public, anon;
grant execute on function public.nearby_crossings() to authenticated;
revoke all on public.profiles,public.needs,public.messages,public.presence from anon;
revoke all on public.profiles,public.needs,public.messages,public.presence from authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,delete on public.needs to authenticated;
grant select,insert on public.messages to authenticated;
grant select,insert,update on public.presence to authenticated;
create index messages_recipient on public.messages(recipient_id,created_at);
create index messages_sender on public.messages(sender_id,created_at);
create index presence_cell on public.presence(cell) where consent;
create table public.favorites (
 user_id uuid not null references public.profiles on delete cascade,
 profile_id uuid not null references public.profiles on delete cascade,
 primary key(user_id,profile_id),check(user_id<>profile_id)
);
alter table public.favorites enable row level security;
revoke all on public.favorites from anon,authenticated;
grant select,insert,delete on public.favorites to authenticated;
create policy favorites_read on public.favorites for select to authenticated using(user_id=auth.uid());
create policy favorites_insert on public.favorites for insert to authenticated with check(user_id=auth.uid());
create policy favorites_delete on public.favorites for delete to authenticated using(user_id=auth.uid());
