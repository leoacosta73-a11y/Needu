import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const demo=window.location.protocol==='file:'||new URLSearchParams(window.location.search).get('demo')==='1';
export const supabase=!demo&&url&&key?createClient(url,key):null;
export async function result(request){const {data,error}=await request;if(error)throw error;return data;}
export async function googleEnabled(){
 const response=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});
 if(!response.ok)throw new Error('No se pudo comprobar el servicio de acceso.');
 const settings=await response.json();return settings.external?.google===true;
}
export const api={
 favorites:()=>result(supabase.from('favorites').select('profile_id')),
 save:(user_id,profile_id)=>result(supabase.from('favorites').insert({user_id,profile_id})),
 unsave:(user_id,profile_id)=>result(supabase.from('favorites').delete().eq('user_id',user_id).eq('profile_id',profile_id)),
 presence:()=>result(supabase.from('presence').select('consent').maybeSingle()),
 people:()=>result(supabase.from('profiles').select('*')),
 needs:()=>result(supabase.from('needs').select('*').order('created_at',{ascending:false})),
 profile:p=>result(supabase.from('profiles').upsert(p)),
 need:n=>result(supabase.from('needs').insert(n)),
 updateNeed:(id,owner_id,values)=>result(supabase.from('needs').update(values).eq('id',id).eq('owner_id',owner_id).select('id').single()),
 deleteNeed:(id,owner_id)=>result(supabase.from('needs').delete().eq('id',id).eq('owner_id',owner_id).select('id').single()),
 messages:()=>result(supabase.from('messages').select('*').order('created_at')),
 send:m=>result(supabase.from('messages').insert(m).select().single()),
 privacy:p=>result(supabase.from('presence').upsert(p)),
 crossings:()=>result(supabase.rpc('nearby_crossings'))
};
