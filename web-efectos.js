/* BAYOL CELL · web pública · efectos de las referencias de diseño (12 oct 2026).
 * Rehechos en JavaScript normal (sin React), a partir de:
 *  1) Texto que cambia (Originkit «Text Morph») + resaltador (Fancy Components): portada.
 *  2) Borde de luz («border beam» de libraries.dev): lo importante (Pedir por WhatsApp, oferta de pantallas).
 *  3) Números que se mezclan («Scramble Text» de The Kitchen): 30 minutos, RD$1,000, 4.3 en Google.
 *  4) Malla de puntos que sigue el dedo (Originkit «Kinetic Grid», 14 oct 2026): fondo de la portada.
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
@media print{.bcx-malla{display:none}}`;
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

function iniciar(){textoQueCambia();numerosQueSeMezclan();bordeDeLuz();mallaQueSigue();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
window.BayolEfectosWeb={version:'20261014b'};
})();
