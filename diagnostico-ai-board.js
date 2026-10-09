/* BAYOL CELL AI BOARD - prototipo de interfaz en Diagnostico.
 * No reemplaza el motor existente ni presenta diagramas electronicos inventados.
 * Sin escrituras a Supabase, sin envios de datos de imagen, sin claves en navegador.
 */
(function(){
"use strict";
const MODELOS=["iPhone X","iPhone XR","iPhone XS","iPhone XS Max","iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max","iPhone 12","iPhone 12 mini","iPhone 12 Pro","iPhone 12 Pro Max","iPhone 13","iPhone 13 mini","iPhone 13 Pro","iPhone 13 Pro Max","iPhone 14","iPhone 14 Plus","iPhone 14 Pro","iPhone 14 Pro Max","iPhone 15","iPhone 15 Plus","iPhone 15 Pro","iPhone 15 Pro Max","iPhone 16","iPhone 16 Plus","iPhone 16 Pro","iPhone 16 Pro Max","iPhone 16e","iPhone 17","iPhone 17 Pro","iPhone 17 Pro Max","iPhone Air"];
const STORAGE_KEY="bayol_ai_board_ui_v1";
const R=(id)=>document.getElementById(id);
let storage={};
try { storage=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}; }catch(_){}
const state={tab:["bitmap","ia","chats","biblioteca"].includes(storage.tab)?storage.tab:"bitmap",model:MODELOS.includes(storage.model)?storage.model:"iPhone 13 Pro Max",scale:1,x:0,y:0,url:null,pointers:new Map(),lastDistance:0,lastX:0,lastY:0};
const svgDemo='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 430" role="img" aria-label="Ilustración geométrica genérica, no es un boardview real"><defs><linearGradient id="ab-g" x2="1" y2="1"><stop stop-color="#252d3a"/><stop offset="1" stop-color="#10151e"/></linearGradient><pattern id="ab-p" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 12H24M12 0V24" stroke="#58677b" stroke-opacity=".16" stroke-width="1"/></pattern></defs><rect x="78" y="61" width="660" height="307" rx="24" fill="url(#ab-g)" stroke="#9ca8b9" stroke-width="5"/><rect x="95" y="78" width="626" height="273" fill="url(#ab-p)"/><g stroke="#c19d62" fill="none" stroke-width="3"><path d="M125 115H310V165H432M160 290H380V258H540M440 105V180H650M230 345V312H610"/><circle cx="125" cy="115" r="8"/><circle cx="610" cy="312" r="8"/><circle cx="650" cy="180" r="8"/></g><g fill="#293747" stroke="#7c899e" stroke-width="4"><rect x="296" y="135" width="178" height="142" rx="9"/><rect x="522" y="116" width="113" height="93" rx="7"/><rect x="168" y="191" width="89" height="119" rx="7"/><rect x="506" y="250" width="132" height="67" rx="7"/></g><g fill="#8b9cb2"><circle cx="111" cy="92" r="13"/><circle cx="707" cy="94" r="13"/><circle cx="705" cy="336" r="13"/><circle cx="112" cy="336" r="13"/></g><text x="385" y="197" fill="#c9d3e4" font-size="19" text-anchor="middle" font-family="Arial,sans-serif">PCB DE MUESTRA</text><text x="385" y="222" fill="#8b9cb2" font-size="12" text-anchor="middle" font-family="Arial,sans-serif">Sin datos eléctricos</text></svg>';
function save(){
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify({tab:state.tab,model:state.model}));}catch(_){}
}
function mount(){
 const view=R("v-diagnostico");
 if(!view||R("ab-shell")) return;
 const legacy=Array.from(view.children);
 const shell=document.createElement("section");
 shell.id="ab-shell";
 shell.innerHTML='<div class="ab-header"><div class="ab-title"><span class="ab-mark" aria-hidden="true"><i class="ti ti-cpu"></i></span><div><h2>Diagnóstico</h2><p>BITMAP, inteligencia artificial y conocimiento técnico, en un solo lugar.</p></div></div><span class="ab-stage">AI BOARD · Versión de prueba</span></div>'
 +'<div class="ab-tabs" role="tablist" aria-label="Secciones de Diagnóstico"><button type="button" data-ab-tab="bitmap" role="tab"><i class="ti ti-layers-intersect"></i> BITMAP</button><button type="button" data-ab-tab="ia" role="tab"><i class="ti ti-brain"></i> Diagnóstico IA</button><button type="button" data-ab-tab="chats" role="tab"><i class="ti ti-messages"></i> Chats</button><button type="button" data-ab-tab="biblioteca" role="tab"><i class="ti ti-book"></i> Biblioteca</button></div>'
 +'<section id="ab-pane-bitmap" class="ab-pane" role="tabpanel"><div class="ab-workspace"><div class="ab-visual"><div class="ab-controls"><label>Modelo <select id="ab-model" aria-label="Seleccionar modelo de iPhone"></select></label><span class="ab-chip ab-chip-warn" id="ab-coverage">Sin boardview verificado</span><label>Vista <select id="ab-side" disabled title="Disponible cuando existan mapas certificados"><option>Superior</option></select></label><div class="ab-zoom-buttons"><button type="button" id="ab-minus" aria-label="Alejar"><i class="ti ti-minus"></i></button><span id="ab-zoom-status">100%</span><button type="button" id="ab-plus" aria-label="Acercar"><i class="ti ti-plus"></i></button><button type="button" id="ab-reset" aria-label="Centrar"><i class="ti ti-focus-centered"></i></button></div></div><div id="ab-stage-view" class="ab-stage-view" tabindex="0" aria-label="Visor de placa: rueda del ratón o gesto de pinza para acercar"><div id="ab-target" class="ab-target"></div><span class="ab-watermark">MUESTRA VISUAL · NO USAR COMO DIAGRAMA TÉCNICO</span></div><div class="ab-under"><span>Zoom vectorial de demostración · Fotografía local solo en este dispositivo</span><label class="ab-upload"><i class="ti ti-photo-up"></i> Abrir foto local<input id="ab-file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden></label></div></div>'
 +'<aside class="ab-side"><div class="ab-card"><h3><i class="ti ti-shield-check"></i> Estado de cobertura</h3><p id="ab-details">Este modelo está en el catálogo. Aún no hay datos de pines, líneas o componentes validados.</p><div class="ab-alert"><i class="ti ti-alert-circle"></i> El zoom vectorial no inventa detalle de una fotografía; depende de los píxeles originales.</div></div><div class="ab-card"><h3><i class="ti ti-stethoscope"></i> Diagnóstico conectado</h3><p>El motor de IA, los panic logs y el historial del taller están disponibles en la pestaña Diagnóstico IA.</p><button id="ab-open-ia" type="button" class="ab-primary">Abrir Diagnóstico IA <i class="ti ti-arrow-right"></i></button></div><div class="ab-card"><h3><i class="ti ti-message-circle"></i> Equipo técnico</h3><p>Chat humano en preparación. No se enviarán mensajes hasta implementar permisos y almacenamiento seguro.</p><button id="ab-open-chats" type="button" class="ab-secondary">Ver estado del chat</button></div></aside></div></section>'
 +'<section id="ab-pane-ia" class="ab-pane" role="tabpanel"><div class="ab-legacy" id="ab-legacy"><div class="ab-inline-note"><i class="ti ti-check"></i> Conservamos el diagnóstico y las herramientas existentes. El chat continuo con IA se añadirá sin perder su historial.</div></div></section>'
 +'<section id="ab-pane-chats" class="ab-pane" role="tabpanel"><div class="ab-empty"><i class="ti ti-messages"></i><h3>Chat entre técnicos</h3><p>Preparado para conversaciones privadas y grupos vinculados a órdenes. Aún no está conectado: necesitamos tablas, permisos y mensajería en tiempo real antes de habilitar el envío.</p><span class="ab-chip ab-chip-warn">Pendiente de integración segura</span></div></section>'
 +'<section id="ab-pane-biblioteca" class="ab-pane" role="tabpanel"><div id="ab-library" class="ab-library"><div class="ab-inline-note"><i class="ti ti-book"></i> Casos existentes del taller. Las soluciones todavía no cuentan con aprobación técnica independiente.</div></div></section>';
 view.appendChild(shell);
 const oldHeading=legacy.filter(el=>/^(H2|P)$/.test(el.tagName));
 const library=R("ab-library"), legacyPane=R("ab-legacy");
 for(const item of legacy){
   if(oldHeading.includes(item)){ item.remove();continue; }
   if(item.querySelector && item.querySelector("#conocimientoTable"))library.appendChild(item);
   else legacyPane.appendChild(item);
 }
 const sel=R("ab-model");
 sel.innerHTML=MODELOS.map(m=>'<option value="'+m+'">'+m+'</option>').join("");
 sel.value=state.model;
 sel.addEventListener("change",()=>{state.model=sel.value;const legacyModel=R("dg_modelo");if(legacyModel&&!legacyModel.value.trim())legacyModel.value=state.model;resetView();refresh();save();});
 R("ab-file").addEventListener("change",loadPhoto);
 R("ab-plus").addEventListener("click",()=>zoom(1.35));
 R("ab-minus").addEventListener("click",()=>zoom(1/1.35));
 R("ab-reset").addEventListener("click",resetView);
 R("ab-open-ia").addEventListener("click",()=>show("ia"));
 R("ab-open-chats").addEventListener("click",()=>show("chats"));
 shell.querySelectorAll("[data-ab-tab]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.abTab)));
 const stage=R("ab-stage-view");
 stage.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY>0?0.88:1.14);},{passive:false});
 stage.addEventListener("pointerdown",startPointer);
 stage.addEventListener("pointermove",movePointer);
 ["pointerup","pointercancel","lostpointercapture"].forEach(n=>stage.addEventListener(n,endPointer));
 stage.addEventListener("keydown",e=>{if(e.key==="+"||e.key==="="){e.preventDefault();zoom(1.2);}if(e.key==="-"){e.preventDefault();zoom(1/1.2);}});
 const lm=R("dg_modelo");if(lm&&!lm.value.trim())lm.value=state.model;
 refresh();show(state.tab);
}
function show(tab){
 if(!["bitmap","ia","chats","biblioteca"].includes(tab))return;
 state.tab=tab;save();
 document.querySelectorAll("#ab-shell [data-ab-tab]").forEach(b=>{const active=b.dataset.abTab===tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
 document.querySelectorAll("#ab-shell .ab-pane").forEach(p=>{p.hidden=p.id!=="ab-pane-"+tab;});
 if(tab==="biblioteca"&&typeof window.cargarConocimiento==="function")window.cargarConocimiento();
}
function refresh(){
 R("ab-coverage").textContent=state.url?"Foto local · sin validación":"Sin boardview verificado";
 R("ab-details").textContent=state.url?"Fotografía cargada localmente para inspección visual. No incluye conexiones, pines ni referencias eléctricas.":"El "+state.model+" figura en el catálogo, pero aún no existe una placa electrónica verificada disponible en este módulo.";
 const target=R("ab-target");
 if(state.url){target.innerHTML="";const img=document.createElement("img");img.src=state.url;img.alt="Fotografía local aportada por el técnico, no verificada";img.draggable=false;target.appendChild(img);}
 else target.innerHTML=svgDemo;
 repaint();
}
function repaint(){
 const tar=R("ab-target");if(tar)tar.style.transform="translate("+state.x+"px,"+state.y+"px) scale("+state.scale+")";
 const status=R("ab-zoom-status");if(status)status.textContent=Math.round(state.scale*100)+"%";
}
function zoom(factor){state.scale=Math.min(12,Math.max(.5,state.scale*factor));repaint();}
function resetView(){state.scale=1;state.x=0;state.y=0;state.pointers.clear();repaint();}
function loadPhoto(event){
 const f=event.target.files&&event.target.files[0];
 if(!f)return;
 if(!f.type.startsWith("image/")||f.size>35*1024*1024){alert("Selecciona una imagen válida de hasta 35 MB.");event.target.value="";return;}
 if(state.url)URL.revokeObjectURL(state.url);
 state.url=URL.createObjectURL(f);resetView();refresh();event.target.value="";
}
function startPointer(e){
 if(e.pointerType==="mouse"&&e.button!==0)return;
 const stage=R("ab-stage-view");stage.setPointerCapture(e.pointerId);
 state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 state.lastX=e.clientX;state.lastY=e.clientY;
 if(state.pointers.size===2){const p=Array.from(state.pointers.values());state.lastDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}
}
function movePointer(e){
 if(!state.pointers.has(e.pointerId))return;
 const prior=state.pointers.get(e.pointerId);
 state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(state.pointers.size===1){state.x+=e.clientX-prior.x;state.y+=e.clientY-prior.y;}
 else if(state.pointers.size===2){const p=Array.from(state.pointers.values());const dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(state.lastDistance>0)state.scale=Math.min(12,Math.max(.5,state.scale*dist/state.lastDistance));state.lastDistance=dist;}
 repaint();
}
function endPointer(e){state.pointers.delete(e.pointerId);state.lastDistance=0;if(state.pointers.size===2){const p=Array.from(state.pointers.values());state.lastDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}}
window.addEventListener("pagehide",()=>{if(state.url)URL.revokeObjectURL(state.url);},{once:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();