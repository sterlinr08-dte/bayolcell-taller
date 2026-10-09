/* BAYOL CELL AI BOARD - visor experimental de datos de placa en Diagnostico.
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
const state={tab:["bitmap","ia","biblioteca"].includes(storage.tab)?storage.tab:"bitmap",model:MODELOS.includes(storage.model)?storage.model:"iPhone 13 Pro Max",scale:1,x:0,y:0,url:null,board:null,selected:null,side:"top",photoSize:null,pointers:new Map(),lastDistance:0,lastX:0,lastY:0};

let assetEpoch=0;
function clearAsset(){assetEpoch++;const q=R('ab-point-query');if(q)q.disabled=true;window.dispatchEvent(new Event('bayol-ai-board-point-reset'));if(state.url)URL.revokeObjectURL(state.url);state.tiles?.destroy();state.tiles=null;state.url=null;state.photoSize=null;state.board=null;state.selected=null;R('ab-selection')?.replaceChildren();const side=R('ab-side');if(side)side.disabled=true;}
function mountBoardTools(){
 R('ab-minus').textContent='−';R('ab-plus').textContent='+';R('ab-reset').textContent='Centrar';
 document.querySelector('#ab-shell .ab-under>span').textContent='Zoom vectorial de boardview · Fotografía local según resolución original';
 const tools=document.createElement('div');tools.className='ab-board-tools';
 tools.innerHTML='<label class="ab-upload">Importar boardview JSON<input id="ab-board-file" type="file" accept="application/json,.json" hidden></label><label>Buscar componente o red<input id="ab-board-search" type="search" maxlength="120" placeholder="Designador o nombre de red"></label><label><input id="ab-board-labels" type="checkbox" checked> Designadores</label><label><input id="ab-board-pins" type="checkbox"> Pines</label>';
 R('ab-stage-view').before(tools);
 const queryPoint=document.createElement('button');queryPoint.id='ab-point-query';queryPoint.type='button';queryPoint.className='ab-upload';queryPoint.textContent='Consultar componente con IA';queryPoint.disabled=true;tools.append(queryPoint);
 queryPoint.addEventListener('click',()=>{const c=state.board?.components.find(c=>c.ref===state.selected);if(!c)return;const b=state.board;window.dispatchEvent(new CustomEvent('bayol-ai-board-point-query',{detail:{model:b.model,revision:b.revision,ref:c.ref,source:b.source,pins:c.pins.slice(0,8).map(p=>({id:p.id,net:p.net}))}}));show('ia');});
 const hd=document.createElement('label');hd.className='ab-upload';hd.textContent='Abrir carpeta de foto HD';const folder=document.createElement('input');folder.id='ab-photo-folder';folder.type='file';folder.hidden=true;folder.multiple=true;folder.setAttribute('webkitdirectory','');hd.append(folder);tools.prepend(hd);
 folder.addEventListener('change',async e=>{
   const files=[...e.target.files];e.target.value='';if(!files.length)return;const token=++assetEpoch,model=state.model;
   try{const tiles=await window.BayolPhotoTiles.open(files,model);if(token!==assetEpoch||model!==state.model){tiles.destroy();return;}clearAsset();state.tiles=tiles;resetView();refresh();}
   catch(err){alert(err.message||'No se pudo abrir la carpeta HD.');}
 });
 const detail=document.createElement('div');detail.id='ab-selection';detail.setAttribute('role','status');R('ab-details').after(detail);
 R('ab-board-file').addEventListener('change',async e=>{
   const f=e.target.files?.[0];e.target.value='';if(!f)return;
   if(f.size>3*1024*1024){alert('Máximo 3 MB de datos de boardview.');return;}
   const token=++assetEpoch,model=state.model;
   try{const board=window.BayolBoardData.validate(JSON.parse(await f.text()),model);if(token!==assetEpoch||model!==state.model)return;clearAsset();state.board=board;state.side=board.components[0].side;resetView();refresh();}
   catch(err){alert(err.message||'No se pudo importar el boardview.');}
 });
 for(const id of ['ab-board-search','ab-board-labels','ab-board-pins'])R(id).addEventListener(id==='ab-board-search'?'input':'change',()=>{if(state.board)renderBoard();});
 const side=R('ab-side');side.replaceChildren();for(const [value,label] of [['top','Superior'],['bottom','Inferior']]){const o=document.createElement('option');o.value=value;o.textContent=label;side.append(o);}
 side.addEventListener('change',()=>{state.side=side.value;state.selected=null;resetView();renderBoard();});
 R('ab-target').addEventListener('click',e=>{const ref=e.target.closest('[data-ref]')?.dataset.ref;if(!ref||!state.board)return;state.selected=ref;renderBoard();});
 R('ab-shell').querySelectorAll('[data-ab-tab]').forEach((b,i,all)=>b.addEventListener('keydown',e=>{
   let index;if(e.key==='ArrowRight')index=(i+1)%all.length;else if(e.key==='ArrowLeft')index=(i+all.length-1)%all.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=all.length-1;else return;
   e.preventDefault();show(all[index].dataset.abTab);all[index].focus();
 }));
}
function renderBoard(){
 const board=state.board;if(!board)return;
 R('ab-coverage').textContent='Boardview aportado · pendiente de validación';
 R('ab-details').textContent=board.model+' · Revisión '+board.revision+' · Fuente: '+board.source.title+' · Licencia declarada: '+board.source.license+' · Referencia: '+board.source.reference;
 R('ab-side').disabled=false;R('ab-side').value=state.side;
 const svgNS='http://www.w3.org/2000/svg';const el=(name,attrs,text)=>{const n=document.createElementNS(svgNS,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;return n;};
 const svg=el('svg',{viewBox:'0 0 '+board.width+' '+board.height,role:'img','aria-label':'Boardview aportado para '+board.model});
 const query=R('ab-board-search').value.trim().toUpperCase();let count=0;
 for(const c of board.components.filter(c=>c.side===state.side)){
  const match=!!query&&(c.ref.toUpperCase().includes(query)||c.pins.some(p=>p.net.toUpperCase().includes(query)));
  if(match)count++;
  const g=el('g',{'data-ref':c.ref});g.append(el('rect',{x:c.x,y:c.y,width:c.width,height:c.height,fill:c.ref===state.selected?'#E31E24':match?'#ffe0a3':'#d2dbe7',stroke:'#566479','stroke-width':Math.max(board.width/1200,.2)}));
  if(R('ab-board-labels').checked)g.append(el('text',{x:c.x+c.width/2,y:c.y+c.height/2,'text-anchor':'middle','dominant-baseline':'middle','font-size':Math.min(c.width/c.ref.length*1.3,c.height*.4),fill:'#172334'},c.ref));
  if(R('ab-board-pins').checked)for(const p of c.pins)g.append(el('circle',{cx:c.x+p.x,cy:c.y+p.y,r:Math.max(board.width/1200,.3),fill:'#111'}));
  svg.append(g);
 }
 R('ab-target').replaceChildren(svg);const selected=board.components.find(c=>c.ref===state.selected);
 R('ab-point-query').disabled=!selected;
 R('ab-selection').textContent=selected?selected.ref+' · Pines aportados: '+selected.pins.map(p=>p.id+': '+(p.net||'sin red indicada')).join(', '):(query?count+' componentes coinciden en este lado.':'Selecciona un componente para consultar los datos aportados.');
 document.querySelector('#ab-shell .ab-watermark').textContent='MAPA APORTADO · REVISIÓN TÉCNICA PENDIENTE';repaint();
}
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
 +'<div class="ab-tabs" role="tablist" aria-label="Secciones de Diagnóstico"><button type="button" data-ab-tab="bitmap" role="tab"><i class="ti ti-layers-intersect"></i> BITMAP</button><button type="button" data-ab-tab="ia" role="tab"><i class="ti ti-brain"></i> Diagnóstico IA</button><button type="button" data-ab-tab="biblioteca" role="tab"><i class="ti ti-book"></i> Biblioteca</button></div>'
 +'<section id="ab-pane-bitmap" class="ab-pane" role="tabpanel"><div class="ab-workspace"><div class="ab-visual"><div class="ab-controls"><label>Modelo <select id="ab-model" aria-label="Seleccionar modelo de iPhone"></select></label><span class="ab-chip ab-chip-warn" id="ab-coverage">Sin boardview verificado</span><label>Vista <select id="ab-side" disabled title="Disponible cuando existan mapas certificados"><option>Superior</option></select></label><div class="ab-zoom-buttons"><button type="button" id="ab-minus" aria-label="Alejar"><i class="ti ti-minus"></i></button><span id="ab-zoom-status">100%</span><button type="button" id="ab-plus" aria-label="Acercar"><i class="ti ti-plus"></i></button><button type="button" id="ab-reset" aria-label="Centrar"><i class="ti ti-focus-centered"></i></button></div></div><div id="ab-stage-view" class="ab-stage-view" tabindex="0" aria-label="Visor de placa: rueda del ratón o gesto de pinza para acercar"><div id="ab-target" class="ab-target"></div><span class="ab-watermark">MUESTRA VISUAL · NO USAR COMO DIAGRAMA TÉCNICO</span></div><div class="ab-under"><span>Geometría aportada y fotos locales · Procedencia visible, pendiente de comprobación</span><label class="ab-upload"><i class="ti ti-photo-up"></i> Abrir foto local<input id="ab-file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden></label></div></div>'
 +'<aside class="ab-side"><div class="ab-card"><h3><i class="ti ti-shield-check"></i> Estado de cobertura</h3><p id="ab-details">Este modelo está en el catálogo. Aún no hay datos de pines, líneas o componentes validados.</p><div class="ab-alert"><i class="ti ti-alert-circle"></i> El zoom vectorial no inventa detalle de una fotografía; depende de los píxeles originales.</div></div><div class="ab-card"><h3><i class="ti ti-stethoscope"></i> Diagnóstico conectado</h3><p>El motor de IA, los panic logs y el historial del taller están disponibles en la pestaña Diagnóstico IA.</p><button id="ab-open-ia" type="button" class="ab-primary">Abrir Diagnóstico IA <i class="ti ti-arrow-right"></i></button></div></aside></div></section>'
 +'<section id="ab-pane-ia" class="ab-pane" role="tabpanel"><div class="ab-legacy" id="ab-legacy"><div class="ab-inline-note"><i class="ti ti-check"></i> Conservamos el diagnóstico y las herramientas existentes. El futuro chat conversacional con IA conservará contexto y mediciones de cada caso.</div></div></section>'

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
 sel.addEventListener("change",()=>{state.model=sel.value;clearAsset();const legacyModel=R("dg_modelo");if(legacyModel)legacyModel.value=state.model;resetView();refresh();save();});
 R("ab-file").addEventListener("change",loadPhoto);
 R("ab-plus").addEventListener("click",()=>zoom(1.35));
 R("ab-minus").addEventListener("click",()=>zoom(1/1.35));
 R("ab-reset").addEventListener("click",resetView);
 R("ab-open-ia").addEventListener("click",()=>show("ia"));
 shell.querySelectorAll("[data-ab-tab]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.abTab)));
 const stage=R("ab-stage-view");
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>repaint()).observe(stage);
 stage.addEventListener("wheel",e=>{e.preventDefault();const r=stage.getBoundingClientRect();zoom(e.deltaY>0?0.88:1.14,e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);},{passive:false});
 stage.addEventListener("pointerdown",startPointer);
 stage.addEventListener("pointermove",movePointer);
 ["pointerup","pointercancel","lostpointercapture"].forEach(n=>stage.addEventListener(n,endPointer));
 stage.addEventListener("keydown",e=>{if(e.key==="+"||e.key==="="){e.preventDefault();zoom(1.2);}if(e.key==="-"){e.preventDefault();zoom(1/1.2);}});
 const lm=R("dg_modelo");if(lm&&!lm.value.trim())lm.value=state.model;
 mountBoardTools();refresh();show(state.tab);
 window.addEventListener('bayol-ai-board-identity-reset',()=>{clearAsset();resetView();refresh();});
}
function show(tab){
 if(!["bitmap","ia","biblioteca"].includes(tab))return;
 state.tab=tab;save();
 document.querySelectorAll("#ab-shell [data-ab-tab]").forEach(b=>{const active=b.dataset.abTab===tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;b.id="ab-tab-"+b.dataset.abTab;b.setAttribute("aria-controls","ab-pane-"+b.dataset.abTab);});
 document.querySelectorAll("#ab-shell .ab-pane").forEach(p=>{p.hidden=p.id!=="ab-pane-"+tab;p.setAttribute("aria-labelledby",p.id.replace("pane","tab"));});
 if(tab==='bitmap')repaint();
 if(tab==="biblioteca"&&typeof window.cargarConocimiento==="function")window.cargarConocimiento();
}
function refresh(){
 if(state.board){renderBoard();return;}
 if(state.tiles){const m=state.tiles.manifest;R('ab-target').replaceChildren(state.tiles.root);R('ab-coverage').textContent='Foto HD por niveles · pendiente de validación';R('ab-details').textContent=m.model+' · '+m.revision+' · '+m.width+' × '+m.height+' píxeles · Fuente: '+m.source.title+' · '+m.source.reference;document.querySelector('#ab-shell .ab-watermark').textContent='FOTO ORIGINAL POR NIVELES · SIN MAPA ELÉCTRICO';repaint();return;}
 document.querySelector('#ab-shell .ab-watermark').textContent=state.url?'FOTOGRAFÍA LOCAL · SIN VALIDACIÓN ELÉCTRICA':'SIN MAPA TÉCNICO VERIFICADO';
 R("ab-coverage").textContent=state.url?"Foto local · sin validación":"Sin boardview verificado";
 R("ab-details").textContent=state.url?"Fotografía cargada localmente para inspección visual. No incluye conexiones, pines ni referencias eléctricas.":"El "+state.model+" figura en el catálogo, pero aún no existe una placa electrónica verificada disponible en este módulo.";
 const target=R("ab-target");
 if(state.url){target.innerHTML="";const img=document.createElement("img");img.src=state.url;img.alt="Fotografía local aportada por el técnico, no verificada";img.draggable=false;target.appendChild(img);}
 else {target.replaceChildren();const empty=document.createElement("p");empty.className="ab-no-map";empty.textContent="Sin boardview verificado para "+state.model+". Abre una fotografía local o importa un mapa con su fuente y revisión.";target.appendChild(empty);}
 repaint();
}
function repaint(){
 const tar=R("ab-target");if(tar)tar.style.transform="translate("+state.x+"px,"+state.y+"px) scale("+state.scale+")";
 const status=R("ab-zoom-status");if(status)status.textContent=Math.round(state.scale*100)+"%";
 if(state.tiles){const stage=R('ab-stage-view');state.tiles.render(stage.clientWidth,stage.clientHeight,state.scale,state.x,state.y);}
}
function zoom(factor,ax=0,ay=0){const old=state.scale;state.scale=Math.min(24,Math.max(.5,old*factor));state.x=ax-(ax-state.x)*state.scale/old;state.y=ay-(ay-state.y)*state.scale/old;repaint();}
function resetView(){state.scale=1;state.x=0;state.y=0;state.pointers.clear();repaint();}
async function loadPhoto(event){
 const f=event.target.files&&event.target.files[0];if(!f)return;
 event.target.value="";
 if(!["image/png","image/jpeg","image/webp","image/avif"].includes(f.type)||f.size>35*1024*1024){alert("Selecciona PNG, JPEG, WebP o AVIF de hasta 35 MB.");return;}
 const selectedModel=state.model,token=++assetEpoch,url=URL.createObjectURL(f),img=new Image();
 try{img.src=url;await img.decode();if(img.naturalWidth*img.naturalHeight>80000000)throw Error("La fotografía supera 80 megapíxeles.");
   if(token!==assetEpoch||selectedModel!==state.model){URL.revokeObjectURL(url);return;}
   clearAsset();state.url=url;state.photoSize={width:img.naturalWidth,height:img.naturalHeight};resetView();refresh();
   R("ab-details").textContent="Fotografía local: "+img.naturalWidth+" × "+img.naturalHeight+" píxeles. Modelo asociado: "+state.model+". Sin datos eléctricos validados.";
 }catch(e){URL.revokeObjectURL(url);alert(e.message||"No se pudo abrir la imagen.");}
}
function startPointer(e){
 if(e.pointerType==="mouse"&&e.button!==0)return;
 const stage=R("ab-stage-view");stage.setPointerCapture(e.pointerId);
 state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 state.hitRef=e.target.closest('[data-ref]')?.dataset.ref;state.dragDistance=0;
 state.lastX=e.clientX;state.lastY=e.clientY;
 if(state.pointers.size===2){const p=Array.from(state.pointers.values());state.lastDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}
}
function movePointer(e){
 if(!state.pointers.has(e.pointerId))return;
 const prior=state.pointers.get(e.pointerId);
 state.dragDistance+=Math.hypot(e.clientX-prior.x,e.clientY-prior.y);
 state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(state.pointers.size===1){state.x+=e.clientX-prior.x;state.y+=e.clientY-prior.y;}
 else if(state.pointers.size===2){const p=Array.from(state.pointers.values());const dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);const r=R("ab-stage-view").getBoundingClientRect();const mx=(p[0].x+p[1].x)/2-r.left-r.width/2,my=(p[0].y+p[1].y)/2-r.top-r.height/2;state.x+=(e.clientX-prior.x)/2;state.y+=(e.clientY-prior.y)/2;if(state.lastDistance>0)zoom(dist/state.lastDistance,mx,my);state.lastDistance=dist;}
 repaint();
}
function endPointer(e){const select=e.type==='pointerup'&&state.pointers.size===1&&state.hitRef&&state.dragDistance<4;state.pointers.delete(e.pointerId);state.lastDistance=0;if(select&&state.board){state.selected=state.hitRef;renderBoard();}state.hitRef=null;if(state.pointers.size===2){const p=Array.from(state.pointers.values());state.lastDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}}
window.addEventListener("pagehide",()=>{state.pointers.clear();});
window.addEventListener('resize',()=>{if(R('ab-shell'))repaint();});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
