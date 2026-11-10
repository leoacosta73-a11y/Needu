import React,{useState} from 'react';
import {MapPin,Mail,ArrowRight} from 'lucide-react';
import {supabase,googleEnabled} from './backend';

function GoogleLogo(){return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.5-.1-2.9-.4-4.3H24v8.1h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.2z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.9 1.3-4.3 2-6.8 2-5.3 0-9.8-3.6-11.4-8.4H5.7v5.4A20.4 20.4 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.6 27.5a12.3 12.3 0 0 1 0-7V15H5.7a20 20 0 0 0 0 18l6.9-5.5z"/><path fill="#EA4335" d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.5 19.5 0 0 0 24 4 20.4 20.4 0 0 0 5.7 15l6.9 5.5C14.2 15.6 18.7 12 24 12z"/></svg>}

export default function Login(){
 const [pending,setPending]=useState(''),[error,setError]=useState(''),[sent,setSent]=useState(false);
 async function google(){
  setPending('google');setError('');
  try{
   if(!await googleEnabled())throw new Error('provider not enabled');
   const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
   if(error)throw error;
  }catch(e){setError(e.message.includes('provider')?'El acceso con Google todavía no está habilitado. Podés usar tu correo mientras lo configuramos.':'No pudimos abrir Google. Intentá nuevamente o usá tu correo.');setPending('')}
 }
 async function email(e){
  e.preventDefault();const address=new FormData(e.currentTarget).get('email').trim();setPending('email');setError('');
  try{const {error}=await supabase.auth.signInWithOtp({email:address,options:{emailRedirectTo:window.location.origin}});if(error)throw error;setSent(true)}
  catch(e){setError(e.status===429?'Esperá un momento antes de pedir otro enlace.':'No pudimos enviar el enlace. Revisá el correo e intentá de nuevo; también podés usar Google.')}
  finally{setPending('')}
 }
 return <div className="login-content"><span className="login-mark"><MapPin size={29}/></span><h2>Entrá a tu comunidad.</h2><p>Conectá lo que necesitás<br/>con lo que sabés hacer.</p><button className="google-login" disabled={!!pending} onClick={google}><GoogleLogo/><span>{pending==='google'?'Abriendo Google…':'Continuar con Google'}</span><ArrowRight size={17}/></button><div className="login-divider"><span>o con tu correo</span></div>{sent?<div className="email-sent" role="status"><Mail size={24}/><strong>Revisá tu correo</strong><p>Te enviamos un enlace para entrar. Abrilo en este navegador.</p><button className="text-link" onClick={()=>setSent(false)}>Usar otro correo</button></div>:<form onSubmit={email}><label>Correo electrónico<input type="email" name="email" placeholder="vos@ejemplo.com" required autoComplete="email" maxLength={254}/></label><button className="outline email-login" disabled={!!pending}><Mail size={17}/>{pending==='email'?'Enviando…':'Recibir enlace por correo'}</button></form>}{error&&<p className="login-error" role="alert">{error}</p>}<p className="login-note">Si es tu primera vez, creamos tu cuenta al ingresar.<br/>Google comparte tu nombre, correo y foto. No accedemos a tu Gmail.</p></div>
}
