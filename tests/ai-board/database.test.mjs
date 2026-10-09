import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const packageName=process.env.AI_BOARD_PGLITE_MODULE||'@electric-sql/pglite';
const {PGlite}=await import(packageName);
const db=new PGlite();
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',T='33333333-3333-4333-8333-333333333333',C='44444444-4444-4444-8444-444444444444',D='55555555-5555-4555-8555-555555555555',O='66666666-6666-4666-8666-666666666666',S='77777777-7777-4777-8777-777777777777',SB='88888888-8888-4888-8888-888888888888',Q='99999999-9999-4999-8999-999999999999';
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to public;
create table public.auth_actor_bindings(auth_user_id uuid primary key, actor_type text,actor_ref_id uuid,activo boolean, permitted boolean);
create function public.app_actor_identity() returns table(actor_type text,actor_ref_id uuid) language sql stable security definer as $$ select actor_type,actor_ref_id from public.auth_actor_bindings where auth_user_id=auth.uid() and activo $$;
create function public.app_puede_diagnostico() returns boolean language sql stable security definer as $$ select coalesce((select permitted and activo from public.auth_actor_bindings where auth_user_id=auth.uid()),false) $$;
create table public.ordenes_reparacion(id uuid primary key,tecnico_asignado_id uuid,tecnico_principal_id uuid);
create table public.diagnosticos(id uuid primary key default gen_random_uuid(),creado_por uuid,orden_id uuid,modelo text,created_at timestamptz default now());
alter table public.diagnosticos enable row level security;alter table public.ordenes_reparacion enable row level security;
create policy legacy_diagnosticos on public.diagnosticos for all to authenticated using(public.app_puede_diagnostico());
create policy legacy_ordenes on public.ordenes_reparacion for all to authenticated using(public.app_puede_diagnostico());
grant select on public.diagnosticos,public.ordenes_reparacion to authenticated;
insert into auth.users values('${A}'),('${B}');
insert into public.auth_actor_bindings values('${A}','usuario','${A}',true,true),('${B}','tecnico','${T}',true,true);
insert into public.ordenes_reparacion values('${O}','${T}',null);
insert into public.diagnosticos(id,creado_por,orden_id,modelo) values('${C}','${A}',null,'iPhone X'),('${D}','${A}','${O}','iPhone XR');
`);
await db.exec(await readFile(new URL('../../supabase/ai-board/schema.sql',import.meta.url),'utf8'));
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
test.after(async()=>db.close());
