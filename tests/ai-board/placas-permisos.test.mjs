// Prueba la migración 20261010000000_placas_solo_dueno.sql en una base local (PGlite), sin tocar producción.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.AI_BOARD_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',ADM='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',N='33333333-3333-4333-8333-333333333333';
const M='44444444-4444-4444-8444-444444444444';
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to anon,authenticated,service_role; grant execute on function auth.uid() to public;
create function public.app_puede_diagnostico() returns boolean language sql stable as $$ select auth.uid() in ('${A}'::uuid,'${B}'::uuid,'${ADM}'::uuid) $$;
create function public.app_is_admin() returns boolean language sql stable as $$ select auth.uid()='${ADM}'::uuid $$;
create schema storage; grant usage on schema storage to authenticated;
create table storage.objects(bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
grant execute on function storage.foldername(text) to authenticated;
alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
`);
await db.exec((await readFile(new URL('../../supabase/migrations/20261009000000_placas_mapas.sql',import.meta.url),'utf8')).split('-- Fotos:')[0]);
await db.exec(await readFile(new URL('../../supabase/ai-board/catalog_access.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../../supabase/migrations/20261010000000_placas_solo_dueno.sql',import.meta.url),'utf8'));
const as=async(u)=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${u}',false);`);
const filas=async(sql)=>(await db.query(sql)).affectedRows;
const foto=(id,u)=>`insert into public.placas_mapas(id,marca,modelo,cara,titulo,foto_path,creado_por) values('${id}','Apple','iPhone X','A','t','ai-board/${u}/x.png','${u}')`;

test('cada quien sube y edita solo lo suyo; los demás autorizados solo ven',async()=>{
 await as(A);await db.exec(foto(M,A));
 await db.exec(`insert into public.placas_puntos(mapa_id,x,y,nombre) values('${M}',0.1,0.2,'PP_VDD')`);
 await as(B);
 assert.equal((await db.query('select id from public.placas_mapas')).rows.length,1,'B ve la foto de A');
 assert.equal(await filas(`update public.placas_mapas set titulo='x' where id='${M}'`),0,'B no edita la foto de A');
 assert.equal(await filas(`delete from public.placas_mapas where id='${M}'`),0,'B no borra la foto de A');
 assert.equal(await filas(`delete from public.placas_puntos where mapa_id='${M}'`),0,'B no borra puntos de A');
 await assert.rejects(db.exec(foto('55555555-5555-4555-8555-555555555555',A)),'B no crea fotos a nombre de A');
 await as(N);assert.equal((await db.query('select id from public.placas_mapas')).rows.length,0,'sin permiso de Diagnóstico no ve nada');
 await as(ADM);assert.equal(await filas(`update public.placas_mapas set titulo='revisada' where id='${M}'`),1,'el admin corrige');
 await as(A);assert.equal(await filas(`delete from public.placas_mapas where id='${M}'`),1,'el autor borra lo suyo');
});

test('archivos: solo dentro de la carpeta ai-board/<mi id>/',async()=>{
 await as(A);await db.exec(`insert into storage.objects values('placas','ai-board/${A}/1.png')`);
 await assert.rejects(db.exec(`insert into storage.objects values('placas','ai-board/${B}/2.png')`),'A no sube en la carpeta de B');
 await assert.rejects(db.exec(`insert into storage.objects values('placas','otra/${A}/3.png')`),'fuera de ai-board no se sube');
 await as(B);
 assert.equal((await db.query(`select name from storage.objects where bucket_id='placas'`)).rows.length,1,'B ve el archivo');
 assert.equal(await filas(`delete from storage.objects where name='ai-board/${A}/1.png'`),0,'B no borra el archivo de A');
 await as(N);assert.equal((await db.query(`select name from storage.objects`)).rows.length,0,'sin permiso no ve archivos');
 await as(ADM);assert.equal(await filas(`delete from storage.objects where name='ai-board/${A}/1.png'`),1,'el admin puede borrar');
});
