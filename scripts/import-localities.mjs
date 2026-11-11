import {readFile, writeFile, mkdir} from 'node:fs/promises';
const url = 'https://apis.datos.gob.ar/georef/api/localidades?max=5000&campos=id,nombre,provincia,departamento&orden=id';
const data = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : await (await fetch(url, {signal: AbortSignal.timeout(30000)})).json();
if (!Array.isArray(data.localidades) || data.localidades.length !== data.total || data.total < 3000) throw Error('Incomplete Georef catalog; do not publish.');
// Some Georef entries contain both census and subdivision IDs with identical
// names in the same department. Use the more specific ID consistently.
const groups = new Map();
for (const row of data.localidades) {
  const key = `${row.provincia.id}/${row.departamento.id}/${row.nombre}`;
  const previous = groups.get(key);
  if (!previous || row.id.length > previous.id.length) groups.set(key, row);
}
const names = new Map();
for (const row of groups.values()) {const key = `${row.provincia.id}/${row.nombre}`; names.set(key, (names.get(key) || 0) + 1);}
const localities = [...groups.values()].map(row => ({id:row.id, name:row.nombre, province:row.provincia.nombre, provinceId:row.provincia.id, department:row.departamento.nombre,
  label:`${row.nombre}, ${row.provincia.nombre}${names.get(`${row.provincia.id}/${row.nombre}`) > 1 ? ` (${row.departamento.nombre})` : ''}`})).sort((a,b) => a.id.localeCompare(b.id));
if (new Set(localities.map(row => row.id)).size !== localities.length || new Set(localities.map(row => row.label)).size !== localities.length) throw Error('Ambiguous catalog identities.');
await writeFile(new URL('../public/localidades-ar.json', import.meta.url), JSON.stringify({source:url, retrievedAt:new Date().toISOString().slice(0,10), localities}));
await mkdir(new URL('../supabase/migrations/', import.meta.url), {recursive:true});
const quote = value => `'${value.replaceAll("'", "''")}'`;
const seed = localities.map(row => `(${quote(row.id)},${quote(row.label)})`).join(',\n');
const sql = `-- Official Georef locality catalog. Additive migration; legacy rows remain intact.
begin;
create table if not exists public.argentina_localities (id text primary key, label text not null unique);
alter table public.argentina_localities enable row level security;
revoke all on public.argentina_localities from anon, authenticated;
grant select on public.argentina_localities to authenticated;
drop policy if exists localities_read on public.argentina_localities;
create policy localities_read on public.argentina_localities for select to authenticated using (true);
insert into public.argentina_localities(id,label) values
${seed}
on conflict(id) do update set label=excluded.label;
alter table public.profiles add column if not exists locality_id text references public.argentina_localities(id);
alter table public.needs add column if not exists locality_id text references public.argentina_localities(id);
create or replace function public.canonical_locality() returns trigger
language plpgsql set search_path='' as $$
declare canonical text;
begin
 if new.locality_id is not null then
  select label into canonical from public.argentina_localities where id=new.locality_id;
  if canonical is null then raise exception 'Elegí una localidad válida del catálogo.'; end if;
  new.area := canonical;
 elsif TG_OP='INSERT' then
  raise exception 'Elegí una localidad del catálogo.';
 elsif new.area is distinct from old.area then
  raise exception 'Confirmá tu localidad desde el catálogo.';
 end if;
 return new;
end;
$$;
drop trigger if exists canonical_locality on public.profiles;
create trigger canonical_locality before insert or update on public.profiles for each row execute function public.canonical_locality();
drop trigger if exists canonical_locality on public.needs;
create trigger canonical_locality before insert or update on public.needs for each row execute function public.canonical_locality();
commit;
`;
await writeFile(new URL('../supabase/migrations/001_localities.sql', import.meta.url), sql);
console.log(JSON.stringify({sourceRows:data.total, canonicalRows:localities.length, pilar:localities.filter(row=>row.name==='Pilar')}));
