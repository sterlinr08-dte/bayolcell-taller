#!/usr/bin/env node
// Real staging API smoke test. No provider calls until Auth/case/RLS checks pass.
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const PRODUCTION='vkhwdvjtowrhkhqavnvk';
export function target(value){
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!/^([a-z0-9]{20})\.supabase\.co$/.test(url.hostname))throw Error('Use the standard HTTPS URL of a separate Supabase staging project.');
 if(url.hostname===PRODUCTION+'.supabase.co')throw Error('Production project is forbidden by this test.');
 return url.origin;
}
export async function smoke(env=process.env,fetchImpl=fetch){
 const root=target(env.AI_BOARD_STAGING_URL),key=env.AI_BOARD_STAGING_ANON_KEY;
 const tokens=[env.AI_BOARD_STAGING_JWT_A,env.AI_BOARD_STAGING_JWT_B];
 if(!key||tokens.some(t=>!t))throw Error('Missing staging API key or two synthetic-user access tokens. Never use production tokens.');
 if(!/^[0-9a-f-]{36}$/i.test(env.AI_BOARD_STAGING_CASE_A||''))throw Error('Provide a synthetic staging diagnostic UUID owned by user A.');
 const api=async(path,index=0,options={})=>{
  const r=await fetchImpl(root+path,{...options,headers:{apikey:key,Authorization:'Bearer '+tokens[index],'Content-Type':'application/json',Prefer:'return=representation'},signal:AbortSignal.timeout(60000)});
  if(!r.ok)throw Error('Staging request failed ('+r.status+'): '+path.split('?')[0]);
  if(r.status===204)return null;return r.json();
 };
 const users=[];
 for(let i=0;i<2;i++){
  const user=await api('/auth/v1/user',i);if(!user.id||user.is_anonymous)throw Error('Both synthetic users must have non-anonymous Auth identities.');users.push(user);
  if(await api('/rest/v1/rpc/app_puede_diagnostico',i,{method:'POST',body:'{}'})!==true)throw Error('Synthetic user lacks diagnostic permission.');
 }
 if(users[0].id===users[1].id)throw Error('Use two distinct test users.');
 const cases=await api('/rest/v1/rpc/ai_board_cases',0,{method:'POST',body:JSON.stringify({p_offset:0,p_limit:50})});
 const fixture=cases.find(c=>c.id===env.AI_BOARD_STAGING_CASE_A);if(!fixture)throw Error('The synthetic case must be accessible to user A on the first page.');
 const sid=randomUUID();let created=false;
 try{
  const sessions=await api('/rest/v1/ai_board_sessions',0,{method:'POST',body:JSON.stringify({id:sid,owner_id:users[0].id,diagnostico_id:fixture.id,modelo:fixture.modelo})});created=true;
  if(sessions?.[0]?.id!==sid)throw Error('Session creation was not confirmed.');
  if((await api('/rest/v1/ai_board_sessions?select=id&id=eq.'+sid,1)).length)throw Error('RLS exposed private history to user B.');
  const first={session_id:sid,request_id:randomUUID(),message:'Prueba sintética de integración. No es una placa real ni una recomendación de reparación. Indica qué mediciones faltarían para evaluar un fallo de encendido, en máximo 60 palabras.',context:{},consent:true};
  const chat=body=>api('/functions/v1/ai-board-chat',0,{method:'POST',body:JSON.stringify(body)});
  const a=await chat(first);if(!a.ok||!a.persisted||!a.answer)throw Error('First provider response was not persisted.');
  const retry=await chat(first);if(retry.answer!==a.answer||!retry.persisted)throw Error('Idempotent retry changed the response.');
  const b=await chat({...first,request_id:randomUUID(),message:'Seguimiento de la prueba sintética: registra que no hay mediciones reales y propone una sola comprobación inicial, sin voltajes ni pines inventados. Máximo 60 palabras.'});
  if(!b.ok||!b.persisted)throw Error('Follow-up was not persisted.');
  const turns=await api('/rest/v1/ai_board_turns?select=status,assistant_message&session_id=eq.'+sid);
  if(turns.length!==2||turns.some(t=>t.status!=='completed'||!t.assistant_message))throw Error('Expected exactly two completed persisted turns.');
  const denied=await fetchImpl(root+'/functions/v1/ai-board-chat',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+tokens[1],'Content-Type':'application/json'},body:JSON.stringify({...first,request_id:randomUUID()}),signal:AbortSignal.timeout(60000)});
  if(denied.status!==403)throw Error('Endpoint did not reject access by user B.');
  return {ok:true,checks:['Auth A/B','case permission','private RLS','real provider response','multi-turn persistence','idempotent retry','cross-user denial']};
 }finally{
  if(created){const removed=await api('/rest/v1/ai_board_sessions?id=eq.'+sid,0,{method:'DELETE'});if(removed?.[0]?.id!==sid)throw Error('Test session cleanup was not confirmed; inspect staging before retrying.');}
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await smoke()));}catch(e){console.error(e.message);process.exitCode=1;}
}
