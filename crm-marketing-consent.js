/* BAYOL CELL — consentimiento de promociones por WhatsApp
   Control reutilizable para formularios operativos.
   V1 se integra automáticamente con Recepción/Reparación (#c_whatsapp).
   No marca clientes automáticamente: solo escribe cuando el usuario acciona el switch.
*/
(() => {
  'use strict';
  if (window.BayolMarketingConsent) return;

  const PROJECT_URL = 'https://vkhwdvjtowrhkhqavnvk.supabase.co';
  const FN_URL = `${PROJECT_URL}/functions/v1/whatsapp-marketing-contactos`;
  const STORE_BRANCH = 'bc_marketing_sucursal';
  const mounted = new WeakMap();
  let branchesPromise = null;

  const css = `
  .bc-mkt-consent{margin-top:9px;border:1px solid #e5e7eb;border-radius:12px;background:linear-gradient(145deg,#fff,#fafafa);padding:10px 11px;box-shadow:0 1px 3px rgba(15,23,42,.04)}
  .bc-mkt-head{display:flex;align-items:center;gap:9px;min-width:0}
  .bc-mkt-icon{width:31px;height:31px;border-radius:9px;background:#ecfdf5;color:#059669;display:grid;place-items:center;flex:none;font-size:17px}
  .bc-mkt-copy{flex:1;min-width:0}.bc-mkt-title{font-size:11.5px;font-weight:800;color:#1f2937;line-height:1.25}.bc-mkt-sub{font-size:9.5px;color:#64748b;line-height:1.35;margin-top:2px;text-transform:none;font-weight:500}
  .bc-mkt-switch{position:relative;width:38px;height:22px;flex:none}.bc-mkt-switch input{position:absolute;opacity:0;pointer-events:none}.bc-mkt-slider{position:absolute;inset:0;border-radius:999px;background:#d7dce3;cursor:pointer;transition:.18s}.bc-mkt-slider:before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(15,23,42,.25);transition:.18s}.bc-mkt-switch input:checked+.bc-mkt-slider{background:#16a34a}.bc-mkt-switch input:checked+.bc-mkt-slider:before{transform:translateX(16px)}.bc-mkt-switch input:disabled+.bc-mkt-slider{opacity:.48;cursor:not-allowed}
  .bc-mkt-meta{display:flex;align-items:center;gap:7px;margin-top:8px;padding-top:8px;border-top:1px solid #eef0f3}.bc-mkt-branch{height:29px!important;min-height:29px!important;padding:4px 8px!important;border-radius:8px!important;font-size:9.5px!important;max-width:170px;width:auto!important;margin:0!important}.bc-mkt-status{font-size:9px;color:#64748b;line-height:1.25;flex:1}.bc-mkt-status.ok{color:#047857}.bc-mkt-status.warn{color:#a16207}.bc-mkt-status.err{color:#b91c1c}.bc-mkt-spin{display:inline-block;width:10px;height:10px;border:1.5px solid #d1d5db;border-top-color:#dc2626;border-radius:50%;animation:bcMktSpin .7s linear infinite;vertical-align:-1px;margin-right:4px}@keyframes bcMktSpin{to{transform:rotate(360deg)}}
  @media(max-width:640px){.bc-mkt-consent{padding:9px 10px}.bc-mkt-meta{align-items:flex-start;flex-wrap:wrap}.bc-mkt-branch{max-width:100%;width:100%!important}.bc-mkt-status{flex-basis:100%}}
  `;

  function ensureStyle(){
    if(document.getElementById('bcMarketingConsentStyle')) return;
    const s=document.createElement('style'); s.id='bcMarketingConsentStyle'; s.textContent=css; document.head.appendChild(s);
  }

  function digits(v){ return String(v||'').replace(/\D/g,'').slice(0,15); }
  function validPhone(v){ const d=digits(v); return d.length>=7 && d.length<=15; }
  function esc(v){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function notify(msg,type='info'){
    try{
      if(typeof window.toast==='function') return window.toast(msg,type==='error'?'error':undefined);
      if(type==='error' && typeof window.toastError==='function') return window.toastError(msg);
    }catch(_e){}
  }

  async function token(){
    if(!window.supabaseClient) throw new Error('La sesión del sistema todavía no está lista.');
    const {data,error}=await window.supabaseClient.auth.getSession();
    if(error||!data?.session?.access_token) throw new Error('No hay una sesión activa.');
    return data.session.access_token;
  }

  async function api(body){
    const t=await token();
    const r=await fetch(FN_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d?.ok){ const e=new Error(d?.mensaje||d?.error||'No se pudo actualizar el consentimiento.'); e.code=d?.error; throw e; }
    return d;
  }

  async function branches(){
    if(!branchesPromise) branchesPromise=api({action:'sucursales'}).then(r=>r.sucursales||[]).catch(e=>{branchesPromise=null;throw e;});
    return branchesPromise;
  }

  function inferredBranch(){
    const candidates=[
      window.sessionUser?.sucursal_id,
      window.sessionUser?.sucursalId,
      localStorage.getItem(STORE_BRANCH)
    ].filter(Boolean);
    return candidates[0]||'';
  }

  function statusText(state,txt,klass=''){
    state.status.className='bc-mkt-status'+(klass?' '+klass:'');
    state.status.innerHTML=txt;
  }

  async function loadBranches(state){
    try{
      const list=await branches();
      const preferred=inferredBranch();
      state.branch.innerHTML=list.map(b=>`<option value="${esc(b.id)}">${esc(b.nombre||b.codigo||'Sucursal')}</option>`).join('');
      if(preferred && list.some(b=>b.id===preferred)) state.branch.value=preferred;
      else if(list.length===1) state.branch.value=list[0].id;
      else if(localStorage.getItem(STORE_BRANCH) && list.some(b=>b.id===localStorage.getItem(STORE_BRANCH))) state.branch.value=localStorage.getItem(STORE_BRANCH);
      state.branch.disabled=list.length<=1;
      if(!list.length) throw new Error('No hay sucursales activas disponibles.');
    }catch(e){
      state.branch.innerHTML='<option value="">Sin sucursal</option>'; state.branch.disabled=true;
      statusText(state,esc(e.message||'No se pudieron cargar las sucursales.'),'err');
    }
  }

  async function refresh(state){
    const p=digits(state.input.value);
    const branch=state.branch.value;
    state.seq++;
    const seq=state.seq;
    state.exists=false; state.current=false;
    if(!validPhone(p)){
      state.check.checked=false; state.check.disabled=true;
      statusText(state,'Escribe un WhatsApp válido para registrar la autorización.','warn');
      return;
    }
    if(!branch){
      state.check.checked=false; state.check.disabled=true;
      statusText(state,'Selecciona la sucursal.','warn');
      return;
    }
    state.check.disabled=true;
    statusText(state,'<span class="bc-mkt-spin"></span>Consultando autorización…');
    try{
      const d=await api({action:'consultar_telefono',telefono:p,sucursal_id:branch});
      if(seq!==state.seq) return;
      state.exists=!!d.existe; state.current=!!d.opt_in; state.check.checked=state.current; state.check.disabled=false;
      if(d.opt_in){
        const fecha=d.opt_in_at?new Date(d.opt_in_at).toLocaleDateString('es-DO'):'';
        statusText(state,`Autorizado${fecha?' · '+fecha:''}. Puede retirarse cuando el cliente lo solicite.`,'ok');
      }else if(d.existe && d.opt_out_at){
        statusText(state,'El cliente está dado de baja de promociones.','warn');
      }else{
        statusText(state,'Sin autorización registrada. El switch queda apagado.');
      }
    }catch(e){
      if(seq!==state.seq) return;
      state.check.checked=false; state.check.disabled=true;
      statusText(state,esc(e.message||'No se pudo consultar.'),'err');
    }
  }

  async function save(state,next){
    const p=digits(state.input.value), branch=state.branch.value;
    if(!validPhone(p) || !branch) return refresh(state);
    const prev=state.current;
    state.check.disabled=true; state.branch.disabled=true;
    statusText(state,'<span class="bc-mkt-spin"></span>Guardando…');
    try{
      await api({
        action:'guardar_telefono',
        telefono:p,
        sucursal_id:branch,
        opt_in:next,
        confirmo_consentimiento:next===true,
        fuente:state.source,
        nota:next?'Cliente autorizó ofertas y novedades de BAYOL CELL por WhatsApp.':'Cliente retiró la autorización para promociones.'
      });
      state.exists=true; state.current=next; state.check.checked=next;
      localStorage.setItem(STORE_BRANCH,branch);
      statusText(state,next?'Autorización registrada correctamente.':'Baja registrada. No entrará en próximas campañas.',next?'ok':'warn');
      notify(next?'Consentimiento de promociones guardado.':'Cliente dado de baja de promociones.');
    }catch(e){
      state.check.checked=prev;
      statusText(state,esc(e.message||'No se pudo guardar.'),'err');
      notify(e.message||'No se pudo guardar el consentimiento.','error');
    }finally{
      state.check.disabled=!validPhone(state.input.value);
      const opts=state.branch.options?.length||0; state.branch.disabled=opts<=1;
    }
  }

  async function attach(opts){
    const input=typeof opts?.input==='string'?document.querySelector(opts.input):opts?.input;
    if(!input || mounted.has(input)) return mounted.get(input)||null;
    ensureStyle();

    const box=document.createElement('div'); box.className='bc-mkt-consent'; box.dataset.source=opts?.source||'formulario';
    box.innerHTML=`
      <div class="bc-mkt-head">
        <div class="bc-mkt-icon"><i class="ti ti-brand-whatsapp"></i></div>
        <div class="bc-mkt-copy">
          <div class="bc-mkt-title">Recibir promociones por WhatsApp</div>
          <div class="bc-mkt-sub">Actívalo solo si el cliente autoriza ofertas y novedades de BAYOL CELL. Puede retirarlo cuando quiera.</div>
        </div>
        <label class="bc-mkt-switch" title="Consentimiento de promociones">
          <input type="checkbox" disabled aria-label="Recibir promociones por WhatsApp">
          <span class="bc-mkt-slider"></span>
        </label>
      </div>
      <div class="bc-mkt-meta">
        <select class="bc-mkt-branch" aria-label="Sucursal"><option value="">Cargando sucursal…</option></select>
        <div class="bc-mkt-status"><span class="bc-mkt-spin"></span>Preparando…</div>
      </div>`;

    const host=opts?.container ? (typeof opts.container==='string'?document.querySelector(opts.container):opts.container) : input.parentElement;
    if(!host) return null;
    host.appendChild(box);

    const state={input,box,check:box.querySelector('input[type=checkbox]'),branch:box.querySelector('.bc-mkt-branch'),status:box.querySelector('.bc-mkt-status'),source:opts?.source||'formulario',current:false,exists:false,seq:0,timer:null};
    mounted.set(input,state);

    state.check.addEventListener('change',()=>save(state,state.check.checked));
    state.branch.addEventListener('change',()=>{ localStorage.setItem(STORE_BRANCH,state.branch.value); refresh(state); });
    const onPhone=()=>{ clearTimeout(state.timer); state.timer=setTimeout(()=>refresh(state),320); };
    input.addEventListener('input',onPhone); input.addEventListener('change',onPhone); input.addEventListener('blur',onPhone);

    await loadBranches(state);
    await refresh(state);
    return state;
  }

  function autoMount(){
    // Recepción de equipos / reparación: WhatsApp del cliente.
    const reception=document.getElementById('c_whatsapp');
    if(reception && !mounted.has(reception)) attach({input:reception,source:'reparacion'});

    // Hooks declarativos para futuros formularios de cliente/venta sin duplicar lógica.
    document.querySelectorAll('[data-marketing-consent-phone]').forEach(el=>{
      if(!mounted.has(el)) attach({input:el,source:el.getAttribute('data-marketing-consent-source')||'cliente'});
    });
  }

  const observer=new MutationObserver(autoMount);
  function start(){ autoMount(); observer.observe(document.documentElement,{childList:true,subtree:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();

  window.BayolMarketingConsent={attach,refresh:el=>{const s=mounted.get(el);return s?refresh(s):null;},version:'1.0.0'};
})();
