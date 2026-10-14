/* BAYOL CELL · web pública · efectos de las referencias de diseño (12 oct 2026).
 * Rehechos en JavaScript normal (sin React), a partir de:
 *  1) Texto que cambia (Originkit «Text Morph») + resaltador (Fancy Components): portada.
 *  2) Borde de luz («border beam» de libraries.dev): lo importante (Pedir por WhatsApp, oferta de pantallas).
 *  3) Números que se mezclan («Scramble Text» de The Kitchen): 30 minutos, RD$1,000, 4.3 en Google.
 *  4) Malla de puntos que sigue el dedo (Originkit «Kinetic Grid», 14 oct 2026): fondo de la portada.
 *  5) Ofertas del taller en 3D (Skecher UI «3D Carousel», 14 oct 2026): en el celular giran como carrusel al deslizar;
 *     en la computadora la tarjeta se inclina hacia el ratón.
 *  6) Pestañas de marcas con indicador que se desliza y se estira (Skecher UI «Velocity Tabs»).
 *  7) Total del pedido que cambia dígito por dígito (Skecher UI «Add to Cart»).
 *  8) Tarjeta «Plan de cuotas» que se inclina con el ratón/dedo en Financiamiento (Skecher UI «Credit Card»).
 * Capa aislada: si no carga, la página se ve igual que antes. «Reducir movimiento» = todo quieto.
 */
(()=>{'use strict';
const quieto=matchMedia('(prefers-reduced-motion: reduce)').matches;
const css=`
.bcx-repara{margin:16px 0 22px;display:grid;gap:6px}
.bcx-linea2 .nw{white-space:nowrap}
.bcx-linea1{font:800 clamp(19px,2.1vw,26px)/1.2 var(--disp);letter-spacing:-.025em;color:var(--texto)}
.bcx-rota{display:inline-block;color:var(--rojo-luz);white-space:nowrap}
.bcx-rota .c{display:inline-block;transition:transform .42s var(--resorte),opacity .32s ease,filter .32s ease;will-change:transform,opacity,filter}
.bcx-rota .c.sale{transform:translateY(-.45em);opacity:0;filter:blur(4px)}
.bcx-rota .c.entra{transform:translateY(.5em);opacity:0;filter:blur(4px);transition:none}
.bcx-linea2{font:500 clamp(14px,1.3vw,16px)/1.45 var(--sans);color:var(--suave)}
.bcx-linea2 b{color:var(--texto);font-weight:700}
.bcx-marca{color:var(--texto);font-weight:800;background:linear-gradient(transparent 46%,rgba(227,30,36,.62) 46%,rgba(227,30,36,.62) 94%,transparent 94%) no-repeat 0 0/0% 100%;padding:0 .12em;transition:background-size .9s var(--ease) .25s}
.bcx-marca.on{background-size:100% 100%}
.bcx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
[data-scramble]{font-variant-numeric:tabular-nums}
@property --bcx-a{syntax:'<angle>';inherits:false;initial-value:0deg}
.bcx-haz{position:relative;isolation:isolate}
.bcx-haz>.bcx-beam{position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;z-index:2;
 background:conic-gradient(from var(--bcx-a),transparent 0 76%,var(--bcx-c,rgba(255,255,255,.95)) 86%,transparent 95%);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
 animation:bcxGira 3.6s linear infinite}
.bcx-haz.rojo>.bcx-beam{--bcx-c:rgba(255,90,79,.95);padding:2px}
@keyframes bcxGira{to{--bcx-a:360deg}}
@media (prefers-reduced-motion:reduce){.bcx-haz>.bcx-beam{animation:none;background:rgba(255,255,255,.22)}.bcx-haz.rojo>.bcx-beam{background:rgba(255,90,79,.35)}.bcx-marca{transition:none}}
@media print{.bcx-beam{display:none}}
.bcx-malla{position:absolute;inset:0;z-index:-1;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .9s ease}
.bcx-malla.on{opacity:1}
.hero.bcx-con-malla::before{opacity:0}
@media print{.bcx-malla{display:none}}
.ofertas.bcx-3d{perspective:900px}
.ofertas.bcx-3d .oferta{transform-style:preserve-3d;will-change:transform;transition:transform .25s ease-out,box-shadow .25s}
.ofertas.bcx-3d .oferta.bcx-hover{transition:transform .08s linear,box-shadow .25s;box-shadow:0 30px 60px -20px rgba(227,30,36,.45)}
.ofertas.bcx-3d .oferta .bcx-brillo{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(circle at var(--bx,50%) var(--by,50%),rgba(255,255,255,.18),transparent 55%);opacity:0;transition:opacity .25s;z-index:1}
.ofertas.bcx-3d .oferta.bcx-hover .bcx-brillo{opacity:1}
.cat-tabs.bcx-vt{position:relative;isolation:isolate}
.cat-tabs.bcx-vt button[aria-selected="true"]{background:transparent}
.cat-tabs .bcx-vt-pil{position:absolute;z-index:-1;top:0;left:0;height:40px;border-radius:999px;background:var(--texto);pointer-events:none;transition:transform .42s cubic-bezier(.2,1.25,.35,1),width .42s cubic-bezier(.2,1.25,.35,1);will-change:transform,width}
.bcx-num-d{display:inline-block;overflow:hidden;height:1.2em;line-height:1.2em;vertical-align:bottom}
.bcx-num-d>i{display:block;font-style:normal;animation:bcxSube .45s cubic-bezier(.2,.9,.25,1.15) both}
.bcx-num-d.baja>i{animation-name:bcxBaja}
@keyframes bcxSube{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
@keyframes bcxBaja{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
.bcx-plan{position:relative;width:min(340px,100%);aspect-ratio:1.6;border-radius:20px;padding:20px 22px;color:#fff;overflow:hidden;
 background:radial-gradient(120% 140% at 0% 0%,#ff5a4f 0%,#c4151c 45%,#5c0a0e 100%);box-shadow:0 30px 60px -25px rgba(227,30,36,.7),inset 0 1px 0 rgba(255,255,255,.25);
 transform-style:preserve-3d;transition:transform .3s ease-out;display:flex;flex-direction:column;justify-content:space-between;margin:22px 0 0}
.bcx-plan::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.22) 1px,transparent 1.2px);background-size:5px 5px;mix-blend-mode:overlay;opacity:.55;
 -webkit-mask:linear-gradient(115deg,transparent 30%,#000 70%);mask:linear-gradient(115deg,transparent 30%,#000 70%)}
.bcx-plan::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at var(--px,30%) var(--py,20%),rgba(255,255,255,.35),transparent 45%);mix-blend-mode:soft-light;pointer-events:none}
.bcx-plan.mueve{transition:transform .08s linear}
.bcx-plan .arriba{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
.bcx-plan .marca{font:800 20px/1 var(--disp,system-ui);letter-spacing:-.02em}
.bcx-plan .marca small{display:block;font:600 10px/1.6 var(--mono,monospace);letter-spacing:.2em;opacity:.8;margin-top:4px}
.bcx-plan .chip-sim{width:40px;height:30px;border-radius:7px;background:linear-gradient(135deg,#ffd76a,#c99a2e);box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
.bcx-plan .abajo{position:relative;z-index:1}
.bcx-plan .lema{font:800 22px/1.1 var(--disp,system-ui);letter-spacing:-.02em}
.bcx-plan .pie{display:flex;justify-content:space-between;margin-top:8px;font:600 11px var(--mono,monospace);letter-spacing:.12em;opacity:.85}
.fin-extra.bcx-con-plan{display:grid;grid-template-columns:1fr auto;gap:10px 28px;align-items:center}
.fin-extra.bcx-con-plan>.bcx-plan{grid-column:2;grid-row:1/span 3;margin:0}
@media (max-width:720px){.fin-extra.bcx-con-plan{grid-template-columns:1fr}.fin-extra.bcx-con-plan>.bcx-plan{grid-column:1;grid-row:auto;margin:6px auto 0}}
@media (prefers-reduced-motion:reduce){.cat-tabs .bcx-vt-pil{transition:none}.bcx-num-d>i{animation:none}}`;
const st=document.createElement('style');st.id='bcxEfectosCSS';st.textContent=css;document.head.append(st);

/* 1 · Texto que cambia en la portada */
function textoQueCambia(){
 const el=document.querySelector('.bcx-rota');if(!el)return;
 const palabras=(el.dataset.palabras||'').split('|').filter(Boolean);if(palabras.length<2||quieto)return;
 const pintar=(w,clase)=>{el.replaceChildren(...[...w].map(ch=>{const s=document.createElement('span');s.className='c'+(clase?' '+clase:'');s.textContent=ch===' '?' ':ch;return s;}));};
 let i=0;pintar(palabras[0]);
 const paso=()=>{
  if(document.hidden)return;
  const cs=[...el.children];cs.forEach((c,k)=>{c.style.transitionDelay=(k*22)+'ms';c.classList.add('sale');});
  setTimeout(()=>{i=(i+1)%palabras.length;pintar(palabras[i],'entra');void el.offsetWidth;[...el.children].forEach((c,k)=>{c.style.transition='';c.style.transitionDelay=(k*28)+'ms';c.classList.remove('entra');});},300+cs.length*22);
 };
 setInterval(paso,2600);
}

/* 3 · Números que se mezclan al aparecer */
function mezclar(el){
 const final=el.textContent;if(!final.trim())return;el.setAttribute('aria-label',final);
 const dig='0123456789',abc='ABCDEFGHJKLMNPRSTUVWXYZ';let t0=null;const dur=750;
 const frame=ts=>{t0??=ts;const p=Math.min(1,(ts-t0)/dur),fijos=Math.floor(p*final.length);
  el.textContent=[...final].map((ch,k)=>k<fijos||!/[0-9A-Za-zÁÉÍÓÚáéíóúñ]/.test(ch)?ch:(/\d/.test(ch)?dig[Math.floor(Math.random()*10)]:(ch===ch.toLowerCase()?abc.toLowerCase():abc)[Math.floor(Math.random()*23)])).join('');
  if(p<1)requestAnimationFrame(frame);else el.textContent=final;};
 requestAnimationFrame(frame);
}
function numerosQueSeMezclan(){
 const els=[...document.querySelectorAll('[data-scramble]')];
 const marca=document.querySelector('.bcx-marca');
 if(quieto||!('IntersectionObserver' in window)){marca?.classList.add('on');return;}
 const io=new IntersectionObserver(es=>{for(const e of es){if(!e.isIntersecting)continue;io.unobserve(e.target);if(e.target.hasAttribute('data-scramble'))mezclar(e.target);if(e.target.classList.contains('bcx-marca'))setTimeout(()=>e.target.classList.add('on'),200);}},{threshold:.6});
 els.forEach(e=>io.observe(e));if(marca&&!els.includes(marca))io.observe(marca);
}

/* 2 · Borde de luz en lo importante */
function bordeDeLuz(){
 const objetivos=[[document.getElementById('hero-consulta'),''],...[...document.querySelectorAll('.ofertas a.oferta')].map(a=>[a,'rojo'])];
 for(const [el,clase] of objetivos){if(!el||el.querySelector(':scope>.bcx-beam'))continue;el.classList.add('bcx-haz');if(clase)el.classList.add(clase);const b=document.createElement('span');b.className='bcx-beam';b.style.animationDelay=(-(objetivos.indexOf(objetivos.find(o=>o[0]===el)))*0.9)+'s';b.setAttribute('aria-hidden','true');el.append(b);}
}

/* 4 · Malla de puntos que sigue el dedo (fondo de la portada) */
function mallaQueSigue(){
 const hero=document.querySelector('.hero');if(!hero||hero.querySelector(':scope>.bcx-malla'))return;
 const cv=document.createElement('canvas');cv.className='bcx-malla';cv.setAttribute('aria-hidden','true');
 hero.prepend(cv);hero.classList.add('bcx-con-malla');
 const ctx=cv.getContext('2d');if(!ctx)return;
 const tactil=matchMedia('(pointer:coarse)').matches;
 const PASO=tactil?34:30, RADIO=tactil?150:190;
 let W=0,H=0,dpr=1,puntos=[],px=-9999,py=-9999,tx=-9999,ty=-9999,fuerza=0,meta=0,visible=true,corriendo=false,t=0;
 const medir=()=>{const r=hero.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  puntos=[];for(let y=PASO/2;y<H;y+=PASO)for(let x=PASO/2;x<W;x+=PASO)puntos.push({x,y,ox:0,oy:0});dibujar();};
 // Se ve más donde está el teléfono (derecha), igual que la rejilla anterior
 const desvanecer=(x,y)=>{const dx=(x/W-.65)/.7,dy=(y/H-.45)/.6;return Math.max(0,1-Math.sqrt(dx*dx+dy*dy));};
 function dibujar(){
  ctx.clearRect(0,0,W,H);
  for(const p of puntos){
   const dx=p.x-px,dy=p.y-py,d=Math.hypot(dx,dy),k=fuerza*Math.max(0,1-d/RADIO);
   const ondula=quieto?0:Math.sin(t/900+p.x/120+p.y/160)*.6;
   p.ox+=((d?dx/d:0)*k*10-p.ox)*.18;p.oy+=((d?dy/d:0)*k*10-p.oy)*.18;
   const base=desvanecer(p.x,p.y);if(base<=0&&k<=0)continue;
   const r=1.2+ondula*.25+k*3.4;
   ctx.fillStyle=k>.04?`rgba(255,${Math.round(90-40*k)},${Math.round(79-40*k)},${Math.min(1,.18+base*.25+k*.8)})`:`rgba(255,255,255,${.07+base*.2})`;
   ctx.beginPath();ctx.arc(p.x+p.ox,p.y+p.oy,r,0,6.2832);ctx.fill();
  }
 }
 function bucle(ts){
  t=ts;px+=(tx-px)*.2;py+=(ty-py)*.2;fuerza+=(meta-fuerza)*.12;
  dibujar();
  const quietoYa=Math.abs(meta-fuerza)<.01&&meta===0;
  if(visible&&!document.hidden&&!quietoYa){requestAnimationFrame(bucle);}else{corriendo=false;}
 }
 const arrancar=()=>{if(!corriendo&&visible&&!quieto){corriendo=true;requestAnimationFrame(bucle);}};
 const mover=(cx,cy)=>{const r=hero.getBoundingClientRect();tx=cx-r.left;ty=cy-r.top;if(px<-999){px=tx;py=ty;}meta=1;arrancar();};
 const soltar=()=>{meta=0;arrancar();};
 hero.addEventListener('pointermove',e=>mover(e.clientX,e.clientY),{passive:true});
 hero.addEventListener('pointerdown',e=>mover(e.clientX,e.clientY),{passive:true});
 hero.addEventListener('pointerleave',soltar,{passive:true});
 hero.addEventListener('pointerup',()=>{if(tactil)setTimeout(soltar,350);},{passive:true});
 hero.addEventListener('pointercancel',soltar,{passive:true});
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(!visible)soltar();},{threshold:0}).observe(hero);
 let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(medir,150);},{passive:true});
 medir();requestAnimationFrame(()=>cv.classList.add('on'));
}

/* 5 · Ofertas en 3D */
function ofertas3D(){
 const fila=document.querySelector('.ofertas');if(!fila||quieto||fila.classList.contains('bcx-3d'))return;
 fila.classList.add('bcx-3d');
 const cartas=[...fila.querySelectorAll('.oferta')];
 const movil=()=>matchMedia('(max-width:720px)').matches||getComputedStyle(fila).overflowX==='auto';
 // Celular: carrusel tipo «coverflow» según lo lejos que esté cada tarjeta del centro
 let pend=false;
 const girar=()=>{pend=false;if(!movil()){cartas.forEach(c=>{if(!c.classList.contains('bcx-hover'))c.style.transform='';});return;}
  const r=fila.getBoundingClientRect(),cx=r.left+r.width/2;
  cartas.forEach(c=>{const b=c.getBoundingClientRect(),d=Math.max(-1.4,Math.min(1.4,(b.left+b.width/2-cx)/b.width));
   c.style.transform=`rotateY(${-d*32}deg) scale(${1-Math.min(1,Math.abs(d))*.12}) translateZ(${-Math.abs(d)*40}px)`;
   c.style.zIndex=String(10-Math.round(Math.abs(d)*5));c.style.opacity=String(1-Math.min(1,Math.abs(d))*.25);});};
 const pedir=()=>{if(!pend){pend=true;requestAnimationFrame(girar);}};
 fila.addEventListener('scroll',pedir,{passive:true});addEventListener('resize',pedir,{passive:true});pedir();
 // Computadora: la tarjeta se inclina hacia el ratón con un brillo
 cartas.forEach(c=>{
  if(getComputedStyle(c).position==='static')c.style.position='relative';
  const br=document.createElement('span');br.className='bcx-brillo';br.setAttribute('aria-hidden','true');c.append(br);
  c.addEventListener('pointermove',e=>{if(movil()||e.pointerType!=='mouse')return;const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
   c.classList.add('bcx-hover');c.style.transform=`rotateX(${(.5-y)*14}deg) rotateY(${(x-.5)*16}deg) scale(1.03)`;c.style.setProperty('--bx',x*100+'%');c.style.setProperty('--by',y*100+'%');});
  c.addEventListener('pointerleave',()=>{c.classList.remove('bcx-hover');c.style.transform='';});
 });
}

/* 6 · Pestañas de marcas con indicador que se desliza y se estira */
function pestanasVelocidad(){
 const tabs=document.getElementById('cat-tabs');if(!tabs)return;
 let pil=null,ultimoX=null;
 const mover=(animar)=>{
  const sel=tabs.querySelector('button[aria-selected="true"]');if(!sel){if(pil)pil.style.opacity='0';return;}
  if(!pil){pil=document.createElement('span');pil.className='bcx-vt-pil';pil.setAttribute('aria-hidden','true');tabs.prepend(pil);tabs.classList.add('bcx-vt');}
  const x=sel.offsetLeft,w=sel.offsetWidth,y=sel.offsetTop,h=sel.offsetHeight;
  pil.style.opacity='1';pil.style.height=h+'px';
  if(!animar||ultimoX===null||quieto){pil.style.transition='none';pil.style.transform=`translate(${x}px,${y}px)`;pil.style.width=w+'px';void pil.offsetWidth;pil.style.transition='';ultimoX=x;return;}
  // estirar en la dirección del movimiento y luego encoger (efecto «velocidad»)
  const desde=ultimoX,izq=Math.min(desde,x),ancho=Math.abs(x-desde)+w;
  pil.style.transform=`translate(${izq}px,${y}px)`;pil.style.width=ancho+'px';
  setTimeout(()=>{pil.style.transform=`translate(${x}px,${y}px)`;pil.style.width=w+'px';},170);
  ultimoX=x;
 };
 new MutationObserver(()=>requestAnimationFrame(()=>mover(true))).observe(tabs,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected']});
 addEventListener('resize',()=>mover(false),{passive:true});
 mover(false);
}

/* 7 · Total del pedido que cambia dígito por dígito */
function totalQueCambia(){
 const el=document.getElementById('pd-total');if(!el||quieto)return;
 let viejo=el.textContent,propio=false;
 new MutationObserver(()=>{
  if(propio){propio=false;return;}
  const nuevo=el.textContent;if(nuevo===viejo)return;
  const vn=parseFloat(viejo.replace(/[^\d.]/g,''))||0,nn=parseFloat(nuevo.replace(/[^\d.]/g,''))||0,baja=nn<vn;
  const off=nuevo.length-viejo.length;let c=0,html='';
  for(let k=0;k<nuevo.length;k++){const ch=nuevo[k],ant=viejo[k-off];
   if(/\d/.test(ch)&&ch!==ant)html+=`<span class="bcx-num-d${baja?' baja':''}"><i style="animation-delay:${c++*40}ms">${ch}</i></span>`;else html+=ch.replace('&','&amp;').replace('<','&lt;');}
  viejo=nuevo;if(!c)return;propio=true;el.innerHTML=html;el.setAttribute('aria-label',nuevo);
 }).observe(el,{childList:true,characterData:true,subtree:true});
}

/* 8 · Tarjeta «Plan de cuotas» en Financiamiento */
function tarjetaFinanciamiento(){
 const caja=document.querySelector('#financiamiento .fin-extra');if(!caja||caja.querySelector('.bcx-plan'))return;
 const t=document.createElement('div');t.className='bcx-plan';t.setAttribute('aria-hidden','true');
 t.innerHTML='<div class="arriba"><div class="marca">Bayol Cell<small>PLAN DE CUOTAS</small></div><span class="chip-sim"></span></div><div class="abajo"><div class="lema">Llévatelo hoy.<br>Págalo en cuotas.</div><div class="pie"><span>CELULARES · PASOLAS · Y MÁS</span><span>BAYOLCELL.COM</span></div></div>';
 caja.classList.add('bcx-con-plan');caja.prepend(t);
 if(quieto)return;
 const mover=(cx,cy)=>{const b=t.getBoundingClientRect(),x=Math.max(0,Math.min(1,(cx-b.left)/b.width)),y=Math.max(0,Math.min(1,(cy-b.top)/b.height));
  t.classList.add('mueve');t.style.transform=`perspective(800px) rotateX(${(.5-y)*16}deg) rotateY(${(x-.5)*20}deg)`;t.style.setProperty('--px',x*100+'%');t.style.setProperty('--py',y*100+'%');};
 const soltar=()=>{t.classList.remove('mueve');t.style.transform='';};
 t.addEventListener('pointermove',e=>mover(e.clientX,e.clientY));t.addEventListener('pointerleave',soltar);t.addEventListener('pointerup',()=>setTimeout(soltar,300));
 t.style.pointerEvents='auto';t.style.touchAction='pan-y';
 // en el celular se mueve sola un poco al aparecer en pantalla
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();t.animate([{transform:'perspective(800px) rotateY(-18deg) rotateX(6deg)'},{transform:'perspective(800px) rotateY(12deg) rotateX(-4deg)'},{transform:'none'}],{duration:1600,easing:'cubic-bezier(.3,.7,.3,1)'});}},{threshold:.6});io.observe(t);}
}

function iniciar(){textoQueCambia();numerosQueSeMezclan();bordeDeLuz();mallaQueSigue();ofertas3D();pestanasVelocidad();totalQueCambia();tarjetaFinanciamiento();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
window.BayolEfectosWeb={version:'20261014d'};
})();
