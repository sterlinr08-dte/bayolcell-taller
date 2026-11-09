// Ejecutar con PGLITE_MODULE=/ruta/node_modules/@electric-sql/pglite/dist/index.js.
// Base efímera; nunca usa claves ni URLs de producción.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
export async function crearDB() {
  const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    create function public.app_puede_contabilidad() returns boolean language sql stable as $$select coalesce(current_setting('test.conta',true),'true')='true'$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage to authenticated;
    grant select,insert on storage.objects to authenticated;
    select set_config('test.uid','11111111-1111-4111-8111-111111111111',false);`);
  await db.exec(fs.readFileSync('supabase/migrations/20261106000000_conta_equilibrio.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/20261109133442_equilibrio_captura_guiada.sql','utf8'));
  return db;
}
export function fila(cod=1) { return { mes:'2026-11-01',codlocalidad:cod,gastos:[{concepto:'Alquiler',monto:10000,captura:{estado:'confirmado',nota:'Recibo de prueba'}}],variables:{},dias_habiles:25,reparto:'venta',reparto_pct:{} }; }
export async function guardar(db, filas, versiones={}) {
  return (await db.query('select * from public.conta_equilibrio_guardar_captura($1,$2::jsonb,$3::jsonb)',[filas[0].mes,JSON.stringify(filas),JSON.stringify(versiones)])).rows;
}
