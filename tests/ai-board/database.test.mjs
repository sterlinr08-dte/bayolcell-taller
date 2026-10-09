import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const packageName=process.env.AI_BOARD_PGLITE_MODULE||'@electric-sql/pglite';
const {PGlite}=await import(packageName);
const db=new PGlite();
const R='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',T='33333333-3333-4333-8333-333333333333',C='44444444-4444-4444-8444-444444444444',D='55555555-5555-4555-8555-555555555555',O='66666666-6666-4666-8666-666666666666',S='77777777-7777-4777-8777-777777777777',SB='88888888-8888-4888-8888-888888888888',Q='99999999-9999-4999-8999-999999999999';
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to public;
create table public.auth_actor_bindings(auth_user_id uuid primary key, actor_type text,actor_ref_id uuid,activo boolean, permitted boolean);
create function public.app_actor_identity() returns table(actor_type text,actor_ref_id uuid) language sql stable security definer as $$ select actor_type,actor_ref_id from public.auth_actor_bindings where auth_user_id=auth.uid() and activo $$;
create function public.app_puede_diagnostico() returns boolean language sql stable security definer as $$ select coalesce((select permitted and activo from public.auth_actor_bindings where auth_user_id=auth.uid()),false) $$;
create function public.app_is_admin() returns boolean language sql stable as $$ select auth.uid() in ('${A}'::uuid,'${R}'::uuid) $$;
create table public.ordenes_reparacion(id uuid primary key,tecnico_asignado_id uuid,tecnico_principal_id uuid);
create table public.diagnosticos(id uuid primary key default gen_random_uuid(),creado_por uuid,orden_id uuid,modelo text,created_at timestamptz default now());
alter table public.diagnosticos enable row level security;alter table public.ordenes_reparacion enable row level security;
create policy legacy_diagnosticos on public.diagnosticos for all to authenticated using(public.app_puede_diagnostico());
create policy legacy_ordenes on public.ordenes_reparacion for all to authenticated using(public.app_puede_diagnostico());
grant select on public.diagnosticos,public.ordenes_reparacion to authenticated;
insert into auth.users values('${A}'),('${B}'),('${R}');
insert into public.auth_actor_bindings values('${A}','usuario','${A}',true,true),('${B}','tecnico','${T}',true,true),('${R}','usuario','${R}',true,true);
insert into public.ordenes_reparacion values('${O}','${T}',null);
insert into public.diagnosticos(id,creado_por,orden_id,modelo) values('${C}','${A}',null,'iPhone X'),('${D}','${A}','${O}','iPhone XR');
`);
await db.exec(await readFile(new URL('../../supabase/ai-board/schema.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../../supabase/ai-board/library.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../../supabase/ai-board/maintenance.sql',import.meta.url),'utf8'));
// Actual upstream photo tables/policies, without installing Storage in PGlite.
await db.exec((await readFile(new URL('../../supabase/migrations/20261009000000_placas_mapas.sql',import.meta.url),'utf8')).split('-- Fotos:')[0]);
await db.exec('grant all on public.placas_mapas,public.placas_puntos to anon,authenticated;');
await db.exec(await readFile(new URL('../../supabase/ai-board/catalog_access.sql',import.meta.url),'utf8'));
const as=async(role,user='')=>db.exec(`reset role;set role ${role};select set_config('request.jwt.claim.sub','${user}',false);`);
const scalar=async(sql)=>(await db.query(sql)).rows[0];
const deny=async(sql)=>assert.rejects(db.exec(sql));
test('owner can create session only for authorized case and matching model',async()=>{
 await as('authenticated',A);await db.exec(`insert into ai_board_sessions(id,owner_id,diagnostico_id,modelo) values('${S}','${A}','${C}','iPhone X')`);
 await deny(`insert into ai_board_sessions(owner_id,diagnostico_id,modelo) values('${B}','${C}','iPhone X')`);
 await deny(`insert into ai_board_sessions(owner_id,diagnostico_id,modelo) values('${A}','${C}','iPhone XR')`);
 assert.equal((await scalar('select count(*)::int as n from ai_board_sessions')).n,1);
});
test('other technician cannot see or reserve owner history despite broad legacy case RLS',async()=>{
 await as('authenticated',B);assert.equal((await scalar('select count(*)::int as n from diagnosticos')).n,2);
 assert.equal((await scalar('select count(*)::int as n from ai_board_sessions')).n,0);
 await deny(`select ai_board_reserve('${S}','${Q}','consulta')`);
 await deny(`insert into ai_board_sessions(owner_id,diagnostico_id,modelo) values('${B}','${C}','iPhone X')`);
 await db.exec(`insert into ai_board_sessions(id,owner_id,diagnostico_id,modelo) values('${SB}','${B}','${D}','iPhone XR')`);
});
test('assignment removal revokes access to already created technician session',async()=>{
 await as('postgres');await db.exec('update ordenes_reparacion set tecnico_asignado_id=null');
 await as('authenticated',B);assert.equal((await scalar('select count(*)::int as n from ai_board_sessions')).n,0);
 await deny(`select ai_board_reserve('${SB}','${Q}','consulta')`);
});
test('reservation is atomic/idempotent and clients cannot forge assistant messages',async()=>{
 await as('authenticated',A);
 const first=(await scalar(`select ai_board_reserve('${S}','${Q}','consulta') as data`)).data;assert.equal(first.fresh,true);
 const retry=(await scalar(`select ai_board_reserve('${S}','${Q}','consulta') as data`)).data;assert.equal(retry.fresh,false);assert.equal(retry.turn.id,first.turn.id);
 await deny(`select ai_board_reserve('${S}','${Q}','otro contenido')`);
 await deny(`insert into ai_board_turns(session_id,request_id,user_message,assistant_message,status) values('${S}','${Q}','falso','falso','completed')`);
 await deny(`update ai_board_turns set assistant_message='falso'`);
 await deny(`select ai_board_finish('${first.turn.id}','${A}','falso')`);
 await as('service_role');assert.equal((await scalar(`select ai_board_finish('${first.turn.id}','${A}','respuesta') as ok`)).ok,true);
 assert.equal((await scalar(`select ai_board_finish('${first.turn.id}','${A}','reemplazo') as ok`)).ok,false);
 await as('authenticated',A);assert.equal((await scalar('select assistant_message from ai_board_turns')).assistant_message,'respuesta');
});
test('quota enforced in database across sessions and retries do not consume another quota',async()=>{
 await as('postgres');await db.exec(`update ai_board_limits set day_count=80 where owner_id='${A}'`);
 await as('authenticated',A);
 await deny(`select ai_board_reserve('${S}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','consulta nueva')`);
 assert.equal((await scalar(`select ai_board_reserve('${S}','${Q}','consulta') as data`)).data.fresh,false);
});
test('minimal case creation binds Auth owner without an AI call and rejects out-of-catalog models',async()=>{
 await as('authenticated',A);
 const row=await scalar("select ai_board_create_case('iPhone X') as id");
 assert.equal((await scalar(`select creado_por from diagnosticos where id='${row.id}'`)).creado_por,A);
 await deny("select ai_board_create_case('iPhone 6')");
});
test('inactive binding removes owner access; anon cannot read, reserve or finish',async()=>{
 await as('postgres');await db.exec(`update auth_actor_bindings set activo=false where auth_user_id='${A}'`);
 await as('authenticated',A);assert.equal((await scalar('select count(*)::int as n from ai_board_sessions')).n,0);
 await deny(`select ai_board_reserve('${S}','${Q}','consulta')`);
 await as('anon');await deny('select * from ai_board_sessions');await deny('select * from ai_board_turns');await deny(`select ai_board_reserve('${S}','${Q}','consulta')`);await deny(`select ai_board_finish('${Q}','${A}','falso')`);
});


test('technical library forbids self-approval and forged reviews; independent review publishes and withdrawal hides entry',async()=>{
 await as('postgres');await db.exec(`update auth_actor_bindings set activo=true where auth_user_id='${A}'`);
 await as('authenticated',A);
 const sources=JSON.stringify([{title:'Synthetic QA reference, not a repair fact',url:'https://support.apple.com/'}]);
 const item=(await db.query(`select ai_board_library_submit($1,'QA-TEST','Synthetic repair proposal for QA only','Final measurements and conditions are synthetic QA only',$2::jsonb) as id`,[C,sources])).rows[0].id;
 await deny(`select ai_board_library_review('${item}','approved','I cannot approve my own repair proposal')`);
 await deny(`update ai_board_library set status='approved'`);
 await as('authenticated',B);assert.equal((await scalar('select count(*)::int as n from ai_board_library')).n,0);
 await deny(`select ai_board_library_review('${item}','approved','Not an authorized independent reviewer')`);
 await as('authenticated',R);assert.equal((await scalar(`select ai_board_library_review('${item}','approved','Independent synthetic QA review, no hardware validation asserted') as ok`)).ok,true);
 await as('authenticated',B);assert.equal((await scalar('select count(*)::int as n from ai_board_library')).n,1);
 await as('authenticated',A);assert.equal((await scalar(`select ai_board_library_review('${item}','withdrawn','Retracted synthetic entry for QA testing only') as ok`)).ok,true);
 assert.equal((await scalar('select count(*)::int as n from ai_board_library_reviews')).n,2);
 await as('authenticated',B);assert.equal((await scalar('select count(*)::int as n from ai_board_library')).n,0);
});
test('library rejects missing/unsafe sources and unauthorized case before storing any proposal',async()=>{
 await as('authenticated',A);
 for(const sources of ['[{}]','[{"title":"QA","url":"javascript:bad()"}]','[{"title":"QA","url":"https://support.apple.com/","imei":"123"}]'])
 await assert.rejects(db.query(`select ai_board_library_submit($1,'QA','Synthetic test summary long enough','Synthetic test evidence long enough',$2::jsonb)`,[C,sources]));
 await as('anon');await deny('select * from ai_board_library');await deny(`select ai_board_library_review('${C}','approved','Anonymous cannot approve an entry')`);
});
test('retention is restricted to admin; purge requires server role and preserves active older sessions',async()=>{
 const recent='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',pending='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 await as('postgres');await db.exec(`update ai_board_sessions set created_at=now()-interval '200 days' where id='${S}';update ai_board_turns set created_at=now()-interval '200 days' where session_id='${S}';
 insert into ai_board_sessions(id,owner_id,diagnostico_id,modelo,created_at) values('${recent}','${A}','${C}','iPhone X',now()-interval '200 days');
 insert into ai_board_turns(session_id,request_id,user_message,status,created_at) values('${recent}','${pending}','recent active conversation','pending',now()-interval '5 minutes');`);
 await as('authenticated',B);await deny('select ai_board_set_retention(180)');await deny('select ai_board_purge_history()');
 await as('authenticated',A);assert.equal((await scalar('select ai_board_set_retention(180) as ok')).ok,true);await deny('select ai_board_set_retention(1)');
 await as('service_role');assert.equal((await scalar('select ai_board_purge_history() as n')).n,1);
 assert.equal((await scalar(`select count(*)::int as n from ai_board_sessions where id='${recent}'`)).n,1);
 assert.equal((await scalar(`select status from ai_board_turns where request_id='${pending}'`)).status,'failed');
});
test('endpoint persists a multi-turn conversation through actual SQL/RLS and denies another user',async()=>{
 const {createHandler}=await import('../../supabase/functions/ai-board-chat/core.mjs');
 const id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';let providerCalls=0,lastMessages;
 await as('postgres');await db.exec(`update ai_board_limits set day_count=0,minute_count=0;insert into ai_board_sessions(id,owner_id,diagnostico_id,modelo) values('${id}','${A}','${C}','iPhone X')`);
 const env=n=>({SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',ANTHROPIC_API_KEY:'mock'})[n];
 const fetchImpl=async(url,opts={})=>{
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
  const token=opts.headers.Authorization;
  if(url.endsWith('/auth/v1/user'))return response({id:token==='Bearer user-b'?B:A});
  if(url.includes('api.anthropic.com')){providerCalls++;lastMessages=JSON.parse(opts.body).messages;return response({content:[{type:'text',text:'Synthetic QA answer '+providerCalls}]});}
  await as(token==='Bearer service'?'service_role':'authenticated',token==='Bearer user-b'?B:A);
  const parsed=new URL(url),body=JSON.parse(opts.body||'{}');
  try{
   if(url.endsWith('app_puede_diagnostico'))return response((await scalar('select app_puede_diagnostico() as ok')).ok);
   if(url.endsWith('ai_board_reserve'))return response((await db.query('select ai_board_reserve($1,$2,$3,$4::jsonb) as data',[body.p_session,body.p_request,body.p_message,JSON.stringify(body.p_context)])).rows[0].data);
   if(url.endsWith('ai_board_finish'))return response((await db.query('select ai_board_finish($1,$2,$3) as ok',[body.p_turn,body.p_owner,body.p_answer])).rows[0].ok);
   if(parsed.pathname.endsWith('ai_board_sessions'))return response((await db.query('select id,modelo from ai_board_sessions where id=$1',[parsed.searchParams.get('id').slice(3)])).rows);
   if(parsed.pathname.endsWith('ai_board_turns'))return response((await db.query("select user_message,assistant_message,context from ai_board_turns where session_id=$1 and status='completed' order by created_at desc,id desc limit 7",[parsed.searchParams.get('session_id').slice(3)])).rows);
   throw Error('Unexpected endpoint');
  }catch(e){return response({message:e.message},400);}
 };
 const handler=createHandler({env,fetchImpl});
 const request=(requestId,user='user-a')=>new Request('https://endpoint.test',{method:'POST',headers:{authorization:'Bearer '+user,'content-type':'application/json'},body:JSON.stringify({session_id:id,request_id:requestId,message:'Synthetic technical QA question',context:{consumo:'0.08 A'},consent:true})});
 const first='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',second='ffffffff-ffff-4fff-8fff-ffffffffffff';
 assert.equal((await handler(request(first))).status,200);assert.equal((await handler(request(second))).status,200);
 assert.equal(lastMessages.length,3);assert(lastMessages[0].content.includes('0.08 A'));assert.equal(lastMessages[1].content,'Synthetic QA answer 1');
 assert.equal((await handler(request(second))).status,200);assert.equal(providerCalls,2);
 assert.equal((await handler(request(first,'user-b'))).status,403);assert.equal(providerCalls,2);
 await as('authenticated',A);assert.equal((await db.query('select * from ai_board_turns where session_id=$1',[id])).rows.length,2);
});
test('photo catalog client grants exclude TRUNCATE/REFERENCES/TRIGGER and all anonymous access',async()=>{
 await as('postgres');
 for(const table of ['placas_mapas','placas_puntos'])for(const privilege of ['TRUNCATE','REFERENCES','TRIGGER'])assert.equal((await scalar(`select has_table_privilege('authenticated','public.${table}','${privilege}') as allowed`)).allowed,false);
 await as('anon');await deny('select * from public.placas_mapas');await deny('truncate public.placas_mapas cascade');
 await as('authenticated',A);await deny('truncate public.placas_mapas cascade');
});
test('existing diagnostic policy allows photo registration and rejects an inactive actor',async()=>{
 await as('authenticated',A);const row=await scalar(`insert into public.placas_mapas(modelo,titulo,creado_por) values('iPhone X','Synthetic QA photo','${A}') returning id`);assert(row.id);
 await as('postgres');await db.exec(`update auth_actor_bindings set activo=false where auth_user_id='${A}'`);
 await as('authenticated',A);assert.equal((await scalar('select count(*)::int as n from public.placas_mapas')).n,0);await deny(`insert into public.placas_mapas(modelo) values('iPhone X')`);
 await as('postgres');await db.exec(`update auth_actor_bindings set activo=true where auth_user_id='${A}'`);
});
test.after(async()=>db.close());
