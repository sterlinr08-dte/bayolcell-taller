const { chromium } = require('playwright');
const H='file://'+__dirname+'/harness.html'; let ok=0,mal=0;
const t=(c,m)=>{c?ok++:mal++;console.log((c?'✓ ':'✗ ')+m)};
(async()=>{
 const b=await chromium.launch();
 // PC
 let p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); await p.goto(H);
 const centro=async(i)=>{const r=await p.locator('.bcf-chk').nth(i).boundingBox();return [r.x+r.width/2,r.y+r.height/2]};
 let [x,y]=await centro(0); await p.mouse.move(x,y); await p.mouse.down();
 for(const i of [1,2,3]){const [a,c]=await centro(i); await p.mouse.move(a,c,{steps:4});}
 await p.mouse.up(); await p.waitForTimeout(400);
 t(await p.evaluate(()=>_reacondSel.size)===4,'PC: arrastrar marca 4');
 t(await p.locator('.bcf-chk:checked').count()===4,'PC: 4 casillas marcadas en pantalla');
 t(await p.evaluate(()=>ABIERTOS.length)===0,'PC: no se abrió ningún equipo');
 t(await p.locator('#bcLoteBar.bclb-on').count()===1,'PC: barra visible');
 t((await p.textContent('#bclbN'))==='4','PC: barra dice 4');
 t((await p.textContent('#reacondSelCount')).startsWith('4'),'PC: contador de arriba también dice 4');
 // saltar: de 5 a 9 directo -> rellena
 [x,y]=await centro(5); await p.mouse.move(x,y); await p.mouse.down(); [x,y]=await centro(9); await p.mouse.move(x,y); await p.mouse.up(); await p.waitForTimeout(400);
 t(await p.evaluate(()=>[5,6,7,8,9].every(i=>_reacondSel.has('eq'+(i+1)))),'PC: saltar tarjetas rellena las del medio (10 marcados)');
 // desmarcar arrastrando desde marcada
 [x,y]=await centro(1); await p.mouse.move(x,y); await p.mouse.down(); [x,y]=await centro(2); await p.mouse.move(x,y,{steps:3}); await p.mouse.up(); await p.waitForTimeout(400);
 t(await p.evaluate(()=>!_reacondSel.has('eq2')&&!_reacondSel.has('eq3')&&_reacondSel.size===7),'PC: empezar en marcada desmarca (quedan 7)');
 // clic simple
 await p.locator('.bcf-chk').nth(11).click(); await p.waitForTimeout(400);
 t(await p.evaluate(()=>_reacondSel.has('eq12')&&_reacondSel.size===8),'PC: clic simple sigue marcando uno');
 await p.locator('.bcf-chk').nth(11).click(); await p.waitForTimeout(400);
 t(await p.evaluate(()=>!_reacondSel.has('eq12')),'PC: clic simple desmarca');
 // clic en tarjeta abre
 await p.locator('.bcf-card small').nth(0).click(); t(await p.evaluate(()=>ABIERTOS.length)===1,'PC: tocar la tarjeta (no la casilla) abre el equipo');
 // acciones
 await p.click('#bcLoteBar [data-a=asignar]'); await p.click('#bcLoteBar [data-a=despachar]'); await p.click('#bcLoteBar [data-a=listo]'); await p.waitForTimeout(200); await p.evaluate(()=>{ for(let i=1;i<=7;i++) _reacondSel.add('eq'+[1,4,6,7,8,9,10][i-1]); renderDetalleLoteReacond(); });
 await p.click('#bcLoteBar [data-a=pasar]'); t(await p.locator('.bclb-menu:not([hidden])').count()===1,'PC: abre menú Pasar a');
 await p.screenshot({path:require('os').tmpdir()+'/lote-pc.png'});
 await p.click('.bclb-menu [data-d=evaluado]');
 const log=await p.evaluate(()=>LOG); t(log.length===4&&log[1]==='desp:7'&&log[2]==='listo:7'&&/^pasar:evaluado:/.test(log[3])&&log[3].split(':')[2].split(',').length===7,'PC: botones llaman a las funciones existentes '+JSON.stringify(log));
 const sizes=await p.$$eval('#bcLoteBar > button:not([hidden]), #bcLoteBar .bclb-pw > button',bs=>bs.map(b=>[b.offsetWidth,b.offsetHeight]));
 t(sizes.every(([w,h])=>w>=44&&h>=44),'PC: botones ≥44 px '+JSON.stringify(sizes));
 await p.click('#bcLoteBar [data-a=quitar]'); await p.waitForTimeout(300);
 t(await p.evaluate(()=>_reacondSel.size)===0 && await p.locator('#bcLoteBar.bclb-on').count()===0,'PC: Quitar vacía y oculta la barra');
 // Varios lotes (mejora 5)
 await p.evaluate(()=>{ _reacondSel=new Set(); LOG.length=0; renderDetalleLoteReacond(); });
 await p.locator('.bcf-chk').nth(0).click(); await p.locator('.bcf-chk').nth(1).click(); await p.waitForTimeout(400);
 await p.evaluate(()=>abrirLoteReacond('B')); await p.waitForTimeout(300);
 t(await p.evaluate(()=>_reacondSel.size)===2,'Lotes: al abrir otro lote se conservan los 2 marcados');
 for(const i of [0,1,2]) await p.locator('.bcf-chk').nth(i).click(); await p.waitForTimeout(400);
 t((await p.textContent('#bclbN'))==='5','Lotes: barra dice 5 en total');
 t(/3 de este lote · 2 de otros lotes/.test(await p.textContent('#bclbOtros')),'Lotes: barra dice «3 de este lote · 2 de otros lotes» → '+await p.textContent('#bclbOtros'));
 await p.click('#bcLoteBar [data-a=pasar]'); await p.click('.bclb-menu [data-d=evaluado]'); await p.waitForTimeout(400);
 let lg=await p.evaluate(()=>LOG.slice()); t(lg[0]==='pasar:evaluado:eq13,eq14,eq15','Lotes: «Pasar a» solo toca los 3 de este lote → '+lg[0]);
 t(await p.evaluate(()=>[..._reacondSel].sort().join(','))==='eq1,eq2','Lotes: los 2 de otro lote siguen marcados');
 for(const i of [0,1]) await p.locator('.bcf-chk').nth(i).click(); await p.waitForTimeout(300);
 await p.click('#bcLoteBar [data-a=despachar]'); lg=await p.evaluate(()=>LOG.slice());
 t(lg[lg.length-1]==='desp:4','Lotes: «Despachar» toma los 4 de los dos lotes');
 const r=await p.evaluate(async()=>{ const x=await _despTelConfirmar(); return [x.ids.length,_reacondSel.size]; });
 t(r[0]===2&&r[1]===2,'Lotes: tras despachar, los despachados dejan de estar marcados');
 await p.evaluate(()=>{ _reacondSel=new Set([...cache.refurb.filter(x=>x.lote_id==='A').map(x=>x.id).slice(0,2)]); renderDetalleLoteReacond(); });
 await p.click('#bcLoteBar [data-a=listo]'); await p.waitForTimeout(300);
 const antesLog=await p.evaluate(()=>LOG.length);
 await p.evaluate(()=>abrirLoteReacond('B')); await p.waitForTimeout(200);
 await p.click('#bcLoteBar [data-a=listo]'); await p.waitForTimeout(300);
 t(await p.evaluate(()=>_reacondSel.size)===2 && await p.evaluate(()=>LOG.length)===antesLog,'Lotes: en un lote sin marcados propios, «Listo para venta» no hace nada y conserva los otros');
 await p.click('#bcLoteBar [data-a=quitar]'); await p.waitForTimeout(300);
 t(await p.evaluate(()=>_reacondSel.size)===0,'Lotes: «Quitar» limpia todo, también otros lotes');
 await p.evaluate(()=>abrirLoteReacond('A'));
 // iPhone (touch real con CDP)
 const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2}); p=await ctx.newPage(); await p.goto(H);
 const cdp=await ctx.newCDPSession(p);
 const tc=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
 [x,y]=await centro(0); await tc('touchStart',x,y);
 for(const i of [1,2,3]){const [a,c]=await centro(i); for(let k=1;k<=4;k++) await tc('touchMove',x+(a-x)*k/4,y+(c-y)*k/4); x=a;y=c;}
 await tc('touchEnd'); await p.waitForTimeout(500);
 t(await p.evaluate(()=>_reacondSel.size)===4,'iPhone: arrastrar con el dedo marca 4 ('+await p.evaluate(()=>_reacondSel.size)+')');
 t(await p.evaluate(()=>ABIERTOS.length)===0,'iPhone: no abrió equipos');
 t(await p.evaluate(()=>scrollY)===0,'iPhone: la página no se movió al arrastrar');
 const ms=await p.$$eval('#bcLoteBar > button:not([hidden]), #bcLoteBar .bclb-pw > button',bs=>bs.map(b=>[b.offsetWidth,b.offsetHeight]));
 t(ms.every(([w,h])=>w>=44&&h>=44),'iPhone: botones ≥44 px '+JSON.stringify(ms));
 t(await p.evaluate(()=>document.documentElement.scrollWidth<=390),'iPhone: sin scroll de lado');
 await p.screenshot({path:require('os').tmpdir()+'/lote-iphone.png'});
 console.log(`\n${ok}/${ok+mal}`); await b.close(); process.exit(mal?1:0);
})();
