import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const vars=Object.fromEntries((await readFile(new URL('../.env.local',import.meta.url),'utf8')).trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
const base=vars.VITE_SUPABASE_URL, headers={apikey:vars.VITE_SUPABASE_ANON_KEY};
const settings=await fetch(base+'/auth/v1/settings',{headers});assert.equal(settings.status,200);const auth=await settings.json();assert.equal(auth.external.email,true);
assert.equal(auth.external.google,true);
assert.equal(auth.disable_signup,false);
console.log('PASS: Supabase Auth responds; Google and email enabled; new accounts allowed.');
for(const table of ['profiles','needs','messages','presence','favorites']){
 const res=await fetch(base+'/rest/v1/'+table+'?select=*',{headers});
 assert.ok([401,403].includes(res.status),`Anonymous access unexpectedly permitted: ${table} (${res.status})`);
 console.log('PASS: unauthenticated reads blocked for '+table);
}
