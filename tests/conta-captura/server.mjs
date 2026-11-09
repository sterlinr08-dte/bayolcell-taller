import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {crearDB,guardar,fila} from './db.mjs';
const db=await crearDB();
let old=fila();old.mes='2026-10-01';old.gastos[0].captura.archivos=[];
await db.query('insert into conta_equilibrio(mes,codlocalidad,gastos,variables,dias_habiles) values($1,1,$2,$3,27)',[old.mes,JSON.stringify(old.gastos),'{}']);
await db.exec('set role authenticated');
const taller=fs.readFileSync('taller.html','utf8');
const styles=[...taller.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const links=[...taller.matchAll(/<link\b[^>]*href="([^"?]+\.css)[^"]*"[^>]*>/g)].map(m=>m[1]).filter(s=>!s.includes('://')&&!s.includes('conta-captura'));
const fixture=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture-styles.css">${links.map(h=>`<link rel="stylesheet" href="/${h}">`).join('')}<link rel="stylesheet" href="/conta-captura.css"><style>body{display:block!important;margin:0!important;padding:24px!important;background:#edf1f6!important;color:#0f172a!important;font-family:system-ui!important}#v-contabilidad{display:block!important;max-width:1400px;margin:auto}.btn{min-height:44px;padding:8px 16px;border:1px solid #d9dfe7;border-radius:12px;background:white;cursor:pointer}.btn-blue{background:#e4572e;color:white}*{box-sizing:border-box}</style></head><body><div id="v-contabilidad" class="active"><div><button id="contaTabMensual">Estado mensual</button></div><div id="conta-mensual"></div></div><div id="aviso" role="status"></div><script>
window.testPermiso=true;window.sessionUser={nombre:'Asistente de prueba'};window.confirmar=async()=>true;window.toast=(s)=>{document.getElementById('aviso').textContent=s};window.contaTab=()=>{};window.isAdminUser=()=>window.testPermiso;window.esDueno=()=>false;window.tienePermiso=()=>false;
async function enviar(url,data){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});return r.json()}
window.supabaseClient={from(tab){return {select(){return {async eq(k,v){return enviar('/leer',{tab,mes:v})},like(){return {gte(){return {async lt(){return {data:[]}}}}}}}}}},async rpc(name,args){if(name==='conta_equilibrio_guardar_captura')return enviar('/guardar',args);if(name==='estado_mensual_cat')return {data:[{venta:100000,costo:60000}]};return {data:[]}},storage:{from(){return {async upload(ruta,file){await new Promise(r=>setTimeout(r,300));return enviar('/upload',{ruta})},async createSignedUrl(){return {data:{signedUrl:'https://example.invalid/comprobante.pdf'}}}}}}};
</script><script src="/conta-base.js"></script><script src="/conta-captura.js"></script><script src="/conta-equilibrio.js"></script><script>addEventListener('DOMContentLoaded',()=>contaTab('equilibrio'));</script></body></html>`;
const server=http.createServer(async(req,res)=>{try{if(req.method==='POST'){let body='';for await(const x of req)body+=x;const p=JSON.parse(body);let data;
if(req.url==='/reset'){await db.query("delete from conta_equilibrio where mes='2026-11-01'");data={data:true};}
else if(req.url==='/leer')data={data:(await db.query('select * from conta_equilibrio where mes=$1',[p.mes])).rows};
else if(req.url==='/guardar'){try{data={data:await guardar(db,p.p_filas,p.p_versiones)}}catch(e){data={error:{code:e.code,message:e.message}}}}
else if(req.url==='/upload'){await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['conta-comprobantes',p.ruta]);data={data:{path:p.ruta}};}
res.setHeader('content-type','application/json');res.end(JSON.stringify(data));return;}
if(req.url==='/'){res.setHeader('content-type','text/html');res.end(fixture);return;}
if(req.url==='/fixture-styles.css'){res.setHeader('content-type','text/css');res.end(styles);return;}
const pathname=new URL(req.url,'http://localhost').pathname;const file=path.resolve('.'+pathname);if(!file.startsWith(process.cwd()+'/')||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;res.end();return;}
res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(file));
}catch(e){res.statusCode=500;res.end(JSON.stringify({error:e.message}));}});
server.listen(Number(process.env.PE_QA_PORT || 8959),'127.0.0.1',()=>console.log('Captura QA http://127.0.0.1:8959'));
