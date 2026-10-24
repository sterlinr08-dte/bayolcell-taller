/* BAYOL CELL · 24-oct-2026 · Formulario nativo de WhatsApp (Meta Flow) para la solicitud de financiamiento.
   Dueño: «el cliente lo llene cuando el empleado se lo envíe ya con las informaciones». El empleado fija el equipo y el
   precio desde el chat; el cliente completa cédula, nombre, teléfono y dirección dentro de WhatsApp. Al responder, la
   burbuja muestra cada dato con su botón «Copiar» y la línea «Referencia» para el formulario del banco
   (Sucursal · Empleado · Equipo precio). Capa aislada y reversible: apagar con localStorage.bc_flow_fin_off='1'. */
(() => {
  'use strict';
  if (window.__bcFlowFinanciamiento) return;
  try { if (localStorage.getItem('bc_flow_fin_off') === '1') return; } catch (e) {}
  window.__bcFlowFinanciamiento = '20261024-f10';

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plata = n => 'RD$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const thread = () => (typeof _waHiloId === 'undefined' ? null : _waHiloId);
  const puede = () => { try { return (typeof isAdminUser === 'function' && isAdminUser()) || (typeof tienePermiso === 'function' && tienePermiso('financiamientos_crear')); } catch (e) { return false; } };
  const admin = () => { try { return typeof isAdminUser === 'function' && !!isAdminUser(); } catch (e) { return false; } };

  const style = document.createElement('style');
  style.textContent = [
    '#btnWaFlowFin{color:#0f766e;min-width:44px;min-height:44px}@media (max-width:768px){#btnWaFlowFin{display:none!important}}',
    '#waAdjuntarMenu button.bcff-adj{min-height:44px}',
    '.bcff-card{border:1px solid #99f6e4;background:linear-gradient(180deg,#f0fdfa,#fff);border-radius:12px;padding:10px 10px 6px;margin:4px 0 6px;min-width:240px;max-width:100%}',
    '.bcff-card h4{margin:0 0 8px;font-size:13px;font-weight:800;color:#0f766e;display:flex;align-items:center;gap:6px}',
    '.bcff-row{display:flex;align-items:center;gap:8px;min-height:44px;border-top:1px solid #e2e8f0}.bcff-row:first-of-type{border-top:0}',
    '.bcff-k{flex:0 0 76px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.3px}',
    '.bcff-v{flex:1;min-width:0;font-size:13.5px;color:#0f172a;word-break:break-word}',
    '.bcff-c{flex:0 0 auto;min-width:44px;min-height:44px;border:1px solid #cbd5e1;background:#fff;border-radius:10px;color:#0f766e;font-size:13px;font-weight:700;cursor:pointer;padding:0 10px;font-family:inherit}',
    '.bcff-c:active{transform:scale(.96)}.bcff-c.ok{background:#dcfce7;border-color:#86efac;color:#166534}',
    '.bcff-ref{margin-top:8px;padding:8px 10px;border-radius:10px;background:#fff7ed;border:1px dashed #fdba74;font-size:12.5px;color:#9a3412}',
    '.bcff-ref b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px}',
    '.bcff-acts{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.bcff-acts .bcff-c{flex:1;min-height:44px}',
    '.bcff-out{font-size:11px;color:#0f766e;font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:5px}',
    '#bcffForm.bcff-form{display:flex;flex-direction:column;gap:12px}#bcffForm .bcff-campo{display:flex;flex-direction:column;gap:6px;margin:0}#bcffForm .bcff-campo>span{font-size:13px;font-weight:600;color:#475569;text-transform:none;letter-spacing:0;line-height:1.3}',
    '#bcffForm input:not([type=checkbox]),#bcffForm select{box-sizing:border-box;width:100%;min-height:48px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:12px;font:inherit;font-size:16px;font-weight:400;color:#0f172a;text-transform:none;background:#fff}#bcffForm input:focus,#bcffForm select:focus{outline:0;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}',
    '.bcff-fila{display:flex;gap:8px;align-items:flex-end}.bcff-fila label{flex:1}.bcff-buscar{min-height:48px;min-width:48px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;cursor:pointer;font-size:18px;color:#0f766e}',
    '#bcffForm .bcff-ayuda{margin:0;font-size:13.5px;color:#64748b;line-height:1.45;text-transform:none}#bcffForm .bcff-chk{display:flex;flex-direction:row;align-items:center;gap:12px;min-height:48px;padding:0 12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:14px;color:#334155;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer;line-height:1.35}#bcffForm .bcff-chk input{width:22px;height:22px;min-height:0;min-width:22px;margin:0;flex:0 0 auto;accent-color:#2563eb}#bcffForm .bcff-chk span{flex:1}',
    '.bcff-enviar{min-height:54px;border-radius:12px;border:0;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;background:linear-gradient(180deg,#128C7E,#075E54);color:#fff}.bcff-enviar:disabled{opacity:.6}',
  ].join('');
  document.head.appendChild(style);

  // ---------- Copiar ----------
  async function copiar(texto, btn) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(texto);
      else { const ta = document.createElement('textarea'); ta.value = texto; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      if (btn) { const t = btn.textContent; btn.classList.add('ok'); btn.textContent = 'Copiado'; setTimeout(() => { btn.classList.remove('ok'); btn.textContent = t; }, 1400); }
    } catch (e) { window.toastError?.('No se pudo copiar. Selecciónelo con el dedo o el ratón.'); }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bcff-copiar]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    copiar(b.getAttribute('data-bcff-copiar'), b);
  }, true);

  // ---------- Burbujas ----------
  const CAMPOS = [['cedula', 'Cédula'], ['nombres', 'Nombre'], ['telefono', 'Teléfono'], ['provincia', 'Provincia'], ['municipio', 'Municipio'], ['sector', 'Sector'], ['calle', 'Calle'], ['casa', 'No. casa'], ['equipo', 'Equipo'], ['precio', 'Precio'], ['monto', 'Monto'], ['plazo', 'Plazo']];
  // 24-oct-2026 · El portal del banco (Banfondesa) espera la cédula como 000-0000000-0 y el teléfono como 000-000-0000.
  function fmtCedula(v) { const d = String(v || '').replace(/\D/g, ''); return d.length === 11 ? d.slice(0, 3) + '-' + d.slice(3, 10) + '-' + d.slice(10) : String(v || ''); }
  function fmtTel(v) { let d = String(v || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : String(v || ''); }
  function datosDe(m) {
    try {
      const d = (m.meta && m.meta.flow && m.meta.flow.datos) || null; if (!d) return null;
      const o = Object.assign({}, d); o.cedula = fmtCedula(d.cedula); o.telefono = fmtTel(d.telefono);
      const n = Number(String(d.precio || '').replace(/[^0-9.]/g, '')); if (n > 0) o.monto = String(Math.round(n)); // el banco pide el monto sin RD$ ni comas
      if (d.plazo) o.plazo = String(d.plazo).replace(/\D/g, '') + ' meses';
      return o;
    } catch (e) { return null; }
  }
  function tarjetaRespuesta(m) {
    const d = datosDe(m);
    if (!d) return '';
    const filas = CAMPOS.filter(([k]) => d[k]).map(([k, lbl]) => `<div class="bcff-row"><span class="bcff-k">${lbl}</span><span class="bcff-v">${esc(d[k])}</span><button type="button" class="bcff-c" data-bcff-copiar="${esc(d[k])}" aria-label="Copiar ${lbl}">Copiar</button></div>`).join('');
    const ref = d.referencia || '';
    // 24-oct-2026 (dueño): un solo bloque con toda la solicitud, listo para pegarlo en el chat de la gente del banco (Ademi o Banfondesa).
    const todo = ['SOLICITUD DE FINANCIAMIENTO – BAYOL CELL', ref ? `Referencia: ${ref}` : '', '',
      `Cédula: ${d.cedula || ''}`, `Nombre: ${d.nombres || ''}`, `Teléfono: ${d.telefono || ''}`,
      `Dirección: ${[d.calle ? 'Calle ' + d.calle : '', d.casa ? 'No. ' + d.casa : '', d.sector, d.municipio, d.provincia].filter(Boolean).join(', ')}`, '',
      `Equipo: ${d.equipo || ''}`, `Monto: ${d.precio || ''}`, d.plazo ? `Plazo deseado: ${d.plazo}` : ''].filter(x => x !== null).join('\n').replace(/\n{3,}/g, '\n\n');
    // Fotos que el cliente mandó después de responder (cédula y comprobante): se cuentan en el mismo chat.
    // 24-oct-2026: el estado vive en CRM › Solicitudes; desde aquí se abre su ficha de seguimiento.
    const fl = (m.meta && m.meta.flow) || {};
    const fotosTxt = `<span style="color:#1d4ed8">Siga el estado en la pestaña Solicitudes</span>`;
    const verBtn = (fl.solicitud_id || fl.flow_token) ? `<button type="button" class="bcff-c" data-bcsol-ver="${esc(fl.solicitud_id || '')}" data-bcsol-token="${esc(fl.flow_token || '')}" style="flex-basis:100%">Ver seguimiento</button>` : '';
    return `<div class="bcff-card" onclick="event.stopPropagation()">
      <h4><i class="ti ti-file-dollar"></i> Solicitud de financiamiento</h4>
      ${filas}
      ${ref ? `<div class="bcff-ref"><b>Referencia para el banco</b>${esc(ref)}</div>` : ''}
      <div style="font-size:12px;margin-top:8px;font-weight:600">${fotosTxt}</div>
      <div class="bcff-acts">${ref ? `<button type="button" class="bcff-c" data-bcff-copiar="${esc(ref)}">Copiar referencia</button>` : ''}<button type="button" class="bcff-c" data-bcff-copiar="${esc(todo)}">Copiar solicitud completa</button>${verBtn}</div>
    </div>`;
  }
  function envolverRender() {
    const orig = window._waBurbujaMedia;
    if (typeof orig !== 'function' || orig.__bcff) return false;
    const nueva = function (m) {
      if (m && m.tipo_contenido === 'flow_respuesta') return tarjetaRespuesta(m);
      if (m && m.tipo_contenido === 'flow') return `<div class="bcff-out"><i class="ti ti-forms"></i> Formulario dentro de WhatsApp${m.meta && m.meta.flow && m.meta.flow.borrador ? ' · prueba' : ''}</div>`;
      return orig.apply(this, arguments);
    };
    nueva.__bcff = true; window._waBurbujaMedia = nueva;
    const prev = window._waPreviewTexto;
    if (typeof prev === 'function' && !prev.__bcff) {
      const p2 = function (m) {
        if (m && m.tipo_contenido === 'flow_respuesta') return '📋 Solicitud de financiamiento recibida';
        if (m && m.tipo_contenido === 'flow') return '📋 Formulario de financiamiento enviado';
        return prev.apply(this, arguments);
      };
      p2.__bcff = true; window._waPreviewTexto = p2;
    }
    return true;
  }

  // ---------- Botón junto a la caja de escribir ----------
  function ponerBoton() {
    const rap = document.getElementById('btnWaRapidas');
    if (!rap || document.getElementById('btnWaFlowFin') || !puede()) return;
    const b = document.createElement('button');
    b.className = 'wa-icon-btn'; b.id = 'btnWaFlowFin'; b.type = 'button';
    b.title = 'Enviar solicitud de financiamiento (formulario)'; b.setAttribute('aria-label', 'Enviar solicitud de financiamiento');
    b.innerHTML = '<i class="ti ti-file-dollar"></i>';
    b.addEventListener('click', e => { e.preventDefault(); abrir(); });
    rap.insertAdjacentElement('afterend', b);
  }

  // ---------- Ventana para fijar equipo y precio ----------
  function nivel1(a) { const n = a && a.niveles && a.niveles['1']; return Number(n != null && n !== '' ? n : (a && a.precio)) || 0; }
  function abrir() {
    const hilo = thread();
    if (!hilo) return window.toast?.('Abra primero el chat del cliente.', 'error');
    if (typeof abrirModalGenerico !== 'function') return;
    abrirModalGenerico('Solicitud de financiamiento', `
      <form class="bcff-form" id="bcffForm" autocomplete="off">
        <p class="bcff-ayuda">El cliente recibe un enlace con el equipo y el precio ya indicados. Al completarlo, la solicitud aparece en este chat con la referencia para el banco.</p>
        <label class="bcff-campo"><span>Forma de envío</span><select id="bcffModo"><option value="web" selected>Enlace a la página de Bayol Cell</option><option value="flow">Formulario dentro de WhatsApp</option></select></label>
        <div class="bcff-fila">
          <label class="bcff-campo"><span>Equipo o artículo</span><input id="bcffEquipo" maxlength="120" placeholder="Ej.: iPhone 13 128GB" required></label>
          ${typeof abrirBuscadorArticulos === 'function' ? '<button type="button" class="bcff-buscar" id="bcffBuscar" title="Buscar en Info Plus" aria-label="Buscar en Info Plus"><i class="ti ti-search"></i></button>' : ''}
        </div>
        <label class="bcff-campo"><span>Precio (RD$)</span><input id="bcffPrecio" type="number" inputmode="decimal" min="1" step="0.01" placeholder="Ej.: 38500" required></label>
        <label class="bcff-chk"><input type="checkbox" id="bcffInformado"><span>Confirmo que informé al cliente el equipo y el precio.</span></label>
        <button type="submit" class="bcff-enviar" id="bcffEnviar"><i class="ti ti-send"></i> Enviar al cliente</button>
      </form>`, { ancho: '480px' });
    const form = document.getElementById('bcffForm'); if (!form) return;
    const eq = document.getElementById('bcffEquipo'), pr = document.getElementById('bcffPrecio'), btn = document.getElementById('bcffEnviar');
    setTimeout(() => eq.focus(), 60);
    const buscar = document.getElementById('bcffBuscar');
    if (buscar) buscar.addEventListener('click', () => {
      try { abrirBuscadorArticulos(null, a => { if (!a) return; eq.value = String(a.descripcion || a.nombre || '').trim(); const p = nivel1(a); if (p > 0) pr.value = p; pr.focus(); }); } catch (e) { window.toastError?.('No se pudo abrir el buscador de artículos.'); }
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const equipo = eq.value.trim(), precio = Number(pr.value);
      if (!equipo) return eq.focus();
      if (!(precio > 0)) return pr.focus();
      const inf = document.getElementById('bcffInformado');
      if (inf && !inf.checked) { window.toast?.('Antes de enviar, informe al cliente el equipo y el precio y marque la casilla de confirmación.', 'error'); return inf.focus(); }
      const prueba = !!(document.getElementById('bcffPrueba') || {}).checked;
      const modo = ((document.getElementById('bcffModo') || {}).value === 'flow') ? 'flow' : 'web';
      btn.disabled = true; btn.textContent = 'Enviando…';
      try {
        const { data, error } = await supabaseClient.functions.invoke('whatsapp-flow-financiamiento', { body: { accion: 'enviar', hilo_id: hilo, equipo, precio, prueba, modo, empleado_nombre: (typeof sessionUser !== 'undefined' && sessionUser && sessionUser.nombre) || null } });
        let d = data;
        if (error && error.context && typeof error.context.json === 'function') { try { d = await error.context.json(); } catch (e2) {} }
        if (!d || d.ok !== true) {
          const msg = (d && (d.mensaje || d.error)) || (error && error.message) || 'No se pudo enviar el formulario.';
          throw new Error(msg === 'ventana_cerrada' ? (d && d.mensaje) || msg : msg);
        }
        window.toast?.((d.canal === 'web' ? '📋 Enlace del formulario enviado al cliente' : '📋 Formulario enviado al cliente') + (d.borrador ? ' (prueba)' : '') + '. Cuando lo llene, los datos aparecen en el chat.');
        try { document.getElementById('modalGenerico')?.remove(); } catch (e3) {}
        try { window._waRecargarMensajes?.(); } catch (e4) {}
      } catch (err) {
        window.toastError?.(String(err && err.message || err));
        btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Enviar al cliente';
      }
    });
  }
  window._bcffAbrir = abrir;

  // ---------- Dueño (24-oct): en el celular el formulario va dentro del menú del clip (adjuntar) ----------
  function engancharMenuAdjuntar() {
    if (typeof window._waAsegurarMenuAdjuntar !== 'function' || window._waAsegurarMenuAdjuntar.__bcff) return;
    const orig = window._waAsegurarMenuAdjuntar;
    const envuelto = function () {
      const menu = orig.apply(this, arguments);
      try {
        if (menu && !menu.querySelector('.bcff-adj') && puede()) {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'bcff-adj';
          b.innerHTML = '<i class="ti ti-forms" style="color:#2563eb;"></i> Solicitud de financiamiento';
          b.addEventListener('click', () => { try { window._waCerrarFlotantesDelChat?.(); } catch (e) {} abrir(); });
          menu.appendChild(b);
        }
      } catch (e) {}
      return menu;
    };
    envuelto.__bcff = true; window._waAsegurarMenuAdjuntar = envuelto;
    if (typeof window._waAbrirMenuAdjuntar === 'function' && !window._waAbrirMenuAdjuntar.__bcff) {
      const origAbrir = window._waAbrirMenuAdjuntar;
      const abrirEnv = function (ev) {
        const r = origAbrir.apply(this, arguments);
        try { // el original calcula la altura para 7 filas; con la fila nueva se recoloca con la altura real
          const menu = document.getElementById('waAdjuntarMenu'), btn = ev && ev.currentTarget;
          if (menu && btn && menu.style.display === 'flex') { const rb = btn.getBoundingClientRect(); let top = rb.top - menu.offsetHeight - 6; if (top < 8) top = rb.bottom + 6; menu.style.top = top + 'px'; }
        } catch (e) {}
        return r;
      };
      abrirEnv.__bcff = true; window._waAbrirMenuAdjuntar = abrirEnv;
    }
  }
  engancharMenuAdjuntar();

  // ---------- Arranque: esperar a que el chat exista ----------
  let intentos = 0;
  const t = setInterval(() => {
    intentos++;
    const listo = envolverRender();
    ponerBoton();
    engancharMenuAdjuntar();
    if ((listo && document.getElementById('btnWaFlowFin')) || intentos > 300) clearInterval(t);
  }, 250);
  new MutationObserver(() => ponerBoton()).observe(document.documentElement, { childList: true, subtree: true });
})();
