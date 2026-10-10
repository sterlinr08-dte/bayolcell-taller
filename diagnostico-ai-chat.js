/* AI BOARD: authenticated owner AND authorized case. No messages in browser storage. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const client=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
let busy=false,owner=null,session=null,cases=[],epoch=0,pending=null,casePage=0,sessionPage=0,turnPage=0,selectedPoint=null,pointEpoch=0;
function status(message=''){const e=$('ab-chat-error');e.textContent=message;e.hidden=!message;}
function controls(){
  $('ab-chat-send').disabled=busy||turnPage>0||!session||!owner||!$('ab-chat-text').value.trim()||!$('ab-chat-agree').checked;
  for(const id of ['ab-chat-text','ab-chat-case','ab-chat-session','ab-chat-new','ab-chat-reload','ab-chat-create-case','ab-chat-delete'])$(id).disabled=busy;
  $('ab-chat-new').disabled=busy||!$('ab-chat-case').value||!owner;
  $('ab-chat-delete').disabled=busy||!session;
  for(const id of ['ab-chat-cases-prev','ab-chat-cases-next','ab-chat-sessions-prev','ab-chat-sessions-next','ab-chat-turns-prev','ab-chat-turns-next'])$(id).disabled=busy;
  $('ab-chat-cases-prev').disabled=busy||casePage===0;$('ab-chat-sessions-prev').disabled=busy||sessionPage===0;$('ab-chat-turns-prev').disabled=busy||turnPage===0;
}
function bubble(who,message){
  const item=document.createElement('article');item.className='ab-bubble '+who;
  const label=document.createElement('b');label.textContent=who==='human'?'Técnico':'Asistente IA';
  const body=document.createElement('p');body.textContent=message;item.append(label,body);$('ab-chat-feed').append(item);return item;
}
function reset(){epoch++;owner=null;session=null;pending=null;cases=[];selectedPoint=null;$('ab-chat-point').checked=false;$('ab-chat-point-note').textContent='Sin componente seleccionado';$('ab-chat-feed').replaceChildren();$('ab-chat-text').value='';$('ab-chat-agree').checked=false;
  $('ab-chat-use-form').checked=false;$('ab-chat-case').replaceChildren();$('ab-chat-session').replaceChildren();$('ab-chat-history-state').textContent='Historial no cargado';controls();}
function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}
function alignModel(model){const select=$('ab-model');if(select&&select.value!==model){select.value=model;select.dispatchEvent(new Event('change'));}}
async function checked(result){const {data,error}=await result;if(error)throw Error('Servicio de historial no disponible en este entorno.');return data;}
async function loadCases(){
  if(busy)return;reset();const version=epoch;busy=true;controls();status();
  try{
    const sb=client();if(!sb)throw Error('Inicia sesión en el taller.');
    const auth=await sb.auth.getUser();if(auth.error||!auth.data?.user||auth.data.user.is_anonymous)throw Error('Inicia sesión con una cuenta del taller.');
    const user=auth.data.user.id,found=await checked(sb.rpc('ai_board_cases',{p_offset:casePage*50,p_limit:50}));
    if(version!==epoch)return;owner=user;cases=Array.isArray(found)?found:[];
    option($('ab-chat-case'),'','Selecciona un diagnóstico guardado');
    for(const c of cases)option($('ab-chat-case'),c.id,c.modelo+' · Caso '+c.id.slice(0,8)+(c.orden_id?' · Con orden':''));
    $('ab-chat-history-state').textContent=cases.length?'Selecciona un caso para abrir su historial':'Sin casos autorizados';
    if(!cases.length)status('Guarda un diagnóstico asociado a tu usuario u orden asignada para iniciar.');
  }catch(e){if(version===epoch)status(e.message);}
  finally{busy=false;controls();}
}
async function loadSessions(){
  if(busy)return;const id=$('ab-chat-case').value;session=null;pending=null;epoch++;const version=epoch;
  $('ab-chat-feed').replaceChildren();$('ab-chat-session').replaceChildren();$('ab-chat-text').value='';$('ab-chat-agree').checked=false;$('ab-chat-use-form').checked=false;status();
  if(!id)return controls();busy=true;controls();
  try{
    const list=await checked(client().from('ai_board_sessions').select('id,modelo,created_at').eq('diagnostico_id',id).eq('owner_id',owner).order('created_at',{ascending:false}).order('id',{ascending:false}).range(sessionPage*30,sessionPage*30+29));
    if(version!==epoch)return;option($('ab-chat-session'),'','Selecciona o crea una conversación');
    for(const s of list)option($('ab-chat-session'),s.id,new Date(s.created_at).toLocaleString('es-DO')+' · '+s.modelo);
    $('ab-chat-history-state').textContent=list.length?'Conversaciones guardadas disponibles':'Sin conversaciones. Pulsa Nuevo chat.';
  }catch(e){if(version===epoch)status(e.message);}
  finally{busy=false;controls();}
}
async function history(){
  if(busy)return;const id=$('ab-chat-session').value;session=null;pending=null;epoch++;const version=epoch;
  $('ab-chat-feed').replaceChildren();status();if(!id)return controls();busy=true;controls();
  try{
    const s=await checked(client().from('ai_board_sessions').select('id,modelo,diagnostico_id').eq('id',id).eq('owner_id',owner).single());
    if(s.diagnostico_id!==$('ab-chat-case').value)throw Error('La conversación no pertenece al caso seleccionado.');
    const turns=await checked(client().from('ai_board_turns').select('user_message,assistant_message,status,created_at').eq('session_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(turnPage*40,turnPage*40+39));
    if(version!==epoch)return;session=s;alignModel(s.modelo);
    for(const t of turns.reverse()){
      bubble('human',t.user_message);
      bubble('ai',t.status==='completed'?t.assistant_message:t.status==='failed'?'Consulta fallida. Puedes enviarla de nuevo.':'Respuesta pendiente. Recarga el historial en unos segundos.');
    }
    $('ab-chat-history-state').textContent='Historial guardado · Página '+(turnPage+1)+' de turnos · '+s.modelo+(turnPage>0?' · Vuelve a mensajes recientes para enviar; tu borrador se conserva.':'');
    $('ab-chat-feed').scrollTop=$('ab-chat-feed').scrollHeight;
  }catch(e){if(version===epoch)status(e.message);}
  finally{busy=false;controls();}
}
async function newChat(){
  if(busy||!owner)return;const c=cases.find(c=>c.id===$('ab-chat-case').value);if(!c)return;
  busy=true;controls();status();const version=epoch;
  try{
    const s=await checked(client().from('ai_board_sessions').insert({owner_id:owner,diagnostico_id:c.id,modelo:c.modelo}).select('id,modelo,diagnostico_id').single());
    if(version!==epoch)return;
    option($('ab-chat-session'),s.id,'Nueva conversación · '+s.modelo);$('ab-chat-session').value=s.id;session=s;pending=null;alignModel(s.modelo);
    $('ab-chat-feed').replaceChildren();$('ab-chat-text').value='';$('ab-chat-agree').checked=false;$('ab-chat-use-form').checked=false;
    $('ab-chat-history-state').textContent='Conversación guardada · '+s.modelo;
  }catch(e){if(version===epoch)status(e.message);}
  finally{busy=false;controls();}
}
async function createCase(){
  if(busy)return;busy=true;controls();status();const version=epoch;
  try{
    const model=$('ab-model')?.value;if(!model)throw Error('Selecciona el modelo del iPhone.');
    const id=await checked(client().rpc('ai_board_create_case',{p_model:model}));
    if(version!==epoch)return;
    busy=false;casePage=0;sessionPage=0;turnPage=0;await loadCases();if(!owner)return;
    $('ab-chat-case').value=id;await loadSessions();
  }catch(e){if(version===epoch)status(e.message);}
  finally{busy=false;controls();}
}
async function deleteChat(){
  if(busy||!session||!confirm('¿Eliminar esta conversación y sus mensajes guardados?'))return;
  busy=true;controls();status();const version=epoch;
  try{
    const removed=await checked(client().from('ai_board_sessions').delete().eq('id',session.id).eq('owner_id',owner).select('id'));
    if(version!==epoch)return;if(!removed?.length)throw Error('No se confirmó la eliminación. Recarga el historial.');
    busy=false;await loadSessions();
  }catch(e){if(version===epoch)status(e.message);}
  finally{busy=false;controls();}
}
async function send(){
  const input=$('ab-chat-text'),message=input.value.trim();if(busy||!session||!owner||!message||!$('ab-chat-agree').checked)return;
  if(turnPage>0)return status('Vuelve a mensajes recientes antes de enviar. Tu borrador se conserva.');
  if(message.length>1400)return status('Máximo 1,400 caracteres.');
  const selected=$('ab-model')?.value;if(selected&&selected!==session.modelo)return status('El modelo del BITMAP no coincide con el diagnóstico. Selecciona '+session.modelo+' antes de enviar.');
  if($('ab-chat-use-form').checked&&$('dg_modelo')?.value.trim()!==session.modelo)return status('El formulario corresponde a otro modelo. Revisa las mediciones antes de incluirlas.');
  busy=true;controls();status();const version=epoch;let thinking;
  try{
    const auth=await client().auth.getUser();if(auth.error||auth.data?.user?.id!==owner)throw Error('Cambió tu sesión. Recarga los casos.');
    const context=$('ab-chat-use-form').checked?{
      bateria:($('dg_bateria')?.value||'').slice(0,130),consumo:($('dg_consumo')?.value||'').slice(0,130),
      sintomas:[...document.querySelectorAll('#dg_sintomas .diag-sint.on')].map(n=>n.textContent.trim().slice(0,160)).slice(0,12)
    }:{};
    if($('ab-chat-point').checked&&selectedPoint){if(selectedPoint.model!==session.modelo)throw Error('El componente pertenece a otro modelo. Selecciónalo de nuevo para este caso.');context.point=selectedPoint;}
    const payload=JSON.stringify({message,context,session_id:session.id});
    if(pending?.payload!==payload)pending={payload,id:crypto.randomUUID()};
    thinking=bubble('ai','Analizando…');
    const {data,error}=await client().functions.invoke('ai-board-chat',{body:{session_id:session.id,request_id:pending.id,message,context,consent:true}});
    if(error){let details;try{details=await error.context?.clone().json();}catch{}const code=error.context?.status;if(details?.code==='TURN_FAILED'||(code&&code<500&&code!==409))pending=null;throw Error(details?.error||'No se confirmó el envío. Recarga el historial antes de reintentar.');}
    if(!data?.ok||data.persisted!==true||typeof data.answer!=='string')throw Error(data?.error||'No se confirmó el guardado.');
    if(version!==epoch)return;
    thinking.remove();thinking=null;bubble('human',message);bubble('ai',data.answer);pending=null;input.value='';
    $('ab-chat-history-state').textContent='Respuesta e historial guardados · '+session.modelo;
    $('ab-chat-feed').scrollTop=$('ab-chat-feed').scrollHeight;
  }catch(e){if(version===epoch)status(e.message);}
  finally{thinking?.remove();busy=false;controls();}
}
function mount(){
  const legacy=$('ab-legacy');if(!legacy||$('ab-ai-chat'))return;
  const box=document.createElement('section');box.id='ab-ai-chat';
  box.innerHTML='<header><h3>Chat técnico con IA</h3><div><button id="ab-chat-new" type="button">Nuevo chat</button><button id="ab-chat-delete" type="button">Eliminar conversación</button></div></header>'+
  '<p class="ab-chat-tip">Conversaciones por diagnóstico. Envía únicamente información técnica; evita claves, identificadores y datos de clientes.</p>'+
  '<div class="ab-chat-history"><label>Diagnóstico guardado<select id="ab-chat-case"></select></label><label>Conversación<select id="ab-chat-session"></select></label><button id="ab-chat-reload" type="button">Recargar casos</button><button id="ab-chat-create-case" type="button">Crear diagnóstico del modelo seleccionado</button></div>'+
  '<div class="ab-chat-pages"><span>Casos <button id="ab-chat-cases-prev" type="button">Anteriores</button><button id="ab-chat-cases-next" type="button">Más</button></span><span>Conversaciones <button id="ab-chat-sessions-prev" type="button">Anteriores</button><button id="ab-chat-sessions-next" type="button">Más</button></span><span>Mensajes <button id="ab-chat-turns-prev" type="button">Recientes</button><button id="ab-chat-turns-next" type="button">Anteriores</button></span></div>'+
  '<p id="ab-chat-history-state" role="status">Historial no cargado</p><div id="ab-chat-feed" role="log" aria-label="Conversación con IA" aria-live="polite"></div>'+
  '<div class="ab-chat-composer"><label for="ab-chat-text">Consulta técnica</label><textarea id="ab-chat-text" rows="2" maxlength="1400" placeholder="Indica mediciones, condiciones y la próxima pregunta…"></textarea>'+
  '<div class="ab-chat-checks"><label><input id="ab-chat-use-form" type="checkbox"> Incluir síntomas y mediciones del formulario</label><label><input id="ab-chat-point" type="checkbox"> Incluir componente aportado, sin validación eléctrica</label><span id="ab-chat-point-note">Sin componente seleccionado</span><label><input id="ab-chat-agree" type="checkbox"> Autorizo enviar estos datos técnicos a la IA y guardarlos en este caso</label></div>'+
  '<button type="button" id="ab-chat-send" disabled>Enviar</button></div><p id="ab-chat-error" role="alert" hidden></p><p class="ab-chat-foot">Respuestas IA pendientes de validación técnica. Historial disponible cuando el backend de prueba esté instalado.</p>';
  legacy.prepend(box);legacy.querySelector('.ab-inline-note')?.remove();
  $('ab-chat-text').addEventListener('input',controls);
  $('ab-chat-text').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}});
  $('ab-chat-agree').addEventListener('change',controls);$('ab-chat-send').addEventListener('click',send);
  $('ab-chat-new').addEventListener('click',()=>{turnPage=0;newChat();});$('ab-chat-reload').addEventListener('click',()=>{casePage=0;sessionPage=0;turnPage=0;loadCases();});
  $('ab-chat-create-case').addEventListener('click',createCase);
  $('ab-chat-delete').addEventListener('click',deleteChat);
  $('ab-chat-case').addEventListener('change',()=>{sessionPage=0;turnPage=0;loadSessions();});$('ab-chat-session').addEventListener('change',()=>{turnPage=0;history();});
  for(const [id,delta] of [['ab-chat-cases-prev',-1],['ab-chat-cases-next',1]])$(id).addEventListener('click',()=>{if(!busy){casePage=Math.max(0,casePage+delta);loadCases();}});
  for(const [id,delta] of [['ab-chat-sessions-prev',-1],['ab-chat-sessions-next',1]])$(id).addEventListener('click',()=>{if(!busy&&$('ab-chat-case').value){sessionPage=Math.max(0,sessionPage+delta);loadSessions();}});
  for(const [id,delta] of [['ab-chat-turns-prev',-1],['ab-chat-turns-next',1]])$(id).addEventListener('click',()=>{if(!busy&&$('ab-chat-session').value){turnPage=Math.max(0,turnPage+delta);history();}});
  client()?.auth.onAuthStateChange((event,userSession)=>{
    if(event==='SIGNED_OUT'||(owner&&userSession?.user?.id!==owner)){casePage=0;sessionPage=0;turnPage=0;reset();window.dispatchEvent(new Event('bayol-ai-board-identity-reset'));status('Sesión cambiada. Recarga los casos.');}
  });
  controls();
  window.addEventListener('bayol-ai-board-point-reset',()=>{pointEpoch++;selectedPoint=null;$('ab-chat-point').checked=false;$('ab-chat-point-note').textContent='Sin componente seleccionado';});
  window.addEventListener('bayol-ai-board-point-query',async e=>{const point=e.detail,pointVersion=pointEpoch;if(!owner&&!busy)await loadCases();if(!owner||pointVersion!==pointEpoch)return;selectedPoint=point;$('ab-chat-point').checked=true;$('ab-chat-point-note').textContent=point.model+' · '+point.revision+' · '+point.ref+' · Fuente pendiente de comprobar';});
  // The old button used an endpoint without server authorization. Route this view
  // to the protected chat while keeping panic-log and manual tools in place.
  // Preserve the existing one-shot diagnostic button. The new secure chat remains
  // an independent feature and may be unavailable until the staging backend is deployed.
  const oldButton=$('dg_btn');if(oldButton){oldButton.title='Diagnóstico clásico disponible de forma independiente del chat';}
  const off=document.createElement('p');off.id='ab-chat-off';off.className='ab-chat-tip';off.hidden=true;
  off.textContent='El chat con historial todavía no está activado en el servidor. Mientras tanto, usa «Diagnosticar con IA» más abajo: funciona igual que siempre.';
  box.querySelector('header').after(off);
  // Solo se intenta cargar casos si el servidor del chat está instalado; si falta, no se muestran errores ni botones muertos.
  const abrir=async()=>{if(owner||busy)return;const ok=await (window.BayolAIBoardBackend?.disponible()??Promise.resolve(true));
    box.classList.toggle('ab-chat-pendiente',!ok);off.hidden=ok;if(ok)loadCases();};
  document.querySelector('[data-ab-tab="ia"]')?.addEventListener('click',abrir);
  $('ab-open-ia')?.addEventListener('click',abrir);
  if(!$('ab-pane-ia').hidden)abrir();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
