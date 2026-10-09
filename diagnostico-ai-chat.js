/* AI BOARD chat IA: prototipo temporal. No chat humano ni guardado. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let turns=[],busy=false,chosen='';
const model=()=>($('ab-model')?.value||$('dg_modelo')?.value||'').trim();
const clean=s=>String(s||'').replace(/\b\d{15}\b/g,'[IMEI]').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[EMAIL]');
function status(msg=''){const e=$('ab-chat-error');e.textContent=msg;e.hidden=!msg;}
function controls(){const t=$('ab-chat-text');t.disabled=busy;$('ab-chat-send').disabled=busy||!t.value.trim()||!$('ab-chat-agree').checked;$('ab-chat-new').disabled=busy;}
function bubble(who,s){const item=document.createElement('article');item.className='ab-bubble '+who;const label=document.createElement('b');label.textContent=who==='human'?'Técnico':'Asistente IA';const body=document.createElement('p');body.textContent=s;item.append(label,body);$('ab-chat-feed').append(item);$('ab-chat-feed').scrollTop=$('ab-chat-feed').scrollHeight;return item;}
function newChat(){if(busy)return;if(turns.length&&!confirm('¿Borrar el chat temporal?'))return;turns=[];chosen=model();$('ab-chat-feed').replaceChildren();$('ab-chat-text').value='';status();controls();}
async function send(){
 const input=$('ab-chat-text'),msg=input.value.trim();if(busy||!msg||!$('ab-chat-agree').checked)return;
 if(msg.length>1400)return status('Máximo 1,400 caracteres.');
 if(turns.length&&chosen!==model())return status('Cambió el modelo. Abre un chat nuevo.');
 if(typeof supabaseClient==='undefined'||!supabaseClient?.functions?.invoke)return status('La IA no está disponible.');
 busy=true;controls();status();
 let userNode,thinking;
 try{
  const permission=await supabaseClient.rpc('app_puede_diagnostico');
  if(permission.error||permission.data!==true)throw Error('No tienes permiso de diagnóstico.');
  const prior=turns.slice(-6).map(t=>(t.who==='human'?'Técnico: ':'Respuesta previa no confirmada: ')+clean(t.msg).slice(0,500)).join('\n');
  const context=('Pregunta actual: '+clean(msg)+'\nHistorial contextual no verificado:\n'+prior).slice(0,4000);
  const symptoms=$('ab-chat-use-form').checked?[...document.querySelectorAll('#dg_sintomas .diag-sint.on')].map(n=>n.textContent.trim()).slice(0,12):[];
  const battery=$('ab-chat-use-form').checked?clean($('dg_bateria')?.value).slice(0,130):'';
  const consumo=$('ab-chat-use-form').checked?clean($('dg_consumo')?.value).slice(0,130):'';
  chosen=model();userNode=bubble('human',msg);thinking=bubble('ai','Analizando…');
  const {data,error}=await supabaseClient.functions.invoke('bde-diagnostico',{body:{modelo:chosen,ios_version:'',bateria:battery,consumo,sintomas:symptoms,panic_log:'',historial:context}});
  if(error)throw error;if(!data?.ok||!data.diagnostico)throw Error(data?.error||'No se recibió respuesta.');
  thinking.remove();thinking=null;
  const answer=String(data.diagnostico).slice(0,12000);
  turns.push({who:'human',msg},{who:'ai',msg:answer});
  bubble('ai',answer);input.value='';
 }catch(e){userNode?.remove();thinking?.remove();status('No se completó: '+(e.message||'Error de conexión'));}
 finally{busy=false;controls();}
}
function mount(){
 const legacy=$('ab-legacy');if(!legacy||$('ab-ai-chat'))return;
 const box=document.createElement('section');box.id='ab-ai-chat';
 box.innerHTML='<header><h3><i class="ti ti-brain"></i> Chat con IA</h3><button id="ab-chat-new" type="button">Nuevo chat</button></header>'+
 '<p class="ab-chat-tip">Prototipo con el motor actual. Historial temporal; se pierde al actualizar. No envíes claves, IMEI ni datos de clientes.</p>'+
 '<div id="ab-chat-feed" role="log" aria-label="Conversación con IA"></div>'+
 '<div class="ab-chat-composer"><label for="ab-chat-text">Consulta técnica</label><textarea id="ab-chat-text" rows="2" maxlength="1400" placeholder="¿Qué mido después si consume 0.08 A?"></textarea>'+
 '<div class="ab-chat-checks"><label><input id="ab-chat-use-form" type="checkbox" checked> Incluir síntomas y mediciones</label><label><input id="ab-chat-agree" type="checkbox"> Autorizo enviar datos técnicos a la IA</label></div>'+
 '<button type="button" id="ab-chat-send" disabled>Enviar <i class="ti ti-send"></i></button></div>'+
 '<p id="ab-chat-error" role="alert" hidden></p><p class="ab-chat-foot">Verifica los valores y conexiones con fuentes técnicas confiables antes de reparar.</p>';
 legacy.prepend(box);legacy.querySelector('.ab-inline-note')?.remove();
 $('ab-chat-text').addEventListener('input',()=>{status();controls();});
 $('ab-chat-text').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}});
 $('ab-chat-agree').addEventListener('change',controls);$('ab-chat-send').addEventListener('click',send);$('ab-chat-new').addEventListener('click',newChat);
 $('ab-model')?.addEventListener('change',()=>{if(turns.length)status('Modelo cambiado. Inicia un chat nuevo.');else chosen=model();});
 newChat();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();