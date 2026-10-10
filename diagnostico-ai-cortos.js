/* BAYOL CELL AI BOARD · Buscador de cortos (10 oct 2026).
 * Sobre la foto/captura del catálogo privado (placas_mapas) los técnicos marcan componentes (placas_puntos)
 * y a qué líneas (redes) pertenecen. Al buscar una línea en corto se iluminan sus componentes y sale una
 * lista para ir revisando; el culpable encontrado se guarda (placas_cortos) y se muestra como «el que más
 * falla en el taller». Nada se inventa: solo aparece lo que marcaron y encontraron los técnicos.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),sb=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
// Nombres de línea habituales en placas de iPhone, solo como sugerencia para escribir (no son valores).
const SUGERIDAS=['PP_VDD_MAIN','PP_BATT_VCC','PP_VDD_BOOST','PP5V0_USB','PP1V8','PP3V0'];
const st={mapa:null,puntos:[],redesModelo:[],red:'',ranking:[],revisado:{},marcar:false,sel:null,user:null,down:null,busy:false};
const norm=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,'_').slice(0,80);
const normRef=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,'').slice(0,60);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function msg(t){const p=$('ab-cortos-status');if(p)p.textContent=t;}
async function checked(p){const r=await p;if(r.error)throw Error('No se pudo completar con la base de datos.');return r.data;}
async function quien(){
 if(st.user)return st.user;const c=sb();if(!c)throw Error('Inicia sesión en el taller.');
 const r=await c.auth.getUser();if(r.error||!r.data?.user?.id)throw Error('Inicia sesión con una cuenta del taller.');
 if(await checked(c.rpc('app_puede_diagnostico'))!==true)throw Error('Sin permiso de diagnóstico.');
 return st.user=r.data.user.id;
}
function modelo(){return $('ab-model')?.value||'';}

/* ---------- Capa de puntos encima de la foto ---------- */
function img(){return $('ab-target')?.querySelector(':scope>img');}
function cajaFoto(){ // rectángulo que ocupa la foto dentro de #ab-target (object-fit: contain), sin la transformación
 const t=$('ab-target'),i=img();if(!t||!i||!i.naturalWidth)return null;
 const W=t.offsetWidth,H=t.offsetHeight,s=Math.min(W/i.naturalWidth,H/i.naturalHeight),w=i.naturalWidth*s,h=i.naturalHeight*s;
 return {left:(W-w)/2,top:(H-h)/2,width:w,height:h};
}
function escala(){const m=/scale\(([\d.]+)\)/.exec($('ab-target')?.style.transform||'');return m?Number(m[1])||1:1;}
function capa(){
 const t=$('ab-target');if(!t||!st.mapa||!img())return null;
 let c=$('ab-cortos-capa');if(!c){c=document.createElement('div');c.id='ab-cortos-capa';c.setAttribute('aria-hidden','true');t.append(c);}
 const b=cajaFoto();if(b)Object.assign(c.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px'});
 c.style.setProperty('--abc-s',String(1/escala()));return c;
}
function pintar(){
 const c=capa();if(!c){$('ab-cortos-capa')?.remove();return;}
 const red=st.red,frag=document.createDocumentFragment();
 for(const p of st.puntos){
  const d=document.createElement('span'),on=red&&p.redes.includes(red),r=st.revisado[p.nombre];
  d.className='abc-p'+(on?' on':'')+(red&&!on?' off':'')+(p.id===st.sel?' sel':'')+(r==='ok'?' ok':'')+(r==='culpable'?' mal':'');
  d.style.left=(p.x*100)+'%';d.style.top=(p.y*100)+'%';
  const l=document.createElement('b');l.textContent=p.nombre;d.append(l);frag.append(d);
 }
 c.replaceChildren(frag);c.classList.toggle('marcando',st.marcar);
}

/* ---------- Datos ---------- */
async function cargarPuntos(){
 if(!st.mapa)return;const id=st.mapa.id;
 const rows=await checked(sb().from('placas_puntos').select('id,x,y,nombre,redes,creado_por').eq('mapa_id',id).limit(2000));
 if(st.mapa?.id!==id)return;st.puntos=(rows||[]).map(r=>({...r,redes:Array.isArray(r.redes)?r.redes:[]}));
}
async function cargarRedesModelo(){
 const m=modelo();if(!m)return;
 const mapas=await checked(sb().from('placas_mapas').select('id').eq('modelo',m).limit(200));
 const ids=(mapas||[]).map(r=>r.id);let redes=[];
 if(ids.length){const pts=await checked(sb().from('placas_puntos').select('nombre,redes,mapa_id').in('mapa_id',ids).limit(5000));st.otros=(pts||[]);for(const p of pts||[])for(const r of p.redes||[])redes.push(r);}else st.otros=[];
 if(m!==modelo())return;st.redesModelo=[...new Set([...redes,...SUGERIDAS])].sort();
 const dl=$('ab-cortos-redes');if(dl){dl.replaceChildren(...st.redesModelo.map(r=>{const o=document.createElement('option');o.value=r;return o;}));}
}
async function cargarRanking(){
 const m=modelo(),red=st.red;st.ranking=[];if(!red)return;
 const rows=await checked(sb().from('placas_cortos').select('componente').eq('modelo',m).eq('red',red).limit(1000));
 if(m!==modelo()||red!==st.red)return;const n={};for(const r of rows||[])n[r.componente]=(n[r.componente]||0)+1;
 st.ranking=Object.entries(n).sort((a,b)=>b[1]-a[1]);
}

/* ---------- Panel ---------- */
function lista(){
 const ul=$('ab-cortos-lista'),top=$('ab-cortos-top');if(!ul)return;ul.replaceChildren();top.replaceChildren();
 const red=st.red;if(!red)return;
 if(st.ranking.length){const p=document.createElement('p');p.className='abc-top';p.innerHTML='<i class="ti ti-flame"></i> ';const s=document.createElement('span');s.textContent='En el taller, el culpable más frecuente en '+red+': '+st.ranking.slice(0,3).map(([c,k])=>c+' ('+k+(k===1?' vez':' veces')+')').join(' · ');p.append(s);top.append(p);}
 const enFoto=new Set(st.puntos.filter(p=>p.redes.includes(red)).map(p=>p.nombre));
 const enModelo=new Set((st.otros||[]).filter(p=>(p.redes||[]).includes(red)).map(p=>p.nombre));
 const todos=[...new Set([...enFoto,...enModelo])],peso=Object.fromEntries(st.ranking);
 todos.sort((a,b)=>(peso[b]||0)-(peso[a]||0)||((a[0]==='C')===(b[0]==='C')?a.localeCompare(b,undefined,{numeric:true}):(a[0]==='C'?-1:1)));
 if(!todos.length){const li=document.createElement('li');li.className='abc-vacio';li.textContent='Todavía nadie ha marcado componentes de '+red+' en este modelo. Ábrelo en REFOX, busca la línea y márcalos aquí con «Marcar componentes».';ul.append(li);return;}
 for(const ref of todos){
  const li=document.createElement('li'),r=st.revisado[ref];li.className=r?'abc-'+r:'';
  const n=document.createElement('span');n.className='abc-ref';n.textContent=ref+(enFoto.has(ref)?'':' · en otra foto');
  const ok=document.createElement('button');ok.type='button';ok.textContent='Bien';ok.title='Revisado, no está en corto';ok.addEventListener('click',()=>{st.revisado[ref]=r==='ok'?undefined:'ok';lista();pintar();});
  const mal=document.createElement('button');mal.type='button';mal.className='abc-culpable';mal.textContent='Culpable';mal.title='Este era el que estaba en corto';mal.addEventListener('click',()=>culpable(ref));
  li.append(n,ok,mal);ul.append(li);
 }
 msg(todos.length+' componente(s) en '+red+'. Revísalos uno por uno; marca «Bien» o «Culpable».');
}
async function buscar(){
 const red=norm($('ab-cortos-red').value);if(!red)return msg('Escribe la línea en corto, por ejemplo PP_VDD_MAIN.');
 $('ab-cortos-red').value=red;if(red!==st.red)st.revisado={};st.red=red;
 try{await quien();await Promise.all([cargarRanking(),st.otros?null:cargarRedesModelo()]);}catch(e){return msg(e.message);}
 lista();pintar();if(!st.mapa)msg('Abre la foto o captura de la placa de este modelo para ver los componentes iluminados. La lista ya está abajo.');
}
async function culpable(ref){
 const red=st.red,m=modelo();if(!red||st.busy)return;
 if(!await confirmar2('¿Confirmas que '+ref+' estaba en corto en '+red+' ('+m+')? Quedará guardado para todo el taller.'))return;
 st.busy=true;try{const user=await quien();const p=st.puntos.find(x=>x.nombre===ref);
  await checked(sb().from('placas_cortos').insert({modelo:m,red,componente:ref,punto_id:p?.id||null,creado_por:user}));
  st.revisado[ref]='culpable';await cargarRanking();lista();pintar();msg('Guardado: '+ref+' era el culpable en '+red+'. Gracias, esto ayuda al próximo técnico.');
 }catch(e){msg(e.message);}finally{st.busy=false;}
}

/* ---------- Marcar componentes ---------- */
function seleccion(){
 const box=$('ab-cortos-sel');if(!box)return;box.replaceChildren();const p=st.puntos.find(x=>x.id===st.sel);if(!p)return;
 const t=document.createElement('p');t.textContent=p.nombre+' · líneas: '+(p.redes.length?p.redes.join(', '):'ninguna todavía');box.append(t);
 const red=st.red||norm($('ab-cortos-red').value);
 if(red){const b=document.createElement('button');b.type='button';const tiene=p.redes.includes(red);b.textContent=(tiene?'Quitar de ':'Agregar a ')+red;b.addEventListener('click',()=>cambiarRed(p,red,!tiene));box.append(b);}
 const ren=document.createElement('button');ren.type='button';ren.textContent='Cambiar nombre';ren.addEventListener('click',async()=>{const n=normRef(await preguntar('Nombre del componente:',p.nombre));if(!n||n===p.nombre)return;await guardarPunto(p,{nombre:n});});box.append(ren);
 const del=document.createElement('button');del.type='button';del.className='abc-culpable';del.textContent='Borrar marca';del.addEventListener('click',async()=>{if(!await confirmar2('¿Borrar la marca '+p.nombre+'?'))return;try{await checked(sb().from('placas_puntos').delete().eq('id',p.id).select('id'));st.puntos=st.puntos.filter(x=>x.id!==p.id);st.sel=null;seleccion();pintar();st.otros=null;msg('Marca borrada.');}catch(e){msg('Solo quien la marcó o un administrador puede borrarla.');}});box.append(del);
}
async function confirmar2(t){return typeof window.confirmar==='function'?await window.confirmar(t):confirm(t);}
async function preguntar(t,v=''){return typeof window.pedirTexto==='function'?await window.pedirTexto(t,{valor:v}):prompt(t,v);}
async function guardarPunto(p,cambios){
 try{await checked(sb().from('placas_puntos').update({...cambios,actualizado_en:new Date().toISOString()}).eq('id',p.id).select('id'));Object.assign(p,cambios);st.otros=null;seleccion();pintar();if(st.red)lista();msg('Guardado.');}catch(e){msg(e.message);}
}
async function cambiarRed(p,red,poner){await guardarPunto(p,{redes:poner?[...new Set([...p.redes,red])]:p.redes.filter(r=>r!==red)});}
async function tocar(clientX,clientY){
 const i=img();if(!i||!st.mapa)return msg('Primero abre la foto o captura de la placa.');
 const r=i.getBoundingClientRect(),s=Math.min(r.width/i.naturalWidth,r.height/i.naturalHeight),w=i.naturalWidth*s,h=i.naturalHeight*s;
 const x=(clientX-r.left-(r.width-w)/2)/w,y=(clientY-r.top-(r.height-h)/2)/h;if(x<0||x>1||y<0||y>1)return;
 // ¿Tocó una marca existente? (radio de 14 px en pantalla)
 let cerca=null,dmin=14;for(const p of st.puntos){const d=Math.hypot((p.x-x)*w,(p.y-y)*h);if(d<dmin){dmin=d;cerca=p;}}
 if(cerca){st.sel=cerca.id;seleccion();pintar();return;}
 const nombre=normRef(await preguntar('Nombre del componente que tocaste (ej. C4321, L2400, U2900):'));if(!nombre)return;
 const red=st.red||norm($('ab-cortos-red').value);
 try{const user=await quien(),mapa=st.mapa;const fila={mapa_id:mapa.id,x:Math.round(x*1e5)/1e5,y:Math.round(y*1e5)/1e5,nombre,tipo:'pieza',redes:red?[red]:[],creado_por:user};
  const r2=await checked(sb().from('placas_puntos').insert(fila).select('id,x,y,nombre,redes,creado_por').single());if(st.mapa!==mapa)return;
  const p={...r2,redes:Array.isArray(r2?.redes)?r2.redes:fila.redes};st.puntos.push(p);st.sel=p.id;st.otros=null;seleccion();pintar();if(st.red)lista();
  msg('Marcado '+nombre+(red?' en '+red:'')+'. Toca el siguiente.');
 }catch(e){msg(e.message);}
}

/* ---------- Montaje ---------- */
function mount(){
 if(!$('ab-shell')||$('ab-cortos'))return;const aside=$('ab-pane-bitmap')?.querySelector('aside');if(!aside)return;
 const box=document.createElement('section');box.id='ab-cortos';box.className='ab-card';
 box.innerHTML='<h3><i class="ti ti-bolt"></i> Buscador de cortos</h3>'
  +'<p class="abc-ayuda">Escribe la línea que está en corto. Se iluminan en la placa los componentes de esa línea y sale la lista para revisarlos uno por uno.</p>'
  +'<div class="abc-fila"><input id="ab-cortos-red" list="ab-cortos-redes" maxlength="80" autocomplete="off" placeholder="Ej. PP_VDD_MAIN" aria-label="Línea en corto" data-bcbp-no><button id="ab-cortos-buscar" type="button"><i class="ti ti-search"></i> Buscar</button></div><datalist id="ab-cortos-redes"></datalist>'
  +'<div id="ab-cortos-top"></div><ul id="ab-cortos-lista" class="abc-lista"></ul>'
  +'<details id="ab-cortos-marcar-box"><summary>Marcar componentes (una vez por modelo)</summary>'
  +'<p class="abc-ayuda">Abre REFOX al lado, busca la misma línea y toca aquí, sobre la captura, cada componente que REFOX ilumine. Queda guardado para todos los técnicos.</p>'
  +'<label class="abc-check"><input id="ab-cortos-marcar" type="checkbox"> Modo marcar: tocar la placa agrega o elige un componente</label><div id="ab-cortos-sel"></div></details>'
  +'<p id="ab-cortos-status" role="status">Abre la foto o captura de la placa del modelo.</p>';
 const cat=$('ab-catalog');cat?aside.insertBefore(box,cat):aside.append(box);
 $('ab-cortos-buscar').addEventListener('click',buscar);
 $('ab-cortos-red').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();buscar();}});
 $('ab-cortos-marcar').addEventListener('change',e=>{st.marcar=e.target.checked;st.sel=null;seleccion();pintar();msg(st.marcar?(st.mapa?'Toca un componente en la placa.':'Primero abre la foto o captura de la placa.'):'Modo marcar apagado.');});
 $('ab-model').addEventListener('change',()=>{st.mapa=null;st.puntos=[];st.otros=null;st.red='';st.revisado={};st.ranking=[];st.sel=null;$('ab-cortos-red').value='';lista();seleccion();pintar();if(sb())cargarRedesModelo().catch(()=>{});});
 const stage=$('ab-stage-view');
 stage.addEventListener('pointerdown',e=>{st.down={x:e.clientX,y:e.clientY,n:(st.down?.n||0)+1,id:e.pointerId};},true);
 stage.addEventListener('pointerup',e=>{const d=st.down;st.down=null;if(!st.marcar||!d||d.id!==e.pointerId)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>5)return;tocar(e.clientX,e.clientY);},true);
 window.addEventListener('bayol-catalog-photo',async e=>{
  const row=e.detail;if(!row||row.modelo!==modelo())return;st.mapa=row;st.puntos=[];st.sel=null;
  try{await quien();await cargarPuntos();if(!st.otros)await cargarRedesModelo();}catch(err){msg(err.message);}
  if(st.mapa!==row)return;const i=img();if(i&&!i.complete)i.addEventListener('load',pintar,{once:true});pintar();if(st.red)lista();
  msg(st.puntos.length?st.puntos.length+' componente(s) marcado(s) en esta foto.':'Esta foto aún no tiene componentes marcados.');
 });
 window.addEventListener('bayol-ai-board-point-reset',()=>{st.mapa=null;st.puntos=[];st.sel=null;seleccion();$('ab-cortos-capa')?.remove();});
 window.addEventListener('resize',()=>pintar());
 new MutationObserver(()=>{const c=$('ab-cortos-capa');if(c)c.style.setProperty('--abc-s',String(1/escala()));}).observe($('ab-target'),{attributes:true,attributeFilter:['style']});
 sb()?.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'){st.user=null;st.mapa=null;st.puntos=[];st.otros=null;st.ranking=[];lista();pintar();}});
}
window.BayolCortos={estado:()=>({mapa:st.mapa?.id||null,puntos:st.puntos.length,red:st.red,marcar:st.marcar}),buscar,tocar};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
