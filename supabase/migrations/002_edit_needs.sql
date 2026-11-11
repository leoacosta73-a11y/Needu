-- Edit only the current user's needs; ownership and creation date stay immutable.
begin;
grant update(title,description,category,area,locality_id,budget) on public.needs to authenticated;
drop policy if exists needs_update on public.needs;
create policy needs_update on public.needs for update to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
commit;
