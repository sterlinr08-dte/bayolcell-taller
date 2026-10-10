const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const engines=require(process.env.AI_BOARD_PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.AI_BOARD_BROWSER_ENGINE||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unsupported AI BOARD browser engine.');
const root=path.resolve(__dirname,'../..');let browser;
const full=fs.readFileSync(path.join(root,'taller.html'),'utf8');
const A='11111111-1111-4111-8111-111111111111',C='44444444-4444-4444-8444-444444444444',S='77777777-7777-4777-8777-777777777777';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';
async function setup(width=1200){
 const page=await browser.newPage({viewport:{width,height:850}});page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(/^(blob:|data:)/.test(r.url()))console.error('Local fixture request failed:',r.failure()?.errorText);});
 await page.route('**/*',r=>/^(blob:|data:)/.test(r.request().url())?r.continue():r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width"><body></body>'}):r.abort());
 await page.goto('https://ai-board.test');
 await page.evaluate(html=>{
  const parsed=new DOMParser().parseFromString(html,'text/html');document.head.append(...[...parsed.head.querySelectorAll('style')].map(n=>n.cloneNode(true)));
  document.body.append(parsed.getElementById('v-diagnostico').cloneNode(true));document.getElementById('v-diagnostico').style.display='block';
 },full);
 await page.addStyleTag({content:'body{margin:10px;background:#f7f8fa} #v-diagnostico{width:100%;max-width:1200px;margin:auto}'});
 for(const f of ['diagnostico-ai-board.css','diagnostico-ai-chat.css'])await page.addStyleTag({path:path.join(root,f)});
 await page.evaluate(({A,C,S,PNG})=>{
  window.mock={user:A,calls:[],turns:[],sessions:[{id:S,owner_id:A,modelo:'iPhone X',diagnostico_id:C,created_at:'2026-10-09T12:00:00Z'}],callbacks:[],error:false,library:[],admin:false,catalog:[],storageCalls:[]};
  const state=window.mock;
  window.supabaseClient={
   auth:{getUser:async()=>({data:{user:state.user?{id:state.user}:null}}),onAuthStateChange:cb=>state.callbacks.push(cb)},
   rpc:async(name,args)=>{state.calls.push({rpc:name,args});if(state.missingBackend&&name.startsWith('ai_board'))return {data:null,error:{code:'PGRST202',message:'Could not find the function public.'+name}};if(name==='app_puede_diagnostico')return {data:state.permission!==false};if(name==='app_is_admin')return {data:state.admin};if(name==='ai_board_library_submit'){state.library.push({id:C,modelo:'iPhone X',revision:args.p_revision,summary:args.p_summary,evidence:args.p_evidence,sources:args.p_sources,status:'pending',author_id:state.user});return {data:C};}if(name==='ai_board_library_review'){state.library.find(e=>e.id===args.p_entry).status=args.p_decision;return {data:true};}return {data:name==='ai_board_create_case'?C:[{id:C,modelo:'iPhone X',orden_id:null}]};},
   from:name=>{
    let filters={},inserted,deleted=false,range,isSingle=false,updated;
    const q={select(){return q},eq(k,v){filters[k]=v;return q},in(k,v){filters[k]={in:v};return q},update(v){updated=v;return q},order(){return q},limit(){return q},range(start,end){range=[start,end];return q},insert(v){inserted=v;return q},delete(){deleted=true;return q},single(){isSingle=true;return q},then(resolve){
     let data;
     if(name==='placas_puntos'||name==='placas_cortos'){
      state.t=state.t||{};const T=state.t[name]=state.t[name]||[];const m=r=>Object.entries(filters).every(([k,v])=>v&&v.in?v.in.includes(r[k]):r[k]===v);
      if(inserted){const row={id:crypto.randomUUID(),...inserted};T.push(row);data=isSingle?row:[row];}
      else if(updated){data=T.filter(m);data.forEach(r=>Object.assign(r,updated));}
      else if(deleted){data=T.filter(m);state.t[name]=T.filter(r=>!m(r));}
      else{data=T.filter(m);if(isSingle)data=data[0];}
      return Promise.resolve({data,error:null}).then(resolve);
     }
     if(name==='placas_mapas'){
      state.calls.push({table:name,filters,inserted});
      if(inserted){if(state.catalogInsertError)return Promise.resolve({error:{message:'Synthetic failed insert'}}).then(resolve);state.catalog.push(inserted);data=inserted;}
      else{if(state.catalogReadError)return Promise.resolve({error:{message:'Synthetic failed read'}}).then(resolve);data=state.catalog.filter(s=>Object.entries(filters).every(([k,v])=>s[k]===v));if(isSingle)data=data[0];}
      if(range&&Array.isArray(data))data=data.slice(range[0],range[1]+1);return Promise.resolve({data,error:null}).then(resolve);
     }
     if(name==='ai_board_sessions'){
      if(deleted){data=state.sessions.filter(s=>s.id===filters.id);state.sessions=state.sessions.filter(s=>s.id!==filters.id);state.turns=[];}
      else if(inserted){data={id:S,...inserted,created_at:'2026-10-09T12:00:00Z'};state.sessions=[data];}
      else {data=state.sessions.filter(s=>Object.entries(filters).every(([k,v])=>s[k]===v));if(filters.id)data=data[0];}
     }else if(name==='ai_board_library')data=state.library.filter(e=>state.admin||e.status==='approved'||e.author_id===state.user);else data=[...state.turns].reverse();
     if(range&&Array.isArray(data))data=data.slice(range[0],range[1]+1);
     return Promise.resolve({data,error:null}).then(resolve);
    }};return q;
   },
   storage:{from:bucket=>({download:async path=>{state.storageCalls.push({op:'download',bucket,path});if(state.deferPhoto)await new Promise(r=>state.resolvePhoto=r);return {data:new Blob([Uint8Array.from(atob(PNG),c=>c.charCodeAt(0))],{type:'image/png'})};},upload:async(path,file,options)=>{state.storageCalls.push({op:'upload',bucket,path,options,size:file.size});return {data:{path}};},remove:async paths=>{state.storageCalls.push({op:'remove',bucket,paths});return {data:[]};}})},
   functions:{invoke:async(name,{body})=>{
    state.calls.push({name,body});if(state.deferred)await new Promise(r=>state.resolve=r);
    if(state.error)return {error:{context:new Response(JSON.stringify({error:'Error simulado',code:state.errorCode}),{status:state.errorStatus||502})}};
    state.turns.push({user_message:body.message,assistant_message:'EVIDENCIA: medición reportada. PRÓXIMA PRUEBA: confirmar condiciones.',status:'completed'});
    return {data:{ok:true,persisted:true,answer:state.turns.at(-1).assistant_message}};
   }}
  };
 },{A,C,S,PNG});
 for(const f of ['diagnostico-photo-tiles.js','diagnostico-board-data.js','diagnostico-ai-board.js','diagnostico-ai-catalog.js','diagnostico-ai-cortos.js','diagnostico-ai-chat.js','diagnostico-ai-library.js'])await page.addScriptTag({path:path.join(root,f)});
 return {page,errors};
}
async function openChat(page){
 await page.locator('[data-ab-tab="ia"]').click();await page.evaluate(()=>{document.getElementById('ab-chat-hist').open=true;});await page.waitForFunction(()=>document.getElementById('ab-chat-case').options.length>1);
 await page.locator('#ab-chat-case').selectOption(C);await page.waitForFunction(()=>document.getElementById('ab-chat-session').options.length>1);
 await page.locator('#ab-chat-session').selectOption(S);await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Historial guardado'));
 assert.equal(await page.locator('#ab-model').inputValue(),'iPhone X');
}
test.before(async()=>{browser=await engines[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{}),...(process.env.AI_BOARD_CHROMIUM_PATH?{executablePath:process.env.AI_BOARD_CHROMIUM_PATH}:{})});});
test.after(async()=>browser?.close());
test('legacy one-shot diagnosis action remains available with missing chat backend',async()=>{
 const {page,errors}=await setup();
 const button=page.locator('#dg_btn');
 assert.equal(await button.getAttribute('onclick'),'diagnosticarIA()');
 await page.locator('[data-ab-tab="ia"]').click();
 assert.equal(await button.getAttribute('onclick'),'diagnosticarIA()');
 assert.match(await button.textContent(),/Diagnosticar con IA/i);
 assert.deepEqual(errors,[]);await page.close();
});
test('without the chat server the legacy save button and one-shot diagnosis keep working, with no dead controls',async()=>{
 const {page,errors}=await setup();await page.evaluate(()=>{window.mock.missingBackend=true;});
 const save=page.locator('#v-diagnostico button',{hasText:'Guardar como caso resuelto'});
 assert.equal(await save.getAttribute('onclick'),'guardarCasoConocimiento()');
 await page.locator('[data-ab-tab="ia"]').click();
 await page.waitForFunction(()=>!document.getElementById('ab-chat-off').hidden);
 assert.equal(await page.locator('#ab-chat-error').isHidden(),true);
 assert.equal(await page.locator('#ab-chat-send').isVisible(),false);
 assert.equal(await page.locator('#dg_btn').getAttribute('onclick'),'diagnosticarIA()');
 await page.locator('[data-ab-tab="biblioteca"]').click();
 await page.waitForFunction(()=>document.getElementById('ab-reviewed-library').hidden);
 assert.equal(await save.getAttribute('onclick'),'guardarCasoConocimiento()');
 const calls=await page.evaluate(()=>window.mock.calls);
 assert.equal(calls.filter(c=>c.name==='ai-board-chat').length,0);
 assert.equal(calls.filter(c=>c.rpc==='ai_board_cases').length,1,'el servidor se consulta una sola vez');
 assert.deepEqual(errors,[]);await page.close();
});
test('flujo simple: elegir modelo, escribir y enviar crea el caso y la conversación solos; la última conversación del modelo se abre sola',async()=>{
 const {page,errors}=await setup();await page.evaluate(()=>{window.mock.sessions=[];});
 await page.locator('[data-ab-tab="ia"]').click();
 assert.equal(await page.locator('#ab-chat-hist').evaluate(d=>d.open),false,'el historial arranca plegado');
 assert.equal(await page.locator('#ab-chat-model').inputValue(),await page.locator('#ab-model').inputValue());
 await page.locator('#ab-chat-model').selectOption('iPhone 12');
 assert.equal(await page.locator('#ab-model').inputValue(),'iPhone 12','un solo modelo para todo el módulo');
 await page.locator('.ab-chat-rapidas button',{hasText:'No enciende'}).click();
 assert.match(await page.locator('#ab-chat-text').inputValue(),/No enciende/);
 await page.locator('#ab-chat-text').fill('No enciende. Consumo 0.00 A.');await page.locator('#ab-chat-agree').check();
 await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>window.mock.turns.length===1);
 const calls=await page.evaluate(()=>window.mock.calls);
 assert.equal(calls.find(c=>c.rpc==='ai_board_create_case').args.p_model,'iPhone 12');
 assert.equal(calls.filter(c=>c.name==='ai-board-chat').length,1);
 await page.waitForFunction(()=>document.querySelectorAll('#ab-chat-feed .ab-bubble').length===2);
 // Otra pestaña del navegador: el consentimiento queda recordado para este usuario
 assert.equal(await page.evaluate(()=>localStorage.getItem('bayol_ai_board_consent_v1')),'11111111-1111-4111-8111-111111111111');
 assert.deepEqual(errors,[]);await page.close();
});
test('al entrar con el modelo de un caso existente, se abre sola su última conversación',async()=>{
 const {page,errors}=await setup();await page.locator('#ab-model').selectOption('iPhone X');
 await page.locator('[data-ab-tab="ia"]').click();
 await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Historial guardado'));
 assert.equal(await page.locator('#ab-chat-session').inputValue(),'77777777-7777-4777-8777-777777777777');
 assert.deepEqual(errors,[]);await page.close();
});
test('actual diagnostic DOM mounts once with three tabs and legacy tools preserved',async()=>{
 const {page,errors}=await setup();assert.equal(await page.locator('[role=tab]').count(),3);assert.equal(await page.locator('#dg_panic').count(),1);assert.equal(await page.locator('#conocimientoTable').count(),1);
 await page.addScriptTag({path:path.join(root,'diagnostico-ai-board.js')});assert.equal(await page.locator('#ab-shell').count(),1);
 await page.locator('[data-ab-tab="bitmap"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-ab-tab="ia"]').getAttribute('aria-selected'),'true');assert.deepEqual(errors,[]);await page.close();
});
test('consent, double-send, multi-turn persistence and plain-text output',async()=>{
 const {page,errors}=await setup();await openChat(page);await page.locator('#ab-chat-text').fill('<img src=x onerror=alert(1)> No carga');assert(await page.locator('#ab-chat-send').isDisabled());
 await page.locator('#ab-chat-agree').check();await page.evaluate(()=>mock.deferred=true);await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>!!mock.resolve);await page.locator('#ab-chat-text').dispatchEvent('keydown',{key:'Enter'});assert.equal(await page.evaluate(()=>mock.calls.filter(c=>c.name).length),1);await page.evaluate(()=>{mock.deferred=false;mock.resolve();});await page.waitForFunction(()=>!document.getElementById('ab-chat-text').value);
 assert.equal(await page.locator('#ab-chat-feed img').count(),0);assert.equal(await page.evaluate(()=>mock.calls.find(c=>c.name).name),'ai-board-chat');assert.equal(await page.evaluate(()=>mock.calls.find(c=>c.name).body.context.panic_log),undefined);
 await page.locator('#ab-chat-text').fill('¿Y después?');await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>mock.turns.length===2&&!document.getElementById('ab-chat-text').value);await page.locator('#ab-chat-session').selectOption('');await page.locator('#ab-chat-session').selectOption(S);await page.waitForFunction(()=>document.querySelectorAll('#ab-chat-feed .ab-bubble').length===4);
 assert((await page.locator('#ab-chat-feed').innerText()).includes('No carga'));assert.deepEqual(errors,[]);await page.close();
});
test('failure keeps draft; pending response cannot appear after signout',async()=>{
 const {page}=await setup();await openChat(page);await page.locator('#ab-chat-text').fill('Consulta');await page.locator('#ab-chat-agree').check();await page.evaluate(()=>mock.error=true);await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>!document.getElementById('ab-chat-error').hidden);
 assert.equal(await page.locator('#ab-chat-text').inputValue(),'Consulta');
 await page.evaluate(()=>{mock.error=false;mock.deferred=true;});await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>!!mock.resolve);
 await page.evaluate(()=>{mock.user=null;mock.callbacks.forEach(cb=>cb('SIGNED_OUT',null));mock.resolve();});await page.waitForFunction(()=>!document.getElementById('ab-chat-reload').disabled);
 assert.equal(await page.locator('#ab-chat-feed .ab-bubble').count(),0);assert(await page.locator('#ab-chat-send').isDisabled());await page.close();
});
test('uncertain delivery and pending response reuse UUID; a confirmed failed turn starts a new attempt',async()=>{
 const {page,errors}=await setup();await openChat(page);await page.locator('#ab-chat-text').fill('Consulta sintética de reintento');await page.locator('#ab-chat-agree').check();
 await page.evaluate(()=>{mock.error=true;mock.errorStatus=502;});
 const sendAndWait=async()=>{const count=await page.evaluate(()=>mock.calls.filter(c=>c.name).length);await page.locator('#ab-chat-send').click();await page.waitForFunction(n=>mock.calls.filter(c=>c.name).length===n+1&&!document.getElementById('ab-chat-send').disabled,count);};
 await sendAndWait();const original=await page.evaluate(()=>mock.calls.filter(c=>c.name).at(-1).body.request_id);
 await page.evaluate(()=>{mock.errorStatus=409;mock.errorCode='TURN_PENDING';});await sendAndWait();await sendAndWait();
 assert(await page.evaluate(id=>mock.calls.filter(c=>c.name).every(c=>c.body.request_id===id),original));
 await page.evaluate(()=>{mock.errorCode='TURN_FAILED';});await sendAndWait();
 await page.evaluate(()=>{mock.error=false;});await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>!document.getElementById('ab-chat-text').value);
 assert.notEqual(await page.evaluate(()=>mock.calls.filter(c=>c.name).at(-1).body.request_id),original);assert.equal(await page.evaluate(()=>mock.turns.length),1);assert.deepEqual(errors,[]);await page.close();
});
test('mobile has no horizontal overflow; local photo cleared on model change; corrupt image rejected',async()=>{
 const {page,errors}=await setup(390);const dialog=[];page.on('dialog',async d=>{dialog.push(d.message());await d.dismiss();});
 await page.locator('#ab-file').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==','base64')});
 await page.waitForFunction(()=>!!document.querySelector('#ab-target img'));await page.locator('#ab-model').selectOption('iPhone X');assert.equal(await page.locator('#ab-target img').count(),0);
 await page.locator('#ab-file').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.waitForFunction(()=>document.getElementById('ab-file').value==='');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:path.join(process.env.AI_BOARD_SCREENSHOT_DIR||require('node:os').tmpdir(),'ai-board-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);await page.close();
});
test('boardview model/provenance validation, component selection and net search',async()=>{
 const {page}=await setup();const board={schema:'bayol-boardview/1',model:'iPhone X',revision:'TEST-FIXTURE-NOT-REAL',source:{title:'Synthetic QA fixture',license:'Test only',reference:'Internal test'},width:100,height:100,components:[{ref:'QA1',side:'top',x:10,y:10,width:20,height:20,pins:[{id:'1',x:1,y:1,net:'QA_NET'}]}]};
 await page.locator('#ab-model').selectOption('iPhone X');await page.locator('#ab-board-file').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(board))});await page.waitForFunction(()=>!!document.querySelector('[data-ref="QA1"]'));
 await page.locator('[data-ref="QA1"] rect').click();assert((await page.locator('#ab-selection').innerText()).includes('QA_NET'));
 await openChat(page);await page.locator('[data-ab-tab="bitmap"]').click();await page.locator('#ab-point-query').click();assert(await page.locator('#ab-chat-point').isChecked());
 await page.locator('#ab-chat-text').fill('Synthetic QA component question');await page.locator('#ab-chat-agree').check();await page.locator('#ab-chat-send').click();await page.waitForFunction(()=>mock.turns.length===1);assert.equal(await page.evaluate(()=>mock.calls.find(c=>c.name).body.context.point.ref),'QA1');
 await page.locator('[data-ab-tab="bitmap"]').click();await page.locator('#ab-board-search').fill('QA_NET');assert((await page.locator('#ab-coverage').innerText()).includes('pendiente'));
 await page.locator('#ab-model').selectOption('iPhone XR');assert.equal(await page.locator('[data-ref]').count(),0);assert(await page.locator('#ab-point-query').isDisabled());assert.equal(await page.locator('#ab-chat-point').isChecked(),false);await page.close();
});

test('minimal case and conversation creation; owner can delete persisted history',async()=>{
 const {page,errors}=await setup();await page.locator('[data-ab-tab="ia"]').click();await page.evaluate(()=>{document.getElementById('ab-chat-hist').open=true;});await page.waitForFunction(()=>document.getElementById('ab-chat-case').options.length>1);
 await page.locator('#ab-chat-create-case').click();await page.waitForFunction(()=>document.getElementById('ab-chat-case').value=== '44444444-4444-4444-8444-444444444444'&&!document.getElementById('ab-chat-new').disabled);
 assert.equal(await page.evaluate(()=>mock.calls.find(c=>c.rpc==='ai_board_create_case').args.p_model),'iPhone 13 Pro Max');
 await page.locator('#ab-chat-new').click();await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Conversación guardada'));
 page.on('dialog',d=>d.accept());await page.locator('#ab-chat-delete').click();await page.waitForFunction(()=>mock.sessions.length===0&&!document.getElementById('ab-chat-reload').disabled);
 assert.equal(await page.locator('#ab-chat-feed .ab-bubble').count(),0);assert.deepEqual(errors,[]);await page.close();
});

test('HD local folder loads visible tiles and clears on user identity reset',async()=>{
 const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'ai-board-qa-')),photo=path.join(temp,'qa.png'),out=path.join(temp,'pyramid');
 require('node:child_process').execFileSync('python',['-c',"from PIL import Image; import sys; Image.new('RGB',(1024,512),(20,90,150)).save(sys.argv[1])",photo]);
 require('node:child_process').execFileSync('python',[path.join(root,'tools/ai-board/build_photo_pyramid.py'),photo,out,'--model','iPhone X','--revision','QA-SYNTHETIC','--title','Synthetic QA photo','--license','Test only','--reference','Internal QA']);
 const {page,errors}=await setup();await page.locator('#ab-model').selectOption('iPhone X');await page.locator('[data-ab-tab="ia"]').click();await page.locator('#ab-photo-folder').setInputFiles(out);
 await page.waitForFunction(()=>!!document.querySelector('.ab-photo-grid'));await page.locator('[data-ab-tab="bitmap"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.ab-photo-active img').length>0);assert((await page.locator('#ab-coverage').innerText()).includes('Foto HD'));
 const before=await page.locator('.ab-photo-grid').evaluate(n=>parseFloat(n.style.width));assert(before>0);
 await page.locator('#ab-stage-view').evaluate(n=>n.style.width='320px');await page.waitForFunction(w=>parseFloat(document.querySelector('.ab-photo-grid').style.width)<w,before);assert.equal(await page.locator('.ab-photo-grid').evaluate(n=>parseFloat(n.style.width)),await page.locator('#ab-stage-view').evaluate(n=>n.clientWidth));
 for(let i=0;i<6;i++)await page.locator('#ab-plus').click();assert(await page.locator('.ab-photo-active img').count()<=64);
 await page.evaluate(()=>window.dispatchEvent(new Event('bayol-ai-board-identity-reset')));assert.equal(await page.locator('.ab-photo-grid').count(),0);assert.deepEqual(errors,[]);await page.close();fs.rmSync(temp,{recursive:true});
});
test('library proposal remains pending and author cannot approve own solution',async()=>{
 const {page,errors}=await setup(390);await page.locator('[data-ab-tab="biblioteca"]').click();await page.waitForFunction(()=>document.getElementById('ab-library-case').options.length>0);
 await page.locator('#ab-library-revision').fill('QA-SYNTHETIC');await page.locator('#ab-library-summary').fill('Synthetic proposed repair for QA only');await page.locator('#ab-library-evidence').fill('Synthetic final measurement conditions for QA only');await page.locator('#ab-library-source-title').fill('QA reference');await page.locator('#ab-library-source').fill('https://support.apple.com/');
 await page.locator('#ab-library-submit').click();await page.waitForFunction(()=>document.getElementById('ab-library-feed').textContent.includes('Pendiente de revisión'));
 await page.evaluate(()=>mock.admin=true);await page.locator('#ab-library-refresh').click();assert.equal(await page.getByRole('button',{name:'Aprobar tras comprobar'}).count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.close();
});
test('older history pages remain accessible and identity change resets pagination',async()=>{
 const {page,errors}=await setup();await page.evaluate(()=>{mock.turns=Array.from({length:45},(_,i)=>({user_message:'Synthetic QA turn '+i,assistant_message:'QA answer '+i,status:'completed'}));});
 await openChat(page);assert.equal(await page.locator('#ab-chat-feed .human').count(),40);assert(!(await page.locator('#ab-chat-feed').innerText()).includes('Synthetic QA turn 0\n'));
 await page.locator('#ab-chat-turns-next').click();await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Página 2'));
 assert.equal(await page.locator('#ab-chat-feed .human').count(),5);assert((await page.locator('#ab-chat-feed').innerText()).includes('Synthetic QA turn 0'));
 await page.locator('#ab-chat-text').fill('Borrador durante lectura de historial');await page.locator('#ab-chat-agree').check();assert(await page.locator('#ab-chat-send').isDisabled());await page.locator('#ab-chat-text').press('Enter');assert.equal(await page.evaluate(()=>mock.calls.filter(c=>c.name).length),0);
 await page.locator('#ab-chat-turns-prev').click();await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Página 1'));assert.equal(await page.locator('#ab-chat-text').inputValue(),'Borrador durante lectura de historial');assert.equal(await page.locator('#ab-chat-send').isDisabled(),false);
 await page.evaluate(()=>{mock.user=null;mock.callbacks.forEach(cb=>cb('SIGNED_OUT',null));});assert.equal(await page.locator('#ab-chat-feed .human').count(),0);
 await page.evaluate(()=>{mock.user='11111111-1111-4111-8111-111111111111';});await openChat(page);assert.equal(await page.locator('#ab-chat-feed .human').count(),40);assert.deepEqual(errors,[]);await page.close();
});
async function catalogFixture(page){await page.locator('#ab-model').selectOption('iPhone X');await page.evaluate(({C,A})=>{mock.catalog=[{id:C,marca:'Apple',modelo:'iPhone X',cara:'A',titulo:'<img src=x> Synthetic QA',foto_path:'ai-board/'+A+'/qa.png',peso_bytes:70,ancho:1,alto:1,notas:'{}'}];},{C,A});await page.locator('#ab-catalog-refresh').click();await page.waitForFunction(()=>document.querySelectorAll('#ab-catalog-list button').length===1);}
async function catalogForm(page){await page.locator('#ab-model').selectOption('iPhone X');await page.locator('#ab-catalog summary').click();for(const [id,value] of [['title','Synthetic QA board photo'],['revision','QA-NOT-REAL'],['license','Test only'],['reference','Internal QA fixture']])await page.locator('#ab-catalog-'+id).fill(value);await page.locator('#ab-catalog-file').setInputFiles({name:'qa.png',mimeType:'image/png',buffer:Buffer.from(PNG,'base64')});}
test('private photo catalog filters the model, renders plain text and clears on signout',async()=>{
 const {page,errors}=await setup(390);await catalogFixture(page);assert.equal(await page.locator('#ab-catalog-list img').count(),0);await page.locator('#ab-catalog-list button').click();await page.waitForFunction(()=>!!document.querySelector('#ab-target img'));assert((await page.locator('#ab-details').innerText()).includes('Procedencia y revisión no registradas'));
 const call=await page.evaluate(()=>mock.storageCalls[0]);assert.equal(call.bucket,'placas');assert.equal(call.op,'download');assert.equal(await page.evaluate(()=>mock.calls.filter(c=>c.name).length),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>{mock.user=null;mock.callbacks.forEach(cb=>cb('SIGNED_OUT',null));});assert.equal(await page.locator('#ab-target img').count(),0);assert.equal(await page.locator('#ab-catalog-list button').count(),0);assert.deepEqual(errors,[]);await page.close();
});
test('catalog rejects missing diagnostic permission before table or storage access',async()=>{
 const {page,errors}=await setup();await page.evaluate(()=>mock.permission=false);await page.locator('#ab-catalog-refresh').click();await page.waitForFunction(()=>document.getElementById('ab-catalog-status').textContent.includes('Sin permiso'));assert.equal(await page.evaluate(()=>mock.storageCalls.length),0);assert.equal(await page.evaluate(()=>mock.calls.filter(c=>c.table==='placas_mapas').length),0);assert.deepEqual(errors,[]);await page.close();
});
test('late private photo download cannot restore a photo after identity change',async()=>{
 const {page,errors}=await setup();await catalogFixture(page);await page.evaluate(()=>mock.deferPhoto=true);await page.locator('#ab-catalog-list button').click();await page.waitForFunction(()=>!!mock.resolvePhoto);await page.evaluate(()=>{mock.user=null;mock.callbacks.forEach(cb=>cb('SIGNED_OUT',null));mock.resolvePhoto();});await page.waitForFunction(()=>!document.getElementById('ab-catalog-refresh').disabled);assert.equal(await page.locator('#ab-target img').count(),0);assert.deepEqual(errors,[]);await page.close();
});
test('photo upload requires consent, stores provenance and original hash, and never calls the LLM',async()=>{
 const {page,errors}=await setup(390);await catalogForm(page);await page.locator('#ab-catalog-upload').click();assert.equal(await page.evaluate(()=>mock.storageCalls.length),0);await page.locator('#ab-catalog-consent').check();await page.locator('#ab-catalog-upload').click();await page.waitForFunction(()=>document.getElementById('ab-catalog-status').textContent.includes('Fotografía guardada'));
 const row=await page.evaluate(()=>mock.catalog[0]),meta=JSON.parse(row.notas);assert.equal(row.modelo,'iPhone X');assert.equal(row.creado_por,A);assert.equal(row.ancho,1);assert.equal(meta.validation,'unverified');assert.equal(meta.revision,'QA-NOT-REAL');assert.equal(meta.originalSHA256,require('node:crypto').createHash('sha256').update(Buffer.from(PNG,'base64')).digest('hex'));const call=await page.evaluate(()=>mock.storageCalls[0]);assert.equal(call.options.upsert,false);assert(call.path.startsWith('ai-board/'+A+'/'));assert.equal(await page.evaluate(()=>mock.calls.filter(c=>c.name).length),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.close();
});
test('confirmed absent photo record cleans up only its new object; uncertain record keeps it',async()=>{
 for(const uncertain of [false,true]){const {page,errors}=await setup();await catalogForm(page);await page.locator('#ab-catalog-consent').check();await page.evaluate(v=>{mock.catalogInsertError=true;mock.catalogReadError=v;},uncertain);await page.locator('#ab-catalog-upload').click();await page.waitForFunction(()=>document.getElementById('ab-catalog-status').textContent.includes('No se confirmó')&&!document.getElementById('ab-catalog-upload').disabled);const calls=await page.evaluate(()=>mock.storageCalls);assert.equal(calls.filter(c=>c.op==='remove').length,uncertain?0:1);if(!uncertain)assert.deepEqual(calls.find(c=>c.op==='remove').paths,[calls.find(c=>c.op==='upload').path]);assert.equal(await page.locator('#ab-catalog-file').evaluate(n=>n.files.length),1);assert.deepEqual(errors,[]);await page.close();}
});
test('model with real photos opens them alone, follows face A/B and falls back to the illustration',async()=>{
 const {page,errors}=await setup(390);
 await page.evaluate(({A})=>{const r=(id,modelo,cara)=>({id,marca:'Apple',modelo,cara,titulo:'REFOX BITMAP · '+modelo,foto_path:'ai-board/'+A+'/'+id+'.png',peso_bytes:70,ancho:1,alto:1,notas:'{}'});mock.catalog=[r('11111111-1111-4111-8111-111111111111','iPhone 12','A'),r('22222222-2222-4222-8222-222222222222','iPhone 12','B'),r('33333333-3333-4333-8333-333333333333','iPhone 11','A')];},{A});
await page.locator('#ab-model').selectOption('iPhone 12');
 await page.waitForFunction(()=>/Cara A/.test(document.getElementById('ab-details').textContent));
 assert.equal(await page.locator('#ab-side').isDisabled(),false);
 await page.locator('#ab-side').selectOption('bottom');
 await page.waitForFunction(()=>/Cara B/.test(document.getElementById('ab-details').textContent));
 await page.locator('#ab-model').selectOption('iPhone 11');
 await page.waitForFunction(()=>/ILUSTRACI/.test(document.querySelector('#ab-shell .ab-watermark').textContent)&&/iPhone 11/.test(document.getElementById('ab-details').textContent));
 await page.locator('#ab-side').selectOption('top');
 await page.waitForFunction(()=>/iPhone 11 · Cara A/.test(document.getElementById('ab-details').textContent));
 await page.locator('#ab-side').selectOption('bottom');
 await page.waitForFunction(()=>/ILUSTRACI/.test(document.querySelector('#ab-shell .ab-watermark').textContent));
 assert.deepEqual(errors,[]);await page.close();
});
test('REFOX preset fills the authorized source and uploads several captures at once',async()=>{
 const {page,errors}=await setup(390);await page.locator('#ab-model').selectOption('iPhone X');await page.locator('#ab-catalog summary').click();
 await page.locator('#ab-catalog-refox').click();assert.equal(await page.locator('#ab-catalog-consent').isChecked(),true);
 await page.locator('#ab-catalog-file').setInputFiles([{name:'cara-a.png',mimeType:'image/png',buffer:Buffer.from(PNG,'base64')},{name:'zona-carga.png',mimeType:'image/png',buffer:Buffer.from(PNG,'base64')}]);
 await page.locator('#ab-catalog-upload').click();
 await page.waitForFunction(()=>/2 de 2 capturas guardadas/.test(document.getElementById('ab-catalog-status').textContent)||mock.catalog.length===2);
 const rows=await page.evaluate(()=>mock.catalog);assert.equal(rows.length,2);
 for(const r of rows){const m=JSON.parse(r.notas);assert.match(m.source.license,/REFOX/);assert.match(r.titulo,/REFOX BITMAP · iPhone X · (cara-a|zona-carga)/);}
 assert.deepEqual(errors,[]);await page.close();
});
test('short finder: mark a component on the line, light it up and save the culprit',async()=>{
 const {page,errors}=await setup(1200);
 page.on('dialog',d=>d.type()==='prompt'?d.accept('c4321'):d.accept());
 await page.evaluate(({A})=>{mock.catalog=[{id:'11111111-1111-4111-8111-111111111111',marca:'Apple',modelo:'iPhone 12',cara:'A',titulo:'REFOX BITMAP · iPhone 12',foto_path:'ai-board/'+A+'/a.png',peso_bytes:70,ancho:1,alto:1,notas:'{}'}];},{A});
 await page.locator('#ab-model').selectOption('iPhone 12');
 await page.waitForFunction(()=>window.BayolCortos.estado().mapa==='11111111-1111-4111-8111-111111111111');
 await page.locator('#ab-cortos-red').fill('pp vdd main');await page.locator('#ab-cortos-buscar').click();
 await page.waitForFunction(()=>/Todavía nadie/.test(document.getElementById('ab-cortos-lista').textContent));
 assert.equal(await page.locator('#ab-cortos-red').inputValue(),'PP_VDD_MAIN');
 await page.locator('#ab-cortos-marcar-box summary').click();await page.locator('#ab-cortos-marcar').check();
 await page.locator('#ab-stage-view').scrollIntoViewIfNeeded();const b=await page.locator('#ab-stage-view').boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
 await page.waitForFunction(()=>window.BayolCortos.estado().puntos===1);
 const row=await page.evaluate(()=>mock.t.placas_puntos[0]);assert.equal(row.nombre,'C4321');assert.deepEqual(row.redes,['PP_VDD_MAIN']);assert.ok(row.x>0.3&&row.x<0.7&&row.y>0.3&&row.y<0.7);
 assert.equal(await page.locator('#ab-cortos-capa .abc-p.on').count(),1);
 await page.waitForFunction(()=>/C4321/.test(document.getElementById('ab-cortos-lista').textContent));
 await page.locator('#ab-cortos-lista .abc-culpable').click();
 await page.waitForFunction(()=>/C4321 \(1 vez\)/.test(document.getElementById('ab-cortos-top').textContent));
 const c=await page.evaluate(()=>mock.t.placas_cortos[0]);assert.equal(c.modelo,'iPhone 12');assert.equal(c.red,'PP_VDD_MAIN');assert.equal(c.componente,'C4321');
 assert.equal(await page.locator('#ab-cortos-capa .abc-p.mal').count(),1);
 // Un toque cerca de la marca la selecciona en vez de crear otra
 await page.mouse.click(b.x+b.width/2+3,b.y+b.height/2+3);await page.waitForFunction(()=>/C4321 · líneas: PP_VDD_MAIN/.test(document.getElementById('ab-cortos-sel').textContent));
 assert.equal(await page.evaluate(()=>mock.t.placas_puntos.length),1);
 await page.locator('#ab-model').selectOption('iPhone 11');assert.equal(await page.evaluate(()=>window.BayolCortos.estado().puntos),0);
 assert.deepEqual(errors,[]);await page.close();
});
