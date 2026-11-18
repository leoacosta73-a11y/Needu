import {supabase,result} from './backend';
const publicKey=import.meta.env.VITE_VAPID_PUBLIC_KEY;
const ownerKey='needu.push-owner';
export function pushSupport(){
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!window.matchMedia('(display-mode: standalone)').matches&&!navigator.standalone)return 'En iPhone o iPad, abrí Needu en Safari, tocá Compartir → Agregar a inicio y abrilo desde ese ícono para activar los avisos.';
  if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return 'Este navegador no admite avisos con la página cerrada. Probá con Chrome, Edge o Safari compatible.';
  if(!publicKey||import.meta.env.VITE_PUSH_ENABLED!=='true')return 'Los avisos todavía no están disponibles. Podés seguir usando el chat.';
  return '';
}
export async function registerWorker(){
  if('serviceWorker' in navigator&&window.isSecureContext)return navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
}
function keyBytes(key){return Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
export async function hasPush(userId){
  if(pushSupport()||Notification.permission!=='granted')return false;
  const registration=await navigator.serviceWorker.getRegistration('/');
  const sub=await registration?.pushManager.getSubscription();
  if(!sub||localStorage.getItem(ownerKey)!==userId)return false;
  const rows=await result(supabase.from('push_subscriptions').select('id').eq('endpoint',sub.endpoint));
  return !!rows.length;
}
export async function enablePush(userId){
  const unsupported=pushSupport();if(unsupported)throw Error(unsupported);
  // Permission must be requested directly from a user gesture (especially iOS).
  const permission=await Notification.requestPermission();
  if(permission!=='granted')throw Error('No se activaron los avisos. Podés habilitarlos en los permisos del navegador cuando quieras.');
  await registerWorker();const registration=await navigator.serviceWorker.ready;
  let sub=await registration.pushManager.getSubscription();
  if(sub&&localStorage.getItem(ownerKey)!==userId){await sub.unsubscribe();sub=null;}
  if(!sub)sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(publicKey)});
  try{const {data}=await supabase.auth.getSession();if(data.session?.user.id!==userId)throw Error('Tu sesión cambió. Volvé a activar los avisos.');await result(supabase.rpc('register_push_subscription',{p_endpoint:sub.endpoint}));localStorage.setItem(ownerKey,userId);}
  catch(error){await sub.unsubscribe();throw error;}
}
export async function detachOtherAccount(userId){
  const owner=localStorage.getItem(ownerKey);
  if(!owner||owner===userId)return;
  const registration=await navigator.serviceWorker?.getRegistration('/');
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
  for(const notification of await registration?.getNotifications()||[])notification.close();
  localStorage.removeItem(ownerKey);
}
export async function disablePush(){
  const registration=await navigator.serviceWorker?.getRegistration('/');
  const sub=await registration?.pushManager.getSubscription();
  if(sub){
    if(supabase)await result(supabase.from('push_subscriptions').delete().eq('endpoint',sub.endpoint));
    await sub.unsubscribe();
  }
  localStorage.removeItem(ownerKey);
  for(const notification of await registration?.getNotifications()||[])notification.close();
}
