/* Technical review workflow, separate from the legacy unreviewed knowledge table. */
(()=>{'use strict';
const $=id=>document.getElementById(id),client=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
let busy=false,epoch=0,admin=false,owner=null,page=0;
function state(message=''){const n=$('ab-library-status');n.textContent=message;}
function controls(){for(const id of ['ab-library-refresh','ab-library-prev','ab-library-next','ab-library-submit'])$(id).disabled=busy;}
async function checked(p){const {data,error}=await p;if(error)throw Error('Biblioteca protegida no disponible en este entorno.');return data;}
async function load(){
 if(busy)return;busy=true;controls();const version=epoch;state('Cargando revisión técnica…');
 try{
  const sb=client();if(!sb)throw Error('Inicia sesión en el taller.');const auth=await sb.auth.getUser();
  if(version!==epoch)return;
  if(auth.error||!auth.data?.user||auth.data.user.is_anonymous)throw Error('Inicia sesión en el taller.');owner=auth.data.user.id;
  const isAdmin=await checked(sb.rpc('app_is_admin'))===true;if(version!==epoch)return;admin=isAdmin;
  const cases=await checked(sb.rpc('ai_board_cases'));
  const list=await checked(sb.from('ai_board_library').select('id,modelo,revision,summary,evidence,sources,status,author_id,review_notes,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*20,page*20+19));
  if(version!==epoch)return;
  const select=$('ab-library-case'),prior=select.value;select.replaceChildren();
  for(const c of cases){const n=document.createElement('option');n.value=c.id;n.textContent=c.modelo+' · '+c.id.slice(0,8);select.append(n);}if(cases.some(c=>c.id===prior))select.value=prior;
  const feed=$('ab-library-feed');feed.replaceChildren();
  for(const entry of list){const card=document.createElement('article');card.className='ab-card';
   const title=document.createElement('h3');title.textContent=entry.modelo+' · '+entry.revision+' · '+({pending:'Pendiente de revisión',approved:'Revisado por técnico independiente',rejected:'Rechazado',withdrawn:'Retirado'}[entry.status]||entry.status);card.append(title);
   for(const [label,text] of [['Solución propuesta',entry.summary],['Pruebas registradas',entry.evidence],['Revisión',entry.review_notes]])if(text){const p=document.createElement('p');p.textContent=label+': '+text;card.append(p);}
   for(const source of entry.sources||[]){if(typeof source.url!=='string'||!/^https:\/\//.test(source.url))continue;const a=document.createElement('a');a.textContent=source.title;a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';card.append(a,document.createElement('br'));}
   if(entry.status==='pending'&&admin&&entry.author_id!==owner)for(const [decision,label] of [['approved','Aprobar tras comprobar'],['rejected','Rechazar']]){const b=document.createElement('button');b.type='button';b.className='ab-secondary';b.textContent=label;b.addEventListener('click',()=>review(entry.id,decision));card.append(b);}
   if(['pending','approved'].includes(entry.status)&&(admin||entry.author_id===owner)){const b=document.createElement('button');b.type='button';b.className='ab-secondary';b.textContent='Retirar de Biblioteca';b.addEventListener('click',()=>review(entry.id,'withdrawn'));card.append(b);}
   feed.append(card);
  }
  state(list.length?'Página '+(page+1)+' · '+list.length+' entradas':'Sin entradas en esta página. Los casos antiguos siguen sin revisión independiente.');
 }catch(e){if(version===epoch)state(e.message);}
 finally{busy=false;controls();$('ab-library-prev').disabled=busy||page===0;}
}
async function submit(){
 if(busy)return;busy=true;controls();const version=epoch;
 try{
  const url=$('ab-library-source').value.trim(),title=$('ab-library-source-title').value.trim();
  if(!/^https:\/\/[A-Za-z0-9.-]+(\/[^\s]*)?$/.test(url)||!title)throw Error('Indica título y enlace HTTPS de la fuente técnica.');
  await checked(client().rpc('ai_board_library_submit',{p_case:$('ab-library-case').value,p_revision:$('ab-library-revision').value.trim(),p_summary:$('ab-library-summary').value.trim(),p_evidence:$('ab-library-evidence').value.trim(),p_sources:[{title,url}]}));
  if(version!==epoch)return;for(const id of ['ab-library-summary','ab-library-evidence'])$(id).value='';busy=false;page=0;await load();
 }catch(e){if(version===epoch)state(e.message);}finally{busy=false;controls();}
}
async function review(id,decision){
 if(busy)return;const notes=prompt('Registra las pruebas comprobadas, condiciones y motivo de tu decisión (mínimo 20 caracteres).');if(notes===null)return;
 busy=true;controls();const version=epoch;
 try{await checked(client().rpc('ai_board_library_review',{p_entry:id,p_decision:decision,p_notes:notes.trim()}));if(version!==epoch)return;busy=false;await load();}
 catch(e){if(version===epoch)state(e.message);}finally{busy=false;controls();}
}
function mount(){
 const host=$('ab-library');if(!host||$('ab-reviewed-library'))return;
 const box=document.createElement('section');box.id='ab-reviewed-library';box.className='ab-card';
 box.innerHTML='<h3>Biblioteca con revisión técnica</h3><p>Una solución necesita pruebas, fuente y aprobación de otra persona autorizada. Las respuestas de IA nunca se aprueban automáticamente.</p><div class="ab-library-form">'+
 '<label>Diagnóstico<select id="ab-library-case"></select></label><label>Revisión de placa<input id="ab-library-revision" maxlength="80"></label>'+ 
 '<label>Solución propuesta<textarea id="ab-library-summary" maxlength="4000" rows="3"></textarea></label><label>Pruebas finales, condiciones y mediciones<textarea id="ab-library-evidence" maxlength="4000" rows="3"></textarea></label>'+ 
 '<label>Título de fuente<input id="ab-library-source-title" maxlength="150"></label><label>Referencia técnica HTTPS<input id="ab-library-source" type="url" maxlength="500"></label></div>'+ 
 '<button id="ab-library-submit" type="button" class="ab-primary">Enviar a revisión</button><p id="ab-library-status" role="status">Biblioteca protegida no cargada.</p><div class="ab-library-pagination"><button id="ab-library-refresh" type="button">Recargar</button><button id="ab-library-prev" type="button">Anterior</button><button id="ab-library-next" type="button">Siguiente</button></div><div id="ab-library-feed"></div>';
 host.prepend(box);$('ab-library-refresh').addEventListener('click',load);$('ab-library-submit').addEventListener('click',submit);
 $('ab-library-prev').addEventListener('click',()=>{if(!busy&&page){page--;load();}});$('ab-library-next').addEventListener('click',()=>{if(!busy){page++;load();}});
 document.querySelector('[data-ab-tab="biblioteca"]')?.addEventListener('click',load);
 window.addEventListener('bayol-ai-board-identity-reset',()=>{epoch++;owner=null;admin=false;page=0;$('ab-library-feed').replaceChildren();for(const n of box.querySelectorAll('textarea,input,select'))n.value='';state('Sesión cambiada. Recarga la Biblioteca.');});
 // Prevent the legacy exitoso=true flow from bypassing independent review in this view.
 for(const b of document.querySelectorAll('#v-diagnostico [onclick*="guardarCasoConocimiento"]')){b.removeAttribute('onclick');b.textContent='Proponer solución para revisión';b.addEventListener('click',()=>{document.querySelector('[data-ab-tab="biblioteca"]').click();box.scrollIntoView({block:'start'});});}
 if(!$('ab-pane-biblioteca').hidden)load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
