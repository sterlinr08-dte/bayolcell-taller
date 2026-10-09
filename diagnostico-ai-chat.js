/* AI BOARD: authenticated owner AND authorized case. No messages in browser storage. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const client=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
let busy=false,owner=null,session=null,cases=[],epoch=0,pending=null;
function status(message=''){const e=$('ab-chat-error');e.textContent=message;e.hidden=!message;}
function controls(){
  $('ab-chat-send').disabled=busy||!session||!owner||!$('ab-chat-text').value.trim()||!$('ab-chat-agree').checked;
  for(const id of ['ab-chat-text','ab-chat-case','ab-chat-session','ab-chat-new','ab-chat-reload','ab-chat-create-case','ab-chat-delete'])$(id).disabled=busy;
  $('ab-chat-new').disabled=busy||!$('ab-chat-case').value||!owner;
  $('ab-chat-delete').disabled=busy||!session;
}
function bubble(who,message){
  const item=document.createElement('article');item.className='ab-bubble '+who;
  const label=document.createElement('b');label.textContent=who==='human'?'Técnico':'Asistente IA';
  const body=document.createElement('p');body.textContent=message;item.append(label,body);$('ab-chat-feed').append(item);return item;
}
function reset(){epoch++;owner=null;session=null;pending=null;cases=[];$('ab-chat-feed').replaceChildren();$('ab-chat-text').value='';$('ab-chat-agree').checked=false;
  $('ab-chat-use-form').checked=false;$('ab-chat-case').replaceChildren();$('ab-chat-session').replaceChildren();$('ab-chat-history-state').textContent='Historial no cargado';controls();}
function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}
function alignModel(model){const select=$('ab-model');if(select&&select.value!==model){select.value=model;select.dispatchEvent(new Event('change'));}}
async function checked(result){const {data,error}=await result;if(error)throw Error('Servicio de historial no disponible en este entorno.');return data;}
async function loadCases(){
  if(busy)return;reset();const version=epoch;busy=true;controls();status();
  try{
    const sb=client();if(!sb)throw Error('Inicia sesión en el taller.');
    const auth=await sb.auth.getUser();if(auth.error||!auth.data?.user||auth.data.user.is_anonymous)throw Error('Inicia sesión con una cuenta del taller.');
    const user=auth.data.user.id,found=await checked(sb.rpc('ai_board_cases'));
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
    const list=await checked(client().from('ai_board_sessions').select('id,modelo,created_at').eq('diagnostico_id',id).eq('owner_id',owner).order('created_at',{ascending:false}).limit(30));
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
    const turns=await checked(client().from('ai_board_turns').select('user_message,assistant_message,status,created_at').eq('session_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(40));
    if(version!==epoch)return;session=s;alignModel(s.modelo);
    for(const t of turns.reverse()){
      bubble('human',t.user_message);
      bubble('ai',t.status==='completed'?t.assistant_message:t.status==='failed'?'Consulta fallida. Puedes enviarla de nuevo.':'Respuesta pendiente. Recarga el historial en unos segundos.');
    }
    $('ab-chat-history-state').textContent='Historial guardado · últimos 40 turnos · '+s.modelo;
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
    busy=false;await loadCases();if(!owner)return;
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
    const payload=JSON.stringify({message,context,session_id:session.id});
    if(pending?.payload!==payload)pending={payload,id:crypto.randomUUID()};
    thinking=bubble('ai','Analizando…');
    const {data,error}=await client().functions.invoke('ai-board-chat',{body:{session_id:session.id,request_id:pending.id,message,context,consent:true}});
    if(error){let details;try{details=await error.context?.clone().json();}catch{}if(error.context?.status&&error.context.status<500)pending=null;throw Error(details?.error||'No se confirmó el envío. Recarga el historial antes de reintentar.');}
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
  '<p id="ab-chat-history-state" role="status">Historial no cargado</p><div id="ab-chat-feed" role="log" aria-label="Conversación con IA" aria-live="polite"></div>'+
  '<div class="ab-chat-composer"><label for="ab-chat-text">Consulta técnica</label><textarea id="ab-chat-text" rows="2" maxlength="1400" placeholder="Indica mediciones, condiciones y la próxima pregunta…"></textarea>'+
  '<div class="ab-chat-checks"><label><input id="ab-chat-use-form" type="checkbox"> Incluir síntomas y mediciones del formulario</label><label><input id="ab-chat-agree" type="checkbox"> Autorizo enviar estos datos técnicos a la IA y guardarlos en este caso</label></div>'+
  '<button type="button" id="ab-chat-send" disabled>Enviar</button></div><p id="ab-chat-error" role="alert" hidden></p><p class="ab-chat-foot">Respuestas IA pendientes de validación técnica. Historial disponible cuando el backend de prueba esté instalado.</p>';
  legacy.prepend(box);legacy.querySelector('.ab-inline-note')?.remove();
  $('ab-chat-text').addEventListener('input',controls);
  $('ab-chat-text').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}});
  $('ab-chat-agree').addEventListener('change',controls);$('ab-chat-send').addEventListener('click',send);
  $('ab-chat-new').addEventListener('click',newChat);$('ab-chat-reload').addEventListener('click',loadCases);
  $('ab-chat-create-case').addEventListener('click',createCase);
  $('ab-chat-delete').addEventListener('click',deleteChat);
  $('ab-chat-case').addEventListener('change',loadSessions);$('ab-chat-session').addEventListener('change',history);
  client()?.auth.onAuthStateChange((event,userSession)=>{
    if(event==='SIGNED_OUT'||(owner&&userSession?.user?.id!==owner)){reset();window.dispatchEvent(new Event('bayol-ai-board-identity-reset'));status('Sesión cambiada. Recarga los casos.');}
  });
  controls();
  // The old button used an endpoint without server authorization. Route this view
  // to the protected chat while keeping panic-log and manual tools in place.
  const oldButton=$('dg_btn');if(oldButton){oldButton.removeAttribute('onclick');oldButton.textContent='Usar chat técnico seguro';oldButton.addEventListener('click',()=>{box.scrollIntoView({block:'start',behavior:'smooth'});if(!owner&&!busy)loadCases();});}
  document.querySelector('[data-ab-tab="ia"]')?.addEventListener('click',()=>{if(!owner&&!busy)loadCases();});
  $('ab-open-ia')?.addEventListener('click',()=>{if(!owner&&!busy)loadCases();});
  if(!$('ab-pane-ia').hidden)loadCases();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
