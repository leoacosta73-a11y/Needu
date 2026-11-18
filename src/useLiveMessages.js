import {useEffect,useRef,useState} from 'react';
import {supabase} from './backend';
export default function useLiveMessages(userId,onMessage,onRefresh){
 const callbacks=useRef({onMessage,onRefresh});callbacks.current={onMessage,onRefresh};
 const [status,setStatus]=useState('connecting');
 useEffect(()=>{
  if(!supabase||!userId)return;
  let alive=true;
  const receive=({new:message})=>{if(alive)callbacks.current.onMessage(message)};
  setStatus('connecting');
  const channel=supabase.channel(`messages:${userId}`)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`recipient_id=eq.${userId}`},receive)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`sender_id=eq.${userId}`},receive)
   .subscribe(state=>{if(!alive)return;setStatus(state==='SUBSCRIBED'?'live':'connecting');if(state==='SUBSCRIBED')callbacks.current.onRefresh()});
  const resume=()=>{if(alive&&document.visibilityState==='visible')callbacks.current.onRefresh()};
  document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  const timer=setInterval(resume,30000);
  return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);supabase.removeChannel(channel)};
 },[userId]);
 return status;
}
