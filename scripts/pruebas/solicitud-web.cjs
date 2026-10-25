const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let fallos=0;
 for (const W of [390,1280]) {
  const p=await b.newPage({viewport:{width:W,height:W<500?844:900},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const llamadas=[];const dialogos=[];p.on('dialog',d=>{dialogos.push(d.message());d.accept()});let envios=0;
  await p.route(/functions\/v1\/whatsapp-flow-financiamiento/,async r=>{const body=JSON.parse(r.request().postData()||'{}');llamadas.push(body);
    if(body.accion==='web_leer'){ if(body.t==='malo') return r.fulfill({status:404,contentType:'application/json',body:JSON.stringify({ok:false,error:'Este enlace venció.'})});
      return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,numero:231,equipo:'iPhone 13 128GB',precio:'RD$ 38,500.00',empleado:'Loribel Ventura',sucursal:'Santiago',nombre:'Esterlin Espinal',telefono:'8297173291',provincias:['Santiago','Espaillat','Valverde']})});}
    if(body.accion==='web_enviar'){envios++; if(envios===1) return r.abort('failed');} // auditoría S04: la 1.ª vez se cae la red
    if(body.accion==='web_enviar') return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,numero:231,aviso:true})});
    r.fulfill({status:400,body:'{}'});});
  await p.goto('file://' + require('path').resolve(__dirname, '../../solicitud.html') + '?t='+'a'.repeat(48));await p.waitForTimeout(600);
  const r={};
  r.hola=await p.textContent('#hola'); r.equipo=await p.textContent('#vEquipo'); r.sub=await p.textContent('#sub');
  await p.click('#sig');await p.waitForTimeout(600);await p.type('#ced','00000000000',{delay:5});await p.waitForTimeout(500);r.cedCeros=await p.isDisabled('#sig');r.cedCerosTxt=await p.textContent('#eCed');await p.fill('#ced','');await p.type('#ced','00112345678',{delay:5});await p.waitForTimeout(900);
  r.nomPre=await p.inputValue('#nom'); await p.click('#sig');await p.waitForTimeout(600);
  r.telPre=await p.inputValue('#tel'); await p.click('#sig');await p.waitForTimeout(600);
  await p.click('.chip[data-v="12"]');await p.waitForTimeout(1100);
  r.provs=await p.$$eval('#prov option',o=>o.length);
  await p.selectOption('#prov','Santiago');await p.type('#mun','Santiago');await p.type('#sec','Los Jardines');await p.type('#cal','Calle 5');await p.type('#cas','12');await p.click('#sig');await p.waitForTimeout(600);
  r.filas=await p.$$eval('#rec .r',x=>x.length); r.btnAntes=await p.isDisabled('#sig');
  // Auditoría S15: «Cambiar» el celular y volver directo al resumen
  await p.click('#rec [data-go="3"]');await p.waitForTimeout(500);r.btnEditar=await p.textContent('#sig');await p.click('#sig');await p.waitForTimeout(600);r.volvioResumen=await p.$$eval('#rec .r',x=>x.length);
  r.cambiarAlto=await p.$eval('#rec [data-go]',e=>Math.round(e.getBoundingClientRect().height));
  await p.check('#perm');await p.click('#sig');await p.waitForTimeout(900);r.trasCaida=await p.textContent('#sig');r.trasCaidaActivo=!(await p.isDisabled('#sig'));r.aviso=dialogos[0]||'';await p.click('#sig');await p.waitForTimeout(900);
  r.listo=await p.textContent('#listoTit'); r.sub2=await p.textContent('#listoSub');
  const env=llamadas.find(x=>x.accion==='web_enviar'); r.envio=env?{t:env.t.length,permiso:env.permiso,ced:env.datos.cedula,tel:env.datos.telefono,plazo:env.datos.plazo,prov:env.datos.provincia}:null;
  const m=await p.evaluate(()=>{const b=[...document.querySelectorAll('.pie .btn')].filter(e=>e.offsetParent!==null).map(e=>Math.round(e.getBoundingClientRect().height));return {btnMin:Math.min(...b),font:parseFloat(getComputedStyle(document.querySelector('#ced')).fontSize),sw:document.documentElement.scrollWidth}});
  Object.assign(r,m);
  // enlace malo
  await p.goto('file://' + require('path').resolve(__dirname, '../../solicitud.html') + '?t=malo');await p.waitForTimeout(600);
  r.errorPant=await p.evaluate(()=>document.querySelector('.p.on h2').textContent+' | '+document.querySelector('#errTxt').textContent);
  const ok=errs.length===0&&r.cedCeros===true&&/no es válido/.test(r.cedCerosTxt)&&/Guardar y volver/.test(r.btnEditar)&&r.volvioResumen===7&&r.cambiarAlto>=44&&r.trasCaida==='Enviar solicitud'&&r.trasCaidaActivo&&/conexión/.test(r.aviso)&&/Esterlin/.test(r.hola)&&/Loribel/.test(r.hola)&&r.equipo==='iPhone 13 128GB'&&/Santiago/.test(r.sub)&&r.nomPre==='Esterlin Espinal'&&r.telPre==='829-717-3291'&&r.provs===4&&r.filas===7&&r.btnAntes===true&&/Esterlin/.test(r.listo)&&/No\. 231/.test(r.sub2)&&r.envio&&r.envio.t===48&&r.envio.permiso===true&&r.envio.ced==='001-1234567-8'&&r.envio.plazo==='12'&&r.btnMin>=54&&r.font>=16&&r.sw<=W&&/no sirve/.test(r.errorPant)&&/venció/.test(r.errorPant)&&errs.length===0;
  if(!ok)fallos++; console.log(W, ok?'OK':'FALLO', JSON.stringify(r), 'errores', errs); await p.close(); }
 await b.close(); process.exit(fallos?1:0);})();
