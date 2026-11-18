import fs from 'node:fs';
import {createECDH,randomBytes} from 'node:crypto';
const path='.env.push.local';
if(!fs.existsSync(path)){
 const key=createECDH('prime256v1');key.generateKeys();
 const values={VAPID_PUBLIC_KEY:key.getPublicKey().toString('base64url'),VAPID_PRIVATE_KEY:key.getPrivateKey().toString('base64url'),NEEDU_PUSH_SECRET:randomBytes(32).toString('hex'),VAPID_SUBJECT:'mailto:leoacosta73@gmail.com'};
 fs.writeFileSync(path,Object.entries(values).map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600});
}
const values=Object.fromEntries(fs.readFileSync(path,'utf8').trim().split('\n').map(row=>{const at=row.indexOf('=');return [row.slice(0,at),row.slice(at+1)]}));
let env=fs.readFileSync('.env.local','utf8').replace(/^VITE_VAPID_PUBLIC_KEY=.*\r?\n?/m,'');
fs.writeFileSync('.env.local',env.trimEnd()+'\nVITE_VAPID_PUBLIC_KEY='+values.VAPID_PUBLIC_KEY+'\n');
fs.mkdirSync('outputs',{recursive:true});
fs.writeFileSync('outputs/push-vault.sql',`do $$ begin
 if not exists(select 1 from vault.secrets where name='needu_push_webhook') then
  perform vault.create_secret('${values.NEEDU_PUSH_SECRET}','needu_push_webhook','Needu notification dispatcher');
 else raise exception 'Secret already configured: do not rotate accidentally'; end if;
end $$;\n`);
console.log('Push signing identity prepared in ignored local files. No private values printed.');
