import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,validate,minimize,buildMessages} from '../../supabase/functions/ai-board-chat/core.mjs';
const ID='11111111-1111-4111-8111-111111111111',RID='22222222-2222-4222-8222-222222222222';
const body={session_id:ID,request_id:RID,message:'Consumo 0.08 A. ¿Qué mido?',consent:true,context:{consumo:'0.08 A'}};
const request=(payload=body,headers={},method='POST')=>new Request('https://test.invalid/ai-board-chat',{method,headers:{authorization:'Bearer test','content-type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(payload)}:{})});
function mock(overrides={}){
 const calls=[];
 const env=n=>({SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'anon-test',SUPABASE_SERVICE_ROLE_KEY:'service-test',ANTHROPIC_API_KEY:'provider-test',AI_BOARD_ALLOWED_ORIGINS:'https://taller.test'})[n];
 const fetchImpl=async(url,options={})=>{
  calls.push({url,options});
  const respond=(data,status=200)=>new Response(JSON.stringify(data),{status});
  if(url.endsWith('/auth/v1/user'))return respond(overrides.auth||{id:ID});
  if(url.endsWith('app_puede_diagnostico'))return respond(overrides.permission??true);
  if(url.includes('ai_board_sessions?'))return respond(overrides.sessions??[{id:ID,modelo:'iPhone X'}]);
  if(url.endsWith('ai_board_reserve'))return respond(overrides.reserve??{fresh:true,turn:{id:RID}},overrides.reserveStatus??200);
  if(url.includes('ai_board_turns?'))return respond(overrides.history??[{user_message:'No enciende.',assistant_message:'Mide con condiciones seguras.'}]);
  if(url.includes('api.anthropic.com'))return respond({content:[{type:'text',text:'EVIDENCIA: 0.08 A. HIPÓTESIS: pendiente. PRÓXIMA PRUEBA: confirmar modelo.'}]},overrides.providerStatus??200);
  if(url.endsWith('ai_board_finish'))return respond(overrides.saved??true);
  throw Error('Unexpected URL');
 };
 return {calls,handler:createHandler({env,fetchImpl})};
}
test('reject unknown or oversized technical fields and missing consent',()=>{
 for(const bad of [{...body,consent:false},{...body,imei:'123'},{...body,message:'x'.repeat(1401)},{...body,context:{orden:{clave:'1234'}}}])assert.throws(()=>validate(bad));
});
test('minimize known identifiers while preserving electrical measurements',()=>{
 const s=minimize('IMEI: 123456789012345; correo test@example.com; +1 809 555 1234; consumo 0.08 A; 3.8 V');
 assert(!s.includes('123456789012345'));assert(!s.includes('test@example.com'));assert(!s.includes('555'));assert(s.includes('0.08 A'));assert(s.includes('3.8 V'));
});
test('chronological paired context ends with user and remains bounded',()=>{
 const turns=[{user_message:'nuevo',assistant_message:'r2'},{user_message:'viejo',assistant_message:'r1'}];
 const m=buildMessages(turns,'siguiente','iPhone X',{});assert.deepEqual(m.map(t=>t.role),['user','assistant','user','assistant','user']);assert.equal(JSON.parse(m[0].content).consulta,'viejo');
 assert(JSON.stringify(buildMessages(Array(100).fill({user_message:'x'.repeat(1400),assistant_message:'y'.repeat(12000)}),'next','iPhone X',{})).length<22000);
});
test('auth and permission precede provider access',async()=>{
 for(const overrides of [{permission:false},{auth:{id:ID,is_anonymous:true}},{sessions:[]}]){const m=mock(overrides);const r=await m.handler(request());assert.equal(r.status,403);assert(!m.calls.some(c=>c.url.includes('anthropic')));}
});
test('missing token / disallowed origin / unsupported method',async()=>{
 const m=mock();assert.equal((await m.handler(request(body,{authorization:''}))).status,401);
 assert.equal((await m.handler(request(body,{origin:'https://evil.test'}))).status,403);
 assert.equal((await m.handler(request(body,{},'GET'))).status,405);assert.equal(m.calls.length,0);
});
test('successful multi-turn persists before returning; no service-role model context',async()=>{
 const m=mock(),r=await m.handler(request());assert.equal(r.status,200);assert.equal((await r.json()).persisted,true);
 const provider=m.calls.find(c=>c.url.includes('anthropic'));const sent=JSON.parse(provider.options.body);assert.equal(sent.messages.length,3);assert.equal(sent.messages.at(-1).role,'user');
 const histories=m.calls.filter(c=>c.url.includes('ai_board_turns?'));assert.equal(histories[0].options.headers.Authorization,'Bearer test');
 assert.equal(m.calls.at(-1).options.headers.Authorization,'Bearer service-test');
});
test('idempotent completed request returns stored answer without provider',async()=>{
 const m=mock({reserve:{fresh:false,turn:{status:'completed',assistant_message:'Guardado'}}});const r=await m.handler(request());assert.equal((await r.json()).answer,'Guardado');assert(!m.calls.some(c=>c.url.includes('anthropic')));
});
test('pending request is not repeated',async()=>{
 const m=mock({reserve:{fresh:false,turn:{status:'pending'}}});assert.equal((await m.handler(request())).status,409);assert(!m.calls.some(c=>c.url.includes('anthropic')));
});
test('quota rejection cannot call provider',async()=>{
 const m=mock({reserve:{message:'Quota exceeded'},reserveStatus:400});assert.equal((await m.handler(request())).status,429);assert(!m.calls.some(c=>c.url.includes('anthropic')));
});
test('provider error marks pending turn failed and does not leak provider body',async()=>{
 const m=mock({providerStatus:429});const r=await m.handler(request());assert.equal(r.status,502);const finish=m.calls.at(-1);assert.equal(JSON.parse(finish.options.body).p_answer,null);assert(!(await r.text()).includes('provider-test'));
});
test('save failure is not reported as success',async()=>{const m=mock({saved:false});const r=await m.handler(request());assert.equal(r.status,503);assert.equal((await r.json()).ok,false);});
test('actual streamed input size is bounded without Content-Length',async()=>{const m=mock();assert.equal((await m.handler(request({...body,message:'x'.repeat(9000)}))).status,413);assert(!m.calls.some(c=>c.url.includes('anthropic')));});
