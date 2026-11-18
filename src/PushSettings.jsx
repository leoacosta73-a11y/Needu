import React,{useEffect,useState} from 'react';
import {enablePush,disablePush,hasPush,pushSupport} from './push';
export default function PushSettings({userId}){
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState('');
  const unsupported=pushSupport();
  useEffect(()=>{let alive=true;hasPush(userId).then(value=>{if(alive)setEnabled(value)}).catch(()=>{if(alive)setError('No pudimos comprobar los avisos. Volvé a intentar.');}).finally(()=>{if(alive)setBusy(false)});return()=>{alive=false}},[userId]);
  async function toggle(){setBusy(true);setError('');try{if(enabled)await disablePush();else await enablePush(userId);setEnabled(!enabled)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <section className="push-settings"><div><strong>Avisos de mensajes</strong><p>{enabled?'Activados en este dispositivo, incluso con Needu cerrado.':'Recibí un aviso cuando te llegue un mensaje, aunque cierres Needu.'} No mostramos el texto de la conversación.</p></div>{unsupported?<p>{unsupported}</p>:<button className="outline" disabled={busy} onClick={toggle}>{busy?'Comprobando…':enabled?'Desactivar avisos':'Activar avisos'}</button>}{error&&<p role="alert">{error}</p>}<small>Dependen de los permisos, la conexión y los ajustes de batería del dispositivo. Se activan por dispositivo; no son avisos de “está escribiendo”.</small></section>
}
