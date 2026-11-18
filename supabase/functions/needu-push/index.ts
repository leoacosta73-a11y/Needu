import webpush from 'npm:web-push@3.6.7';
import {createClient} from 'npm:@supabase/supabase-js@2';

const allowedHosts=new Set(['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com']);
function validEndpoint(endpoint:string){
 try{const url=new URL(endpoint);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&!url.hash&&allowedHosts.has(url.hostname)}catch{return false}
}
async function equalSecret(a:string,b:string){
 const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [x,y]=await Promise.all([digest(a),digest(b)]);let difference=0;
 for(let i=0;i<x.length;i++)difference|=x[i]^y[i];return difference===0;
}
Deno.serve(async request=>{
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=Deno.env.get('NEEDU_PUSH_SECRET');
 if(!secret||!await equalSecret(request.headers.get('X-Needu-Push-Secret')||'',secret))return new Response('Unauthorized',{status:401});
 if(request.headers.get('X-Needu-Push-Check')==='1'){
  try{
   const details=webpush.generateRequestDetails({endpoint:'https://fcm.googleapis.com/fcm/send/configuration-check'},null,{vapidDetails:{subject:Deno.env.get('VAPID_SUBJECT')!,publicKey:Deno.env.get('VAPID_PUBLIC_KEY')!,privateKey:Deno.env.get('VAPID_PRIVATE_KEY')!}});
   return Response.json({signingReady:!!details.headers.Authorization||!!details.headers.authorization});
  }catch{return new Response('Signing configuration unavailable',{status:503})}
 }
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:jobs,error}=await db.rpc('claim_push_jobs');
 if(error)return new Response('Queue unavailable',{status:503});
 let processed=0;
 for(const job of jobs||[]){
  let retry=false;
  const {data:subscriptions,error:lookupError}=await db.from('push_subscriptions').select('id,endpoint').eq('user_id',job.recipient_id);
  if(lookupError)retry=true;
  else await Promise.all((subscriptions||[]).map(async subscription=>{
   if(!validEndpoint(subscription.endpoint)){await db.from('push_subscriptions').delete().eq('id',subscription.id);return}
   try{
    // Empty payload: no message body, sender, auth token or encryption keys leave Needu.
    const details=webpush.generateRequestDetails({endpoint:subscription.endpoint},null,{
     vapidDetails:{subject:Deno.env.get('VAPID_SUBJECT')||'mailto:leoacosta73@gmail.com',publicKey:Deno.env.get('VAPID_PUBLIC_KEY')!,privateKey:Deno.env.get('VAPID_PRIVATE_KEY')!},
     TTL:300,urgency:'high',topic:'needu-chat'
    });
    const response=await fetch(details.endpoint,{method:'POST',headers:details.headers,redirect:'error',signal:AbortSignal.timeout(8000)});
    if(response.status===404||response.status===410)await db.from('push_subscriptions').delete().eq('id',subscription.id);
    else if(!response.ok)retry=true;
    await response.body?.cancel();
   }catch{retry=true}
  }));
  const state=retry?(job.attempts>=5?'failed':'pending'):'sent';
  await db.from('push_jobs').update({state,available_at:new Date(Date.now()+Math.min(300,2**job.attempts*15)*1000).toISOString()}).eq('message_id',job.message_id).eq('attempts',job.attempts);
  processed++;
 }
 return Response.json({processed});
});
