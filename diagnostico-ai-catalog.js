/* Shared technical photos in the existing PRIVATE placas bucket. Never sent to the LLM. */
(()=>{'use strict';
const $=id=>document.getElementById(id),sb=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let busy=false,epoch=0,owner=null,observedIdentity,page=0,rows=[];
function message(text){$('ab-catalog-status').textContent=text;}
function controls(){for(const n of $('ab-catalog').querySelectorAll('button,input,select'))n.disabled=busy;$('ab-catalog-prev').disabled=busy||page===0;}
async function checked(p){const r=await p;if(r.error)throw Error('No se confirmó la operación del catálogo privado.');return r.data;}
async function identity(){const c=sb();if(!c)throw Error('Inicia sesión en el taller.');const r=await c.auth.getUser();if(r.error||!UUID.test(r.data?.user?.id)||r.data.user.is_anonymous)throw Error('Inicia sesión con una cuenta del taller.');if(await checked(c.rpc('app_puede_diagnostico'))!==true)throw Error('Sin permiso de diagnóstico.');return r.data.user.id;}
function current(version,model){return version===epoch&&model===$('ab-model').value;}
function pathOK(path){return typeof path==='string'&&path.length<=512&&!/[\\%:?#\u0000-\u001f]/.test(path)&&path.split('/').every(p=>p&&p!=='.'&&p!=='..');}
function provenance(row){try{const m=JSON.parse(row.notas);if(m.schema==='bayol-photo-catalog/1'&&typeof m.revision==='string'&&m.source&&['title','license','reference'].every(k=>typeof m.source[k]==='string'))return m;}catch{}return null;}
function render(){const host=$('ab-catalog-list');host.replaceChildren();for(const row of rows){const b=document.createElement('button');b.type='button';b.textContent=(row.titulo||row.modelo)+' · '+row.cara+' · Sin validación eléctrica';b.addEventListener('click',()=>open(row));host.append(b);}}
function reset(){epoch++;owner=null;page=0;rows=[];$('ab-catalog-list').replaceChildren();for(const n of $('ab-catalog').querySelectorAll('input')){if(n.type==='checkbox')n.checked=false;else n.value='';}message('Catálogo no cargado.');controls();}
async function load(){
 if(busy)return;busy=true;controls();const version=epoch,model=$('ab-model').value;
 try{const user=await identity();if(!current(version,model))return;owner=user;
  const found=await checked(sb().from('placas_mapas').select('id,modelo,cara,titulo,foto_path,ancho,alto,peso_bytes,notas').eq('marca','Apple').eq('modelo',model).order('creado_en',{ascending:false}).order('id',{ascending:false}).range(page*20,page*20+19));
  if(!current(version,model))return;rows=(Array.isArray(found)?found:[]).filter(r=>r.modelo===model&&UUID.test(r.id));render();message(rows.length?'Página '+(page+1)+' · Fotografías del taller, pendientes de revisión.':'Sin fotografías en esta página para '+model+'. Puedes registrar una fotografía propia de placa.');
 }catch(e){if(current(version,model)){rows=[];render();message(e.message);}}finally{busy=false;controls();}
}
async function open(row){
 if(busy)return;busy=true;controls();const version=epoch,model=$('ab-model').value;
 try{const user=await identity();if(!current(version,model)||user!==owner)return;if(row.modelo!==model||!pathOK(row.foto_path)||row.peso_bytes>35*1024*1024)throw Error('Foto inválida o superior a 35 MB.');
  const file=await checked(sb().storage.from('placas').download(row.foto_path));if(!current(version,model))return;
  const m=provenance(row),description='Fotografía del taller: '+(row.titulo||model)+' · Cara '+row.cara+(m?' · Revisión '+m.revision+' · Fuente '+m.source.title+' · Licencia declarada '+m.source.license+' · '+m.source.reference:' · Procedencia y revisión no registradas');
  const ok=await window.BayolAIBoard.openPhoto(file,{model,description,isCurrent:()=>current(version,model)});if(ok&&current(version,model))message('Foto descargada con tu sesión. Sin conexiones ni referencias eléctricas verificadas.');
 }catch(e){if(current(version,model))message(e.message);}finally{busy=false;controls();}
}
async function dimensions(file){const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();if(img.naturalWidth*img.naturalHeight>80000000)throw Error('Máximo 80 megapíxeles.');return {ancho:img.naturalWidth,alto:img.naturalHeight};}finally{URL.revokeObjectURL(url);}}
async function upload(){
 if(busy)return;const file=$('ab-catalog-file').files?.[0];if(!file||!$('ab-catalog-consent').checked)return message('Selecciona una foto y confirma su procedencia y el guardado.');
 const fields={revision:$('ab-catalog-revision').value.trim(),title:$('ab-catalog-title').value.trim(),license:$('ab-catalog-license').value.trim(),reference:$('ab-catalog-reference').value.trim()},model=$('ab-model').value,face=$('ab-catalog-face').value;
 if(Object.values(fields).some(v=>!v)||fields.revision.length>80||Object.values(fields).some(v=>v.length>500)||!['A','B','completa'].includes(face))return message('Completa título, revisión, permiso de uso y procedencia.');
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>35*1024*1024)return message('Selecciona PNG, JPEG o WebP de hasta 35 MB.');
 busy=true;controls();const version=epoch;let path=null,uploaded=false,saved=false,user;
 try{user=await identity();if(!current(version,model))return;owner=user;const size=await dimensions(file);if(!current(version,model))return;
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current(version,model))return;
  if(await identity()!==user||!current(version,model))return;
  path='ai-board/'+user+'/'+crypto.randomUUID()+({ 'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}[file.type]);
  await checked(sb().storage.from('placas').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'0'}));uploaded=true;if(!current(version,model))return;
  const id=crypto.randomUUID(),notes=JSON.stringify({schema:'bayol-photo-catalog/1',revision:fields.revision,source:{title:fields.title,license:fields.license,reference:fields.reference},originalSHA256:hash,validation:'unverified'});
  // Do not remove a successfully uploaded object on an ambiguous insert failure: the
  // database might have committed. First confirm by the client-generated UUID.
  const result=await sb().from('placas_mapas').insert({id,marca:'Apple',modelo:model,cara:face,titulo:fields.title,foto_path:path,...size,peso_bytes:file.size,notas:notes,creado_por:user}).select('id').single();
  if(result.error){const confirm=await sb().from('placas_mapas').select('id').eq('id',id);if(confirm.error) {uploaded=false;throw Error('No se confirmó el registro. Recarga el catálogo antes de volver a subir; el archivo se conserva para no romper un posible registro.');}saved=confirm.data?.some(r=>r.id===id)===true;}else saved=result.data?.id===id;
  if(!saved)throw Error('No se confirmó el registro. Recarga el catálogo antes de reintentar.');
  if(!current(version,model))return;$('ab-catalog-file').value='';$('ab-catalog-consent').checked=false;page=0;busy=false;await load();if(current(version,model))message('Fotografía guardada en el catálogo privado. Pendiente de validación eléctrica.');
 }catch(e){if(current(version,model))message(e.message);}finally{
  // Cleanup only objects created by this upload and only under the same identity.
  if(uploaded&&!saved&&current(version,model))try{if(await identity()===user)await checked(sb().storage.from('placas').remove([path]));}catch{if(current(version,model))message('No se confirmó la limpieza del archivo sin registro. Solicita revisión del catálogo.');}
  busy=false;controls();
 }
}
function mount(){if(!$('ab-shell')||$('ab-catalog'))return;const box=document.createElement('section');box.id='ab-catalog';box.className='ab-card';box.innerHTML='<h3>Fotografías del taller</h3><p>Catálogo privado compartido con usuarios autorizados de Diagnóstico. Cada fotografía necesita revisión; no equivale a un mapa eléctrico.</p><div><button id="ab-catalog-refresh" type="button">Cargar catálogo del modelo</button><button id="ab-catalog-prev" type="button">Anterior</button><button id="ab-catalog-next" type="button">Siguiente</button></div><p id="ab-catalog-status" role="status">Catálogo no cargado.</p><div id="ab-catalog-list"></div><details><summary>Registrar fotografía de placa</summary><div class="ab-catalog-form"><label>Fotografía original<input id="ab-catalog-file" type="file" accept="image/png,image/jpeg,image/webp"></label><label>Título<input id="ab-catalog-title" maxlength="500"></label><label>Revisión de placa<input id="ab-catalog-revision" maxlength="80"></label><label>Cara<select id="ab-catalog-face"><option value="A">Superior / A</option><option value="B">Inferior / B</option><option value="completa">Completa</option></select></label><label>Permiso de uso<input id="ab-catalog-license" maxlength="500" placeholder="Fotografía propia o permiso acreditado"></label><label>Procedencia<input id="ab-catalog-reference" maxlength="500" placeholder="Registro de la placa y origen de la fotografía"></label><label><input id="ab-catalog-consent" type="checkbox"> Tengo permiso de uso y autorizo guardar esta foto técnica para el taller.</label><p>No incluyas personas, claves ni datos de clientes. Se guarda el original, incluidos sus metadatos. Esta foto no se envía a la IA.</p><button id="ab-catalog-upload" type="button">Guardar fotografía</button></div></details>';
 $('ab-pane-bitmap').querySelector('aside').append(box);$('ab-catalog-refresh').addEventListener('click',()=>{page=0;load();});$('ab-catalog-prev').addEventListener('click',()=>{if(!busy&&page){page--;load();}});$('ab-catalog-next').addEventListener('click',()=>{if(!busy){page++;load();}});$('ab-catalog-upload').addEventListener('click',upload);$('ab-model').addEventListener('change',reset);
 sb()?.auth.onAuthStateChange((event,session)=>{const next=session?.user?.id||null;if(event==='SIGNED_OUT'||(observedIdentity!==undefined&&next!==observedIdentity)||(owner&&next!==owner)){reset();window.dispatchEvent(new Event('bayol-ai-board-identity-reset'));}observedIdentity=next;});controls();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
