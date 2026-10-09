const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium}=require(process.env.AI_BOARD_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');let browser;
const full=fs.readFileSync(path.join(root,'taller.html'),'utf8');
const A='11111111-1111-4111-8111-111111111111',C='44444444-4444-4444-8444-444444444444',S='77777777-7777-4777-8777-777777777777';
async function setup(width=1200){
 const page=await browser.newPage({viewport:{width,height:850}});page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width"><body></body>'}):r.abort());
 await page.goto('https://ai-board.test');
 await page.evaluate(html=>{
  const parsed=new DOMParser().parseFromString(html,'text/html');document.head.append(...[...parsed.head.querySelectorAll('style')].map(n=>n.cloneNode(true)));
  document.body.append(parsed.getElementById('v-diagnostico').cloneNode(true));document.getElementById('v-diagnostico').style.display='block';
 },full);
 await page.addStyleTag({content:'body{margin:10px;background:#f7f8fa} #v-diagnostico{width:100%;max-width:1200px;margin:auto}'});
 for(const f of ['diagnostico-ai-board.css','diagnostico-ai-chat.css'])await page.addStyleTag({path:path.join(root,f)});
 await page.evaluate(({A,C,S})=>{
  window.mock={user:A,calls:[],turns:[],sessions:[{id:S,owner_id:A,modelo:'iPhone X',diagnostico_id:C,created_at:'2026-10-09T12:00:00Z'}],callbacks:[],error:false};
  const state=window.mock;
  window.supabaseClient={
   auth:{getUser:async()=>({data:{user:state.user?{id:state.user}:null}}),onAuthStateChange:cb=>state.callbacks.push(cb)},
   rpc:async(name,args)=>{state.calls.push({rpc:name,args});return {data:name==='ai_board_create_case'?C:[{id:C,modelo:'iPhone X',orden_id:null}]};},
   from:name=>{
    let filters={},inserted,deleted=false;
    const q={select(){return q},eq(k,v){filters[k]=v;return q},order(){return q},limit(){return q},insert(v){inserted=v;return q},delete(){deleted=true;return q},single(){return q},then(resolve){
     let data;
     if(name==='ai_board_sessions'){
      if(deleted){data=state.sessions.filter(s=>s.id===filters.id);state.sessions=state.sessions.filter(s=>s.id!==filters.id);state.turns=[];}
      else if(inserted){data={id:S,...inserted,created_at:'2026-10-09T12:00:00Z'};state.sessions=[data];}
      else {data=state.sessions.filter(s=>Object.entries(filters).every(([k,v])=>s[k]===v));if(filters.id)data=data[0];}
     }else data=[...state.turns].reverse();
     return Promise.resolve({data,error:null}).then(resolve);
    }};return q;
   },
   functions:{invoke:async(name,{body})=>{
    state.calls.push({name,body});if(state.deferred)await new Promise(r=>state.resolve=r);
    if(state.error)return {error:{context:new Response(JSON.stringify({error:'Error simulado'}),{status:502})}};
    state.turns.push({user_message:body.message,assistant_message:'EVIDENCIA: medición reportada. PRÓXIMA PRUEBA: confirmar condiciones.',status:'completed'});
    return {data:{ok:true,persisted:true,answer:state.turns.at(-1).assistant_message}};
   }}
  };
 },{A,C,S});
 for(const f of ['diagnostico-board-data.js','diagnostico-ai-board.js','diagnostico-ai-chat.js'])await page.addScriptTag({path:path.join(root,f)});
 return {page,errors};
}
async function openChat(page){
 await page.locator('[data-ab-tab="ia"]').click();await page.waitForFunction(()=>document.getElementById('ab-chat-case').options.length>1);
 await page.locator('#ab-chat-case').selectOption(C);await page.waitForFunction(()=>document.getElementById('ab-chat-session').options.length>1);
 await page.locator('#ab-chat-session').selectOption(S);await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Historial guardado'));
 assert.equal(await page.locator('#ab-model').inputValue(),'iPhone X');
}
test.before(async()=>{browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.AI_BOARD_CHROMIUM_PATH?{executablePath:process.env.AI_BOARD_CHROMIUM_PATH}:{})});});
test.after(async()=>browser?.close());
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
test('mobile has no horizontal overflow; local photo cleared on model change; corrupt image rejected',async()=>{
 const {page,errors}=await setup(390);const dialog=[];page.on('dialog',async d=>{dialog.push(d.message());await d.dismiss();});
 await page.locator('#ab-file').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS9sAAAAASUVORK5CYII=','base64')});
 await page.waitForFunction(()=>!!document.querySelector('#ab-target img'));await page.locator('#ab-model').selectOption('iPhone X');assert.equal(await page.locator('#ab-target img').count(),0);
 await page.locator('#ab-file').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.waitForFunction(()=>document.getElementById('ab-file').value==='');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:path.join(process.env.AI_BOARD_SCREENSHOT_DIR||require('node:os').tmpdir(),'ai-board-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);await page.close();
});
test('boardview model/provenance validation, component selection and net search',async()=>{
 const {page}=await setup();const board={schema:'bayol-boardview/1',model:'iPhone X',revision:'TEST-FIXTURE-NOT-REAL',source:{title:'Synthetic QA fixture',license:'Test only',reference:'Internal test'},width:100,height:100,components:[{ref:'QA1',side:'top',x:10,y:10,width:20,height:20,pins:[{id:'1',x:1,y:1,net:'QA_NET'}]}]};
 await page.locator('#ab-model').selectOption('iPhone X');await page.locator('#ab-board-file').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(board))});await page.waitForFunction(()=>!!document.querySelector('[data-ref="QA1"]'));
 await page.locator('[data-ref="QA1"] rect').click();assert((await page.locator('#ab-selection').innerText()).includes('QA_NET'));
 await page.locator('#ab-board-search').fill('QA_NET');assert((await page.locator('#ab-coverage').innerText()).includes('pendiente'));
 await page.locator('#ab-model').selectOption('iPhone XR');assert.equal(await page.locator('[data-ref]').count(),0);await page.close();
});

test('minimal case and conversation creation; owner can delete persisted history',async()=>{
 const {page,errors}=await setup();await page.locator('[data-ab-tab="ia"]').click();await page.waitForFunction(()=>document.getElementById('ab-chat-case').options.length>1);
 await page.locator('#ab-chat-create-case').click();await page.waitForFunction(()=>document.getElementById('ab-chat-case').value=== '44444444-4444-4444-8444-444444444444'&&!document.getElementById('ab-chat-new').disabled);
 assert.equal(await page.evaluate(()=>mock.calls.find(c=>c.rpc==='ai_board_create_case').args.p_model),'iPhone 13 Pro Max');
 await page.locator('#ab-chat-new').click();await page.waitForFunction(()=>document.getElementById('ab-chat-history-state').textContent.includes('Conversación guardada'));
 page.on('dialog',d=>d.accept());await page.locator('#ab-chat-delete').click();await page.waitForFunction(()=>mock.sessions.length===0&&!document.getElementById('ab-chat-reload').disabled);
 assert.equal(await page.locator('#ab-chat-feed .ab-bubble').count(),0);assert.deepEqual(errors,[]);await page.close();
});
