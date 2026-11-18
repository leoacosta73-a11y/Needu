import fs from 'node:fs';
import assert from 'node:assert/strict';
const values=Object.fromEntries(fs.readFileSync('.env.push.local','utf8').trim().split('\n').map(row=>{const i=row.indexOf('=');return [row.slice(0,i),row.slice(i+1)]}));
const gateway=fs.readFileSync('outputs/push-gateway.txt','utf8').trim();
const url='https://qrldafaakjpffbinansp.supabase.co/functions/v1/needu-push';
for(const [name,headers,expected] of [
 ['gateway rejects unsigned requests',{},401],
 ['service rejects missing private secret',{Authorization:'Bearer '+gateway},401],
 ['service rejects incorrect private secret',{Authorization:'Bearer '+gateway,'X-Needu-Push-Secret':'invalid'},401],
 ['authorized dispatcher runs',{Authorization:'Bearer '+gateway,'X-Needu-Push-Secret':values.NEEDU_PUSH_SECRET},200]
]){
 const response=await fetch(url,{method:'POST',headers,signal:AbortSignal.timeout(25000)});
 assert.equal(response.status,expected,name+': '+response.status);
 console.log('PASS:',name);
}
const check=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+gateway,'X-Needu-Push-Secret':values.NEEDU_PUSH_SECRET,'X-Needu-Push-Check':'1'},signal:AbortSignal.timeout(25000)});
assert.equal(check.status,200);assert.equal((await check.json()).signingReady,true);
console.log('PASS: server generates signed empty-payload push without sending to any device');
