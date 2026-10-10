import { SYSTEM_PROMPT } from './prompt.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function minimize(text) {
  return String(text || '').normalize('NFKC')
    .replace(/(?:clave|contraseña|password|pin|patr[oó]n|nombre|cliente|direcci[oó]n|serial|imei)\s*[:=]\s*[^\n,;]+/gi,'[DATO OMITIDO]')
    .replace(/[\w.+-]{1,128}@[\w.-]{1,128}\.[a-z]{2,20}/gi,'[CORREO OMITIDO]')
    // Teléfonos/IMEI/series: 9+ dígitos separados solo por espacios, guiones o paréntesis.
    // El punto NO separa: así las mediciones (0.412 0.389 / 3.8 1.8 1.2) llegan intactas a la IA.
    .replace(/(?<!\d|\d\.)\+?\d(?:[\s()-]*\d){8,}(?!\d|\.\d)/g,'[IDENTIFICADOR OMITIDO]');
}
export function safePoint(point){
 if(!point||typeof point!=='object'||Array.isArray(point)||Object.keys(point).some(k=>!['model','revision','ref','source','pins'].includes(k)))throw Error('INVALID_INPUT');
 for(const k of ['model','revision','ref'])if(typeof point[k]!=='string'||!point[k].trim()||point[k].length>80)throw Error('INVALID_INPUT');
 if(!point.source||typeof point.source!=='object'||Object.keys(point.source).some(k=>!['title','reference','license'].includes(k)))throw Error('INVALID_INPUT');
 for(const k of ['title','reference','license'])if(typeof point.source[k]!=='string'||!point.source[k].trim()||point.source[k].length>500)throw Error('INVALID_INPUT');
 if(!Array.isArray(point.pins)||point.pins.length>8||point.pins.some(p=>!p||Object.keys(p).some(k=>!['id','net'].includes(k))||typeof p.id!=='string'||p.id.length>40||typeof p.net!=='string'||p.net.length>120))throw Error('INVALID_INPUT');
 return {model:minimize(point.model),revision:minimize(point.revision),ref:minimize(point.ref),source:{title:minimize(point.source.title),reference:minimize(point.source.reference),license:minimize(point.source.license)},pins:point.pins.map(p=>({id:minimize(p.id),net:minimize(p.net)})),validation:'unverified'};
}
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(k=>!['session_id','request_id','message','context','consent'].includes(k)) ||
      !UUID.test(body.session_id) || !UUID.test(body.request_id) || body.consent !== true ||
      typeof body.message !== 'string' || !body.message.trim() || body.message.length > 1400) throw Error('INVALID_INPUT');
  const c = body.context ?? {};
  if (!c || typeof c !== 'object' || Array.isArray(c) || Object.keys(c).some(k=>!['bateria','consumo','sintomas','point'].includes(k))) throw Error('INVALID_INPUT');
  for (const key of ['bateria','consumo']) if (c[key] !== undefined && (typeof c[key] !== 'string' || c[key].length > 130)) throw Error('INVALID_INPUT');
  if (c.sintomas !== undefined && (!Array.isArray(c.sintomas) || c.sintomas.length>12 || c.sintomas.some(s=>typeof s!=='string'||s.length>160))) throw Error('INVALID_INPUT');
  return {session_id:body.session_id,request_id:body.request_id,message:minimize(body.message).trim(),
    context:{bateria:minimize(c.bateria),consumo:minimize(c.consumo),sintomas:(c.sintomas||[]).map(minimize),...(c.point?{point:safePoint(c.point)}:{})}};
}
export function buildMessages(turns, message, model, context) {
  // Database returns latest completed turns DESC. Keep complete pairs; chronological order.
  const messages=[];
  let budget=18000;
  const selected=[];
  for(const t of turns.slice(0,7)) {
    const c=t.context||{};
    const safe={bateria:typeof c.bateria==='string'?minimize(c.bateria).slice(0,130):'',
      consumo:typeof c.consumo==='string'?minimize(c.consumo).slice(0,130):'',
      sintomas:Array.isArray(c.sintomas)?c.sintomas.filter(s=>typeof s==='string').slice(0,12).map(s=>minimize(s).slice(0,160)):[]};
    if(c.point)try{const p={...c.point};delete p.validation;safe.point=safePoint(p);}catch{}
    const user=JSON.stringify({consulta:minimize(t.user_message).slice(0,1400),mediciones_reportadas:safe}), assistant=minimize(t.assistant_message).slice(0,4000);
    if(!user||!assistant||user.length+assistant.length>budget) break;
    budget-=user.length+assistant.length;selected.push({user,assistant});
  }
  for(const t of selected.reverse()) messages.push({role:'user',content:t.user},{role:'assistant',content:t.assistant});
  messages.push({role:'user',content:JSON.stringify({modelo:model,mediciones_reportadas:context,consulta:message})});
  return messages;
}
export function createHandler({env,fetchImpl=fetch}) {
  const allowed=(env('AI_BOARD_ALLOWED_ORIGINS')||'https://bayolcell.com,https://www.bayolcell.com').split(',').map(s=>s.trim()).filter(Boolean);
  return async req=>{
    const origin=req.headers.get('origin');
    const cors=origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin',
      'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{};
    const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
    if(origin&&!allowed.includes(origin))return json({ok:false,error:'Origen no autorizado.'},403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(req.method!=='POST')return json({ok:false,error:'Método no permitido.'},405);
    const token=req.headers.get('authorization')||'';
    if(!/^Bearer \S+$/i.test(token))return json({ok:false,error:'Inicia sesión.'},401);
    const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY'),service=env('SUPABASE_SERVICE_ROLE_KEY'),key=env('ANTHROPIC_API_KEY');
    if(!url||!anon||!service||!key)return json({ok:false,error:'Servicio de prueba no configurado.'},503);
    const headers={apikey:anon,Authorization:token,'Content-Type':'application/json'};
    const rest=async(path,opts={},admin=false)=>{
      const r=await fetchImpl(url+path,{...opts,headers:admin?{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'}:headers,signal:AbortSignal.timeout(10000)});
      const data=await r.json().catch(()=>null);
      if(!r.ok)throw Error(data?.message==='Quota exceeded'?'QUOTA':data?.message==='Turn in progress'?'BUSY':'ACCESS');
      return data;
    };
    let owner,turn;
    try {
      const auth=await fetchImpl(url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
      if(!auth.ok)return json({ok:false,error:'Sesión inválida.'},401);
      const user=await auth.json();owner=user.id;
      if(!UUID.test(owner)||user.is_anonymous)return json({ok:false,error:'Acceso no autorizado.'},403);
      if(await rest('/rest/v1/rpc/app_puede_diagnostico',{method:'POST',body:'{}'})!==true)return json({ok:false,error:'Sin permiso de diagnóstico.'},403);
      if(!req.headers.get('content-type')?.includes('application/json'))return json({ok:false,error:'Se requiere JSON.'},415);
      // Bound streamed input even if Content-Length is missing or dishonest.
      const reader=req.body?.getReader();let size=0;const chunks=[];
      if(!reader)throw Error('INVALID_INPUT');
      for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();return json({ok:false,error:'Solicitud demasiado grande.'},413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
      let parsed;try{parsed=JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('INVALID_INPUT');}
      const input=validate(parsed);
      const sessions=await rest('/rest/v1/ai_board_sessions?select=id,modelo&limit=1&id=eq.'+input.session_id);
      if(!Array.isArray(sessions)||sessions.length!==1)throw Error('ACCESS');
      if(input.context.point&&input.context.point.model!==sessions[0].modelo)throw Error('INVALID_INPUT');
      const reserved=await rest('/rest/v1/rpc/ai_board_reserve',{method:'POST',body:JSON.stringify({p_session:input.session_id,p_request:input.request_id,p_message:input.message,p_context:input.context})});
      if(!reserved?.fresh){
        if(reserved?.turn?.status==='completed')return json({ok:true,answer:reserved.turn.assistant_message,request_id:input.request_id,persisted:true});
        const waiting=reserved?.turn?.status==='pending';
        return json({ok:false,code:waiting?'TURN_PENDING':'TURN_FAILED',error:waiting?'Respuesta en proceso. Reintenta en unos segundos o recarga el historial.':'El intento anterior falló. Envía la consulta de nuevo.'},409);
      }
      turn=reserved.turn.id;
      const history=await rest('/rest/v1/ai_board_turns?select=user_message,assistant_message,context&session_id=eq.'+input.session_id+'&status=eq.completed&order=created_at.desc,id.desc&limit=7');
      // Modelo actual por defecto (10 oct 2026). Esfuerzo medio: respuestas técnicas cuidadosas sin demorar al técnico.
      // fallbacks:"default" = si el filtro de seguridad rechaza la consulta, la API reintenta sola con otro modelo.
      const msgs=buildMessages(history,input.message,sessions[0].modelo,input.context);
      const llamar=(extra,beta,ms)=>fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',signal:AbortSignal.timeout(ms),
        headers:{'x-api-key':key,'anthropic-version':'2023-06-01',...(beta?{'anthropic-beta':'server-side-fallback-2026-07-01'}:{}),'content-type':'application/json'},
        body:JSON.stringify({...extra,system:SYSTEM_PROMPT,messages:msgs})});
      let response=await llamar({model:env('AI_BOARD_CLAUDE_MODEL')||'claude-opus-5-5',max_tokens:8000,output_config:{effort:'medium'},fallbacks:'default'},true,55000);
      // Red de seguridad: si la cuenta no acepta el modelo o los parámetros nuevos, se usa el modelo de siempre.
      if(response.status===400||response.status===404){console.log('AIB-MODELO-NUEVO-RECHAZADO',response.status,(await response.text().catch(()=>'')).slice(0,300));response=await llamar({model:'claude-sonnet-4-6',max_tokens:4000},false,40000);}
      if(!response.ok){console.log('AIB-PROVIDER',response.status,(await response.text().catch(()=>'')).slice(0,300));throw Error('PROVIDER');}
      const data=await response.json();
      if(data.stop_reason==='refusal')throw Error('REFUSAL');
      const answer=minimize((data.content||[]).filter(b=>b.type==='text').map(b=>b.text||'').join('\n')).trim().slice(0,12000);
      if(!answer)throw Error('PROVIDER');
      // Recheck caller access after generation; do not save after reassignment/revocation.
      const stillAllowed=await rest('/rest/v1/ai_board_sessions?select=id&id=eq.'+input.session_id);
      if(!stillAllowed?.length)throw Error('ACCESS');
      const saved=await rest('/rest/v1/rpc/ai_board_finish',{method:'POST',body:JSON.stringify({p_turn:turn,p_owner:owner,p_answer:answer})},true);
      if(saved!==true)throw Error('SAVE');
      turn=null;
      return json({ok:true,answer,request_id:input.request_id,persisted:true});
    } catch(e) {
      if(turn)try{await rest('/rest/v1/rpc/ai_board_finish',{method:'POST',body:JSON.stringify({p_turn:turn,p_owner:owner,p_answer:null})},true);}catch{}
      const errors={INVALID_INPUT:[400,'Datos técnicos inválidos.'],QUOTA:[429,'Límite de consultas alcanzado.'],BUSY:[409,'Ya hay una respuesta en proceso.'],ACCESS:[403,'No tienes acceso a este caso.'],SAVE:[503,'No se confirmó el guardado. Recarga el historial antes de reintentar.'],REFUSAL:[422,'La IA no pudo responder esa consulta. Reformúlala con datos técnicos (modelo, síntoma, medición).']};
      const [code,error]=errors[e.message]||[502,'No se completó la consulta IA. Recarga el historial antes de reintentar.'];
      return json({ok:false,error},code);
    }
  };
}
