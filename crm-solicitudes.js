/* BAYOL CELL · 24-oct-2026 · Pestaña «Solicitudes» del CRM: seguimiento de las solicitudes de financiamiento externo (banco).
   Dueño: «vamos a ponerlo en el CRM para que los empleados le den seguimiento constante»; «pon solamente Solicitudes, no ponga logo».
   Lee fin_solicitudes_whatsapp (lo que el cliente llenó en bayolcell.com/solicitud o en el formulario de WhatsApp) y cambia el
   paso con la RPC fin_solicitud_seguimiento (Recibida → Enviada al banco → Aprobada / No aprobada → Entregada), que guarda
   quién y cuándo. «Avisar al cliente» abre el chat con el mensaje escrito; el empleado lo revisa y lo envía él mismo.
   Capa aislada y reversible: apagar con localStorage.bc_solicitudes_off='1'. */
(() => {
  'use strict';
  if (window.__bcSolicitudes) return;
  try { if (localStorage.getItem('bc_solicitudes_off') === '1') return; } catch (e) {}
  window.__bcSolicitudes = '20261025-s4';

  const PASOS = [
    ['recibida', 'Recibida', 'rec', 'El cliente llenó la solicitud'],
    ['banco', 'Enviada al banco', 'ban', 'Se la pasamos al banco'],
    ['aprobada', 'Aprobada', 'apr', 'El banco la aprobó'],
    ['no_aprobada', 'Rechazada', 'no', 'El banco no la aprobó'],
    ['entregada', 'Entregada', 'ent', 'El cliente retiró su equipo'],
    ['cancelada', 'Cancelada', 'can', 'El cliente desistió o se anuló'],
  ];
  const SIN_LLENAR = ['sin_llenar', 'Sin llenar', 'sin', 'Esperando que el cliente la llene'];
  const SUCURSALES = ['Santiago', 'Moca', 'Navarrete'];
  const COLS = 'id,numero,estado,canal,sucursal_id,sucursal_nombre,enviado_por_nombre,equipo,precio,datos,referencia,hilo_id,linea_id,telefono,creado_en,respondido_en,vence_en,seguimiento,seguimiento_en,seguimiento_historial,responsable_tipo,responsable_id,responsable_nombre,proxima_gestion_en,proxima_accion';

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const db = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const admin = () => { try { return typeof isAdminUser === 'function' && !!isAdminUser(); } catch (e) { return false; } };
  const aviso = (t, tipo) => { try { if (typeof toast === 'function') toast(t, tipo || 'success'); } catch (e) {} };
  const avisoError = t => { try { if (typeof toastError === 'function') toastError(t); else aviso(t, 'error'); } catch (e) {} };
  const fecha = v => { try { return new Date(v).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }).replace('.', ''); } catch (e) { return ''; } };
  const fechaHora = v => { try { return new Date(v).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).replace('.', ''); } catch (e) { return ''; } };
  const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || '';
  function fmtCedula(v) { const d = String(v || '').replace(/\D/g, ''); return d.length === 11 ? d.slice(0, 3) + '-' + d.slice(3, 10) + '-' + d.slice(10) : String(v || ''); }
  function fmtTel(v) { let d = String(v || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : String(v || ''); }
  function plata(v) { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return n > 0 ? 'RD$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; }

  let filas = [], suc = null, est = 'todas', band = 'hoy', responsables = {}, selG = { cuando: null, que: null }, q = '', abierta = null, cargando = false, guardando = false;

  // ---------- Estilos (solo esta pestaña y su ficha) ----------
  const css = document.createElement('style');
  css.id = 'bcsolCss';
  css.textContent = `
#crmLineaTabSolicitudes .bcsol-badge{margin-left:5px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e31e24;color:#fff;font-size:10.5px;font-weight:800;line-height:18px;text-align:center;display:inline-block}
#crmLineaTabSolicitudes.on .bcsol-badge{background:#fff;color:#1d4ed8}
@media (min-width:1025px){#v-crmLinea .crm-tabs-track{flex-basis:380px!important;min-width:330px!important}}
#crmLinea-solicitudes{--s-ink:#0f172a;--s-mut:#64748b;--s-line:#e2e8f0;--s-azul:#2563eb;display:flex;flex-direction:column;gap:8px;min-height:0;flex:1;overflow:auto;padding-bottom:16px}
#crmLinea-solicitudes[style*="display: none"]{display:none!important}
.bcsol-sub{font-size:13px;color:var(--s-mut);margin:2px 2px 0}.bcsol-sub b{color:var(--s-ink)}
.bcsol-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 1px}.bcsol-chips::-webkit-scrollbar{display:none}
.bcsol-chip{flex:0 0 auto;min-height:44px;padding:0 15px;border:1.5px solid var(--s-line);border-radius:999px;background:#fff;font:inherit;font-size:14px;font-weight:600;color:var(--s-ink);cursor:pointer;display:flex;align-items:center;gap:8px;transition:transform .16s ease-out,background .2s,border-color .2s,color .2s}
.bcsol-chip:active{transform:scale(.96)}
.bcsol-chip .n{background:rgba(15,23,42,.07);border-radius:999px;padding:1px 8px;font-size:12px}
.bcsol-chip.on{background:var(--s-azul);border-color:var(--s-azul);color:#fff}.bcsol-chip.on .n{background:rgba(255,255,255,.25)}
.bcsol-est .bcsol-chip{font-size:13px;padding:0 13px}.bcsol-est .bcsol-chip.on{background:var(--s-ink);border-color:var(--s-ink)}
.bcsol-busca input{box-sizing:border-box;width:100%;min-height:48px;border:1.5px solid var(--s-line);border-radius:14px;padding:0 14px 0 42px;font:inherit;font-size:16px;color:var(--s-ink);background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='M13 13l4 4'/%3E%3C/svg%3E") 14px center no-repeat}
.bcsol-busca input:focus{outline:0;border-color:var(--s-azul);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.bcsol-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.bcsol-fila{background:#fff;border:1px solid #e6edf6;border-radius:16px;padding:12px 14px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 22px rgba(15,23,42,.06);display:grid;grid-template-columns:1fr auto;gap:4px 10px;cursor:pointer;text-align:left;font:inherit;color:var(--s-ink);width:100%;min-height:44px;transition:transform .16s ease-out,border-color .2s}
.bcsol-fila:active{transform:scale(.985)}
@media (hover:hover){.bcsol-fila:hover{border-color:#bfdbfe}}
.bcsol-fila .nom{font-weight:700;font-size:15.5px;letter-spacing:-.01em}
.bcsol-fila .eq{color:#475569;font-size:13.5px;grid-column:1/-1}
.bcsol-fila .meta{color:var(--s-mut);font-size:12.5px;grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap}
.bcsol-pill{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.bcsol-pill i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.bcsol-p-rec{background:#f1f5f9;color:#475569}.bcsol-p-ban{background:#fef3c7;color:#b45309}.bcsol-p-apr{background:#f0fdf4;color:#15803d}.bcsol-p-no{background:#fef2f2;color:#b91c1c}.bcsol-p-ent{background:#eff6ff;color:#2563eb}.bcsol-p-can{background:#f1f5f9;color:#64748b;text-decoration:line-through}.bcsol-p-sin{background:#fff;color:#64748b;border:1px dashed #cbd5e1}
.bcsol-vacio{text-align:center;color:var(--s-mut);padding:36px 16px;font-size:14.5px;grid-column:1/-1}
.bcsol-velo{position:fixed;inset:0;background:rgba(15,23,42,.38);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .22s ease-out;z-index:100040}
.bcsol-velo.on{opacity:1;pointer-events:auto}
.bcsol-hoja{position:fixed;left:0;right:0;bottom:0;max-height:92dvh;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -10px 40px rgba(15,23,42,.22);transform:translateY(100%);transition:transform .32s cubic-bezier(.32,.72,0,1);display:flex;flex-direction:column;overflow:hidden;z-index:100041;color:#0f172a;font-size:15px}
.bcsol-hoja.on{transform:none}
@media (min-width:768px){.bcsol-hoja{left:50%;right:auto;bottom:auto;top:50%;width:min(560px,94vw);max-height:88vh;border-radius:20px;transform:translate(-50%,-46%) scale(.97);opacity:0;transition:transform .22s ease-out,opacity .22s ease-out;pointer-events:none}.bcsol-hoja.on{transform:translate(-50%,-50%);opacity:1;pointer-events:auto}.bcsol-hoja .asa{display:none}}
.bcsol-hoja .asa{width:44px;height:5px;border-radius:3px;background:#cbd5e1;margin:10px auto 0;flex:0 0 auto}
.bcsol-hoja .cab{display:flex;align-items:center;gap:10px;padding:12px 18px 6px}
.bcsol-hoja .cab h2{margin:0;font-size:19px;letter-spacing:-.015em;flex:1}
.bcsol-hoja .x{width:44px;height:44px;border:0;border-radius:50%;background:#f1f5f9;font-size:18px;color:#475569;cursor:pointer;flex:0 0 auto}
.bcsol-hoja .cuerpo{overflow:auto;padding:0 18px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px}
.bcsol-hoja .cuerpo>*{flex-shrink:0}
.bcsol-hoja .x svg{width:18px;height:18px;display:block;margin:auto}
.bcsol-sec{font-size:13px;font-weight:700;color:#64748b;margin:6px 0 -4px}
.bcsol-rec{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
.bcsol-rec .r{display:flex;justify-content:space-between;gap:12px;padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14.5px;min-height:44px;align-items:center;box-sizing:border-box}
.bcsol-rec .r:last-child{border-bottom:0}
.bcsol-rec .r span:first-child{color:#64748b;flex:0 0 auto}
.bcsol-rec .r span:last-child{font-weight:600;text-align:right;word-break:break-word}
.bcsol-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bcsol-btn{min-height:48px;border:1.5px solid #e2e8f0;border-radius:14px;background:#fff;font:inherit;font-size:14px;font-weight:700;color:#2563eb;cursor:pointer;transition:transform .16s ease-out;padding:0 10px}
.bcsol-btn:active{transform:scale(.97)}
.bcsol-btn.ancho{grid-column:1/-1}
.bcsol-btn.prim{grid-column:1/-1;min-height:54px;border:0;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font-size:16px;box-shadow:0 8px 20px rgba(18,140,126,.25)}
.bcsol-btn.ok{background:#dcfce7;border-color:#86efac;color:#166534}
.bcsol-pasos{display:flex;flex-direction:column;gap:8px}
.bcsol-paso{display:flex;align-items:center;gap:12px;min-height:54px;padding:6px 12px;border:1.5px solid #e2e8f0;border-radius:14px;background:#fff;cursor:pointer;font:inherit;font-size:15px;font-weight:600;color:#0f172a;text-align:left;transition:transform .16s ease-out,border-color .2s,background .2s}
.bcsol-paso:active{transform:scale(.98)}
.bcsol-paso:disabled{cursor:default}
.bcsol-paso .dot{width:26px;height:26px;border-radius:50%;border:2px solid #cbd5e1;display:grid;place-items:center;flex:0 0 auto;font-size:13px;color:#fff;box-sizing:border-box}
.bcsol-paso.hecho .dot{background:#15803d;border-color:#15803d}.bcsol-paso.hecho .dot::after{content:"✓"}
.bcsol-paso.actual{border-color:#2563eb;background:#eff6ff}.bcsol-paso.actual .dot{border-color:#2563eb;background:#2563eb}.bcsol-paso.actual .dot::after{content:"●";font-size:9px}
.bcsol-paso.no.actual{border-color:#b91c1c;background:#fef2f2}.bcsol-paso.no.actual .dot{border-color:#b91c1c;background:#b91c1c}
.bcsol-paso.no:not(.actual) .dot{border-color:#fca5a5}.bcsol-paso.can.actual{border-color:#475569;background:#f1f5f9}.bcsol-paso.can.actual .dot{border-color:#475569;background:#475569}
.bcsol-hist{margin:0;padding:0 0 0 18px;display:flex;flex-direction:column;gap:6px;font-size:14px;color:#0f172a}.bcsol-hist span{color:#64748b;font-size:13px}.bcsol-hist small{display:block;color:#64748b;font-size:12.5px}
.bcsol-b-hoy.on{background:#b45309!important;border-color:#b45309!important}.bcsol-b-atr.on{background:#b91c1c!important;border-color:#b91c1c!important}.bcsol-chip .n.rojo{background:#fee2e2;color:#b91c1c}
.bcsol-prox{grid-column:1/-1;display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:8px;border-top:1px dashed #e2e8f0;font-size:13px;color:#475569}
.bcsol-prox .que{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bcsol-ava{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;color:#fff;flex:0 0 auto}.bcsol-ava.grande{width:40px;height:40px;font-size:14px}
.bcsol-cuando{font-weight:700;border-radius:999px;padding:2px 8px;font-size:12px;white-space:nowrap}
.c-hoy{background:#fef3c7;color:#b45309}.c-atr{background:#fee2e2;color:#b91c1c}.c-ok{background:#f1f5f9;color:#475569}.c-sin{background:#fff;border:1px dashed #cbd5e1;color:#64748b}
.bcsol-gest{border:1.5px solid #e2e8f0;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:12px;background:#fbfcfe}
.bcsol-gest .fila2{display:flex;align-items:flex-end;gap:10px}.bcsol-gest .campo{display:flex;flex-direction:column;gap:6px;flex:1;margin:0}
.bcsol-hoja .bcsol-gest .campo,.bcsol-hoja .bcsol-gest .campo *{text-transform:none!important;letter-spacing:0!important}
.bcsol-hoja .bcsol-gest .campo>span,.bcsol-hoja .bcsol-gest .lbl{text-transform:none!important;letter-spacing:0!important;font-size:13px;font-weight:600;color:#475569;display:block;margin-bottom:6px}.bcsol-gest .lbl em{font-style:normal;font-weight:500;color:#64748b}
.bcsol-gest select,.bcsol-gest textarea{box-sizing:border-box;width:100%;min-height:48px;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;background:#fff;color:#0f172a}
.bcsol-gest textarea{min-height:72px;resize:vertical}
.bcsol-opc{display:flex;gap:8px;flex-wrap:wrap}
.bcsol-opc button{min-height:44px;padding:0 14px;border-radius:999px;border:1.5px solid #e2e8f0;background:#fff;font:inherit;font-size:14px;font-weight:600;color:#0f172a;cursor:pointer}
.bcsol-opc button.on{background:#2563eb;border-color:#2563eb;color:#fff}
.bcsol-btn.azul{min-height:54px;border:0;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:16px;box-shadow:0 8px 20px rgba(37,99,235,.25)}
.bcsol-hist li.g b{color:#2563eb}
.bcsol-cierre{font-size:13px;font-weight:600;color:#64748b;margin:6px 2px -2px}
.bcsol-paso .txt{flex:1;min-width:0}.bcsol-paso small{display:block;font-weight:500;color:#64748b;font-size:12.5px}
.bcsol-msg{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:12px 14px;font-size:14px;color:#14532d;line-height:1.45;white-space:pre-line}
.bcsol-msg.no{background:#fef2f2;border-color:#fecaca;color:#7f1d1d}
.bcsol-cargando{opacity:.55;pointer-events:none}
@media (prefers-reduced-motion:reduce){.bcsol-fila,.bcsol-hoja,.bcsol-velo,.bcsol-chip,.bcsol-paso,.bcsol-btn{transition:none}}
`;
  document.head.appendChild(css);

  // ---------- Datos ----------
  const paso = k => PASOS.find(p => p[0] === k) || PASOS[0];
  const clave = s => (s.estado === 'respondido' ? (s.seguimiento || 'recibida') : 'sin_llenar');
  const info = k => (k === 'sin_llenar' ? SIN_LLENAR : paso(k));
  const enProceso = s => s.estado === 'respondido' && ['recibida', 'banco', 'aprobada'].includes(s.seguimiento || 'recibida'); // auditoría S09: aprobada = falta entregar
  const cerrada = s => s.estado === 'respondido' && ['no_aprobada', 'entregada', 'cancelada'].includes(s.seguimiento);
  // 25-oct: responsable y próxima gestión (maqueta aprobada por el dueño).
  const ACCIONES = ['Pasar la solicitud al banco', 'Llamar al cliente', 'Preguntar al banco', 'Esperar respuesta del banco', 'Avisar al cliente y citarlo para retirar', 'Otro'];
  const CUANDO = [['hoy', 'Hoy en la tarde'], ['man', 'Mañana'], ['3d', 'En 3 días'], ['sem', 'En una semana']];
  const COLORES = ['#2563eb', '#7c3aed', '#0d9488', '#db2777', '#ea580c', '#0891b2', '#65a30d'];
  const colorDe = n => { let h = 0; for (const ch of String(n || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return COLORES[h % COLORES.length]; };
  const iniciales = n => String(n || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  function finDeHoy() { const f = new Date(); f.setHours(23, 59, 59, 999); return f; }
  function bandaDe(s) {
    if (s.estado !== 'respondido') return 'sin_llenar';
    if (cerrada(s)) return 'cerrada';
    if (!s.responsable_id) return 'sin';
    if (!s.proxima_gestion_en) return 'sin';
    const t = new Date(s.proxima_gestion_en).getTime();
    if (t < Date.now()) return 'atr';
    if (t <= finDeHoy().getTime()) return 'hoy';
    return 'ok';
  }
  function enBanda(s, b) { const t = bandaDe(s); if (b === 'hoy') return t === 'hoy' || t === 'atr'; if (b === 'abiertas') return ['hoy', 'atr', 'ok', 'sin'].includes(t); if (b === 'cerradas') return t === 'cerrada'; return t === b; }
  function cuandoHtml(s) {
    const t = bandaDe(s); if (t === 'cerrada' || t === 'sin_llenar') return '';
    if (t === 'sin') return `<span class="bcsol-cuando c-sin">${s.responsable_id ? 'Sin fecha' : 'Sin responsable'}</span>`;
    const f = new Date(s.proxima_gestion_en);
    if (t === 'atr') { const dd = Math.max(1, Math.round((Date.now() - f.getTime()) / 86400000)); return `<span class="bcsol-cuando c-atr">${(Date.now() - f.getTime()) < 86400000 ? 'Atrasada' : `Atrasada ${dd} día${dd > 1 ? 's' : ''}`}</span>`; }
    if (t === 'hoy') return `<span class="bcsol-cuando c-hoy">Hoy ${esc(f.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' }))}</span>`;
    return `<span class="bcsol-cuando c-ok">${esc(fechaHora(f))}</span>`;
  }
  function d(s) { return (s && s.datos) || {}; }
  function nombre(s) { return d(s).nombres || (s.estado === 'respondido' ? 'Sin nombre' : fmtTel(s.telefono) || 'Cliente'); }
  function sucursalDe(s) { return s.sucursal_nombre || 'Sin sucursal'; }
  function plazoTxt(s) { const p = String(d(s).plazo || '').replace(/\D/g, ''); return p ? p + ' meses' : ''; }
  function precioTxt(s) { return d(s).precio || plata(s.precio); }
  function referencia(s) { return d(s).referencia || s.referencia || [s.sucursal_nombre, s.enviado_por_nombre, [s.equipo, plata(s.precio)].filter(Boolean).join(' ')].filter(Boolean).join(' · '); }
  function direccion(s) { const x = d(s); return [x.calle ? 'Calle ' + x.calle : '', x.casa ? 'No. ' + x.casa : '', x.sector, x.municipio, x.provincia].filter(Boolean).join(', '); }
  function textoCompleto(s) {
    const x = d(s), ref = referencia(s);
    return ['SOLICITUD DE FINANCIAMIENTO – BAYOL CELL', ref ? `Referencia: ${ref}` : '', '',
      `Cédula: ${fmtCedula(x.cedula)}`, `Nombre: ${x.nombres || ''}`, `Teléfono: ${fmtTel(x.telefono || s.telefono)}`,
      `Dirección: ${direccion(s)}`, '', `Equipo: ${x.equipo || s.equipo || ''}`, `Monto: ${precioTxt(s)}`, plazoTxt(s) ? `Plazo deseado: ${plazoTxt(s)}` : ''].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function mensajeCliente(s) {
    const n = primerNombre(nombre(s)), eq = d(s).equipo || s.equipo || 'equipo', emp = primerNombre(s.enviado_por_nombre);
    if (s.seguimiento === 'aprobada') return `${n}, buenas noticias: el banco aprobó su solicitud del ${eq}. ✅\nPuede pasar por Bayol Cell ${sucursalDe(s)} con su cédula para firmar y retirar su equipo.${emp ? `\n${emp} · Bayol Cell ${sucursalDe(s)}` : ''}`;
    if (s.seguimiento === 'no_aprobada') return `${n}, el banco nos informa que esta vez su solicitud no fue aprobada. Si desea más detalles, puede comunicarse directamente con el banco.${emp ? `\n${emp} · Bayol Cell ${sucursalDe(s)}` : ''}`;
    return '';
  }

  async function cargar() {
    const c = db(); if (!c) return;
    // Auditoría S06 (25-oct-2026): las abiertas se traen TODAS (sin tope); de las cerradas o sin llenar, las 300 más recientes.
    const [abiertas, resto] = await Promise.all([
      c.from('fin_solicitudes_whatsapp').select(COLS).eq('estado', 'respondido').in('seguimiento', ['recibida', 'banco', 'aprobada']).order('creado_en', { ascending: false }),
      c.from('fin_solicitudes_whatsapp').select(COLS).order('creado_en', { ascending: false }).limit(300),
    ]);
    if (abiertas.error) throw abiertas.error;
    if (resto.error) throw resto.error;
    const vistos = new Set(); const data = [];
    [...(abiertas.data || []), ...(resto.data || [])].forEach(x => { if (!vistos.has(x.id)) { vistos.add(x.id); data.push(x); } });
    data.sort((a, b) => String(b.creado_en).localeCompare(String(a.creado_en)));
    const ahora = Date.now();
    filas = (data || []).filter(s => s.estado === 'respondido' || (s.estado === 'enviado' && (!s.vence_en || new Date(s.vence_en).getTime() > ahora)));
    if (abierta) { const fresca = filas.find(x => x.id === abierta.id); if (fresca && fresca !== abierta) { const cambio = fresca.seguimiento !== abierta.seguimiento; abierta = fresca; if (hoja && hoja.classList.contains('on')) { pintarHoja(); if (cambio) aviso(`Otro compañero actualizó la solicitud No. ${fresca.numero}.`, 'info'); } } }
    pintarBadge();
  }
  function pintarBadge() {
    const b = document.getElementById('crmSolTabBadge'); if (!b) return;
    const n = filas.filter(s => ['hoy', 'atr'].includes(bandaDe(s))).length;
    b.textContent = n > 99 ? '99+' : String(n); b.style.display = n ? '' : 'none';
  }
  async function contarPronto() { try { await cargar(); } catch (e) { /* sin permiso o sin conexión: la pestaña lo dirá al abrirla */ } }

  // ---------- Lista ----------
  function sucursalInicial() {
    if (suc) return suc;
    if (admin()) return (suc = 'Todas');
    try {
      const id = typeof _waMiSucursal === 'function' ? _waMiSucursal() : null;
      const f = id && filas.find(s => String(s.sucursal_id) === String(id));
      if (f && f.sucursal_nombre) return (suc = f.sucursal_nombre);
    } catch (e) {}
    return (suc = 'Todas');
  }
  function filtradas() {
    const t = q.trim().toLowerCase().replace(/[-\s]/g, '');
    return filas.filter(s => (suc === 'Todas' || sucursalDe(s) === suc) && (t ? true : enBanda(s, band)) &&
      (!t || [nombre(s), d(s).cedula, d(s).telefono, s.telefono, String(s.numero), d(s).equipo || s.equipo].join(' ').toLowerCase().replace(/[-\s]/g, '').includes(t)));
  }
  function pill(k) { const i = info(k); return `<span class="bcsol-pill bcsol-p-${i[2]}"><i></i>${esc(i[1])}</span>`; }
  function pintar() {
    const cont = document.getElementById('crmLinea-solicitudes'); if (!cont) return;
    sucursalInicial();
    const extra = [...new Set(filas.map(sucursalDe))].filter(x => !SUCURSALES.includes(x));
    const sucs = ['Todas', ...SUCURSALES, ...extra];
    const chipsSuc = sucs.map(x => { const n = filas.filter(s => (x === 'Todas' || sucursalDe(s) === x) && !cerrada(s)).length; return `<button type="button" class="bcsol-chip${suc === x ? ' on' : ''}" data-bcsol-suc="${esc(x)}">${esc(x)}<span class="n">${n}</span></button>`; }).join('');
    const base = filas.filter(s => suc === 'Todas' || sucursalDe(s) === suc);
    const BANDAS = [['hoy', 'Atender hoy', 'hoy'], ['atr', 'Atrasadas', 'atr'], ['sin', 'Sin responsable', ''], ['abiertas', 'Todas abiertas', ''], ['cerradas', 'Cerradas', ''], ['sin_llenar', 'Sin llenar', '']];
    const chipsEst = BANDAS.map(([k, t, c]) => { const n = base.filter(s => enBanda(s, k)).length; if (k === 'sin_llenar' && !n && band !== k) return ''; return `<button type="button" class="bcsol-chip bcsol-b-${c || 'n'}${band === k ? ' on' : ''}" data-bcsol-band="${k}">${esc(t)}<span class="n${k === 'atr' && n ? ' rojo' : ''}">${n}</span></button>`; }).join('');
    const lista = filtradas().sort((a, b) => { const fa = a.proxima_gestion_en ? new Date(a.proxima_gestion_en).getTime() : 9e15, fb = b.proxima_gestion_en ? new Date(b.proxima_gestion_en).getTime() : 9e15; return fa - fb || String(b.creado_en).localeCompare(String(a.creado_en)); });
    const filasHtml = lista.length ? lista.map(s => {
      const eq = [d(s).equipo || s.equipo, precioTxt(s), plazoTxt(s)].filter(Boolean).join(' · ');
      return `<button type="button" class="bcsol-fila" data-bcsol-id="${esc(s.id)}"><span class="nom">${esc(nombre(s))}</span><span>${pill(clave(s))}</span><span class="eq">${esc(eq)}</span><span class="meta"><span>No. ${esc(s.numero)}</span><span>${esc(fecha(s.respondido_en || s.creado_en))}</span><span>${esc(sucursalDe(s))}</span></span>${['hoy', 'atr', 'ok', 'sin'].includes(bandaDe(s)) ? `<span class="bcsol-prox">${s.responsable_nombre ? `<span class="bcsol-ava" style="background:${colorDe(s.responsable_nombre)}">${esc(iniciales(s.responsable_nombre))}</span>` : '<span class="bcsol-ava" style="background:#cbd5e1">?</span>'}<span class="que">${s.responsable_nombre ? esc(primerNombre(s.responsable_nombre)) + ' · ' + esc(s.proxima_accion || 'Sin próxima acción') : 'Nadie la tiene asignada'}</span>${cuandoHtml(s)}</span>` : ''}</button>`;
    }).join('') : `<div class="bcsol-vacio">${filas.length ? (band === 'hoy' && !q ? 'Nada pendiente para hoy. 👌' : 'No hay solicitudes con ese filtro.') : 'Todavía no hay solicitudes. Se envían desde el chat con el clip 📎 › «Solicitud de financiamiento».'}</div>`;
    const enProc = filas.filter(s => ['hoy', 'atr'].includes(bandaDe(s)) && (suc === 'Todas' || sucursalDe(s) === suc)).length;
    const busca = cont.querySelector('.bcsol-busca input');
    const teniaFoco = busca && document.activeElement === busca;
    cont.innerHTML = `<div class="bcsol-sub">Solicitudes de financiamiento · <b>${enProc}</b> por atender hoy${suc !== 'Todas' ? ' en ' + esc(suc) : ''}</div>
      <div class="bcsol-chips" role="group" aria-label="Sucursal">${chipsSuc}</div>
      <div class="bcsol-chips bcsol-est" role="group" aria-label="Bandeja">${chipsEst}</div>
      <div class="bcsol-busca"><input type="search" placeholder="Buscar por nombre, cédula o número" autocomplete="off" value="${esc(q)}" aria-label="Buscar solicitud"></div>
      <div class="bcsol-lista">${filasHtml}</div>`;
    if (teniaFoco) { const i = cont.querySelector('.bcsol-busca input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }
  async function render() {
    const cont = document.getElementById('crmLinea-solicitudes'); if (!cont) return;
    if (!filas.length && !cargando) cont.innerHTML = '<div class="bcsol-vacio">Cargando solicitudes…</div>';
    cargando = true;
    try { await cargar(); pintar(); }
    catch (e) { try { logError && logError('crm-solicitudes', e); } catch (x) {} cont.innerHTML = '<div class="bcsol-vacio">No se pudieron cargar las solicitudes. Revise la conexión y toque la pestaña otra vez.</div>'; }
    finally { cargando = false; }
  }

  // ---------- Ficha ----------
  let velo = null, hoja = null;
  function asegurarHoja() {
    if (hoja) return;
    velo = document.createElement('div'); velo.className = 'bcsol-velo'; velo.addEventListener('click', cerrar);
    hoja = document.createElement('div'); hoja.className = 'bcsol-hoja'; hoja.setAttribute('role', 'dialog'); hoja.setAttribute('aria-modal', 'true');
    hoja.innerHTML = '<div class="asa"></div><div class="cab"><h2 id="bcsolTit">Solicitud</h2><button type="button" class="x" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="cuerpo" id="bcsolCuerpo"></div>';
    hoja.querySelector('.x').addEventListener('click', cerrar);
    hoja.addEventListener('click', clicHoja);
    document.body.appendChild(velo); document.body.appendChild(hoja);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && hoja.classList.contains('on')) cerrar(); });
  }
  function abrir(id) {
    const s = filas.find(x => String(x.id) === String(id)); if (!s) return;
    asegurarHoja(); abierta = s; selG = { cuando: null, que: null }; pintarHoja(); cargarResponsables(s);
    requestAnimationFrame(() => { velo.classList.add('on'); hoja.classList.add('on'); });
  }
  function cerrar() { if (!hoja) return; velo.classList.remove('on'); hoja.classList.remove('on'); abierta = null; }
  function pintarHoja() {
    const s = abierta; if (!s || !hoja) return;
    hoja.querySelector('#bcsolTit').textContent = `Solicitud No. ${s.numero}`;
    const x = d(s), k = clave(s), lleno = s.estado === 'respondido';
    const hist = Array.isArray(s.seguimiento_historial) ? s.seguimiento_historial : [];
    const ultimo = p => [...hist].reverse().find(h => h && h.paso === p);
    const orden = ['recibida', 'banco', 'aprobada', 'entregada'];
    const cur = s.seguimiento || 'recibida';
    // Hasta dónde llegó por el camino normal (si está Rechazada o Cancelada, el último paso normal que se marcó).
    let idx = orden.indexOf(cur);
    if (idx < 0) { idx = 0; hist.forEach(h => { const i = orden.indexOf(h && h.paso); if (i > idx) idx = i; }); }
    const subtexto = p => {
      if (p === 'recibida') return `${fechaHora(s.respondido_en || s.creado_en)} · ${s.canal === 'web' ? 'Página web' : 'WhatsApp'}`;
      const h = ultimo(p); if (h) return `${fechaHora(h.en)} · ${h.por || ''}`;
      return paso(p)[3];
    };
    const boton = (p, hecho) => {
      const actual = p === cur;
      const cls = (actual ? ' actual' : '') + (hecho ? ' hecho' : '') + (p === 'no_aprobada' ? ' no' : '') + (p === 'cancelada' ? ' can' : '');
      return `<button type="button" class="bcsol-paso${cls}" data-bcsol-paso="${p}"${actual ? ' disabled' : ''}><span class="dot"></span><span class="txt">${esc(paso(p)[1])}<small>${esc(actual || hecho ? subtexto(p) : paso(p)[3])}</small></span></button>`;
    };
    let pasos = '';
    if (lleno) {
      pasos = orden.map((p, i) => boton(p, p !== cur && i <= idx)).join('')
        + '<div class="bcsol-cierre">Si no sigue adelante</div>'
        + boton('no_aprobada', false) + boton('cancelada', false);
    }
    // Auditoría S12: historial completo, en orden, con quién, cuándo y la nota si hubo.
    const historialHtml = hist.length ? `<div class="bcsol-sec">Historial de cambios</div><ol class="bcsol-hist">${hist.map(h => h.paso === 'gestion' ? `<li class="g"><b>Gestión</b> <span>${h.responsable_antes && h.responsable_antes !== h.responsable ? 'responsable: ' + esc(h.responsable) + ' · ' : ''}próxima: ${esc(String(h.accion || '').toLowerCase())} (${esc(fechaHora(h.proxima))})</span><small>${esc(fechaHora(h.en))}${h.por ? ' · ' + esc(h.por) : ''}${h.nota ? ' · «' + esc(h.nota) + '»' : ''}</small></li>` : `<li><b>${esc(paso(h.paso)[1])}</b>${h.de ? ` <span>(antes: ${esc(paso(h.de)[1])})</span>` : ''}<small>${esc(fechaHora(h.en))}${h.por ? ' · ' + esc(h.por) : ''}${h.nota ? ' · «' + esc(h.nota) + '»' : ''}</small></li>`).join('')}</ol>` : '';
    const msg = mensajeCliente(s);
    const avisar = msg ? `<div class="bcsol-sec">Avisar al cliente</div><div class="bcsol-msg${s.seguimiento === 'no_aprobada' ? ' no' : ''}">${esc(msg)}</div>
      <div class="bcsol-acts"><button type="button" class="bcsol-btn prim" data-bcsol-act="avisar">Escribir el aviso en el chat</button></div>` : '';
    hoja.querySelector('#bcsolCuerpo').innerHTML = lleno ? `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${pill(k)}<span style="color:#64748b;font-size:13px">${esc(sucursalDe(s))}${s.enviado_por_nombre ? ' · ' + esc(s.enviado_por_nombre) : ''}</span></div>
      <div class="bcsol-sec">Datos del cliente</div>
      <div class="bcsol-rec"><div class="r"><span>Nombre</span><span>${esc(x.nombres || '')}</span></div><div class="r"><span>Cédula</span><span>${esc(fmtCedula(x.cedula))}</span></div><div class="r"><span>Celular</span><span>${esc(fmtTel(x.telefono || s.telefono))}</span></div><div class="r"><span>Dirección</span><span>${esc(direccion(s))}</span></div></div>
      <div class="bcsol-sec">Lo que financia</div>
      <div class="bcsol-rec"><div class="r"><span>Equipo</span><span>${esc(x.equipo || s.equipo || '')}</span></div><div class="r"><span>Monto</span><span>${esc(precioTxt(s))}</span></div>${plazoTxt(s) ? `<div class="r"><span>Plazo deseado</span><span>${esc(plazoTxt(s))}</span></div>` : ''}<div class="r"><span>Referencia</span><span style="font-size:13px">${esc(referencia(s))}</span></div></div>
      <div class="bcsol-acts"><button type="button" class="bcsol-btn" data-bcsol-act="chat">Abrir chat</button><button type="button" class="bcsol-btn" data-bcsol-act="ref">Copiar referencia</button><button type="button" class="bcsol-btn ancho" data-bcsol-act="todo">Copiar solicitud completa</button></div>
      ${gestionHtml(s)}
      <div class="bcsol-sec">Seguimiento</div>
      <div class="bcsol-pasos">${pasos}</div>
      ${avisar}
      ${historialHtml}` : `
      <div>${pill(k)}</div>
      <div class="bcsol-rec"><div class="r"><span>Celular</span><span>${esc(fmtTel(s.telefono))}</span></div><div class="r"><span>Equipo</span><span>${esc(s.equipo || '')}</span></div><div class="r"><span>Monto</span><span>${esc(plata(s.precio))}</span></div><div class="r"><span>Enviada</span><span>${esc(fechaHora(s.creado_en))}${s.enviado_por_nombre ? ' · ' + esc(primerNombre(s.enviado_por_nombre)) : ''}</span></div></div>
      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.45">El cliente todavía no ha llenado el formulario. Cuando lo llene, aparecerá aquí como «Recibida».</p>
      <div class="bcsol-acts"><button type="button" class="bcsol-btn ancho" data-bcsol-act="chat">Abrir chat</button></div>`;
  }
  function gestionHtml(s) {
    if (s.estado !== 'respondido' || cerrada(s)) return '';
    const lista = responsables[s.sucursal_id || 'todas'];
    const opciones = lista ? lista.map(r => `<option value="${esc(r.tipo + ':' + r.id)}"${String(r.id) === String(s.responsable_id) ? ' selected' : ''}>${esc(r.nombre)}</option>`).join('') : '';
    const actual = s.responsable_id && lista && !lista.some(r => String(r.id) === String(s.responsable_id)) ? `<option value="${esc(s.responsable_tipo + ':' + s.responsable_id)}" selected>${esc(s.responsable_nombre || 'Responsable')}</option>` : '';
    return `<div class="bcsol-sec">Quién la lleva y qué toca</div>
      <div class="bcsol-gest">
        <div class="fila2">${s.responsable_nombre ? `<span class="bcsol-ava grande" style="background:${colorDe(s.responsable_nombre)}">${esc(iniciales(s.responsable_nombre))}</span>` : ''}<label class="campo"><span>Responsable</span><select id="bcsolResp"><option value="">${lista ? '— Elegir —' : 'Cargando…'}</option>${actual}${opciones}</select></label></div>
        <div><span class="lbl">Próxima gestión${s.proxima_gestion_en ? ` <em>(ahora: ${esc(fechaHora(s.proxima_gestion_en))})</em>` : ''}</span><div class="bcsol-opc">${CUANDO.map(([k, t]) => `<button type="button" data-bcsol-cuando="${k}" class="${selG.cuando === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
        <div><span class="lbl">Qué hay que hacer</span><div class="bcsol-opc">${ACCIONES.map(t => `<button type="button" data-bcsol-que="${esc(t)}" class="${(selG.que || s.proxima_accion) === t ? 'on' : ''}">${esc(t)}</button>`).join('')}</div></div>
        <label class="campo"><span>Qué pasó en esta gestión (opcional)</span><textarea id="bcsolNota" maxlength="300" placeholder="Ej.: Llamé al cliente, no contestó. Le dejé mensaje."></textarea></label>
        <button type="button" class="bcsol-btn azul" data-bcsol-act="gestion">Guardar gestión</button>
      </div>`;
  }
  async function cargarResponsables(s) {
    const k = s.sucursal_id || 'todas'; if (responsables[k]) return;
    const c = db(); if (!c) return;
    try {
      const { data, error } = await c.rpc('fin_solicitud_responsables', { p_sucursal: s.sucursal_id || null });
      if (error) throw error;
      responsables[k] = (data || []).map(r => ({ tipo: r.tipo, id: r.id, nombre: r.nombre }));
    } catch (e) { responsables[k] = []; }
    if (abierta && (abierta.sucursal_id || 'todas') === k) { const nota = (hoja.querySelector('#bcsolNota') || {}).value || ''; pintarHoja(); const n2 = hoja.querySelector('#bcsolNota'); if (n2) n2.value = nota; }
  }
  function fechaDe(k) {
    const f = new Date();
    if (k === 'hoy') { f.setHours(16, 0, 0, 0); if (f.getTime() < Date.now()) f.setTime(Date.now() + 30 * 60000); return f; }
    f.setDate(f.getDate() + (k === 'man' ? 1 : k === '3d' ? 3 : 7)); f.setHours(10, 0, 0, 0); return f;
  }
  async function guardarGestion() {
    const s = abierta; if (!s || guardando) return;
    const sel = hoja.querySelector('#bcsolResp'); const v = sel ? sel.value : '';
    if (!v) { avisoError('Elija el responsable.'); return; }
    if (!selG.cuando) { avisoError('Elija cuándo es la próxima gestión.'); return; }
    const [tipo, id] = v.split(':');
    const nota = ((hoja.querySelector('#bcsolNota') || {}).value || '').trim();
    const c = db(); if (!c) return;
    guardando = true; hoja.classList.add('bcsol-cargando');
    try {
      const { data, error } = await c.rpc('fin_solicitud_gestion', { p_id: s.id, p_responsable_tipo: tipo, p_responsable_id: id, p_proxima: fechaDe(selG.cuando).toISOString(), p_accion: selG.que || s.proxima_accion || 'Llamar al cliente', p_nota: nota || null });
      if (error) throw error;
      const nuevo = Array.isArray(data) ? data[0] : data;
      if (!nuevo || !nuevo.id) throw new Error('El servidor no confirmó la gestión. Recargue la pestaña y vuelva a intentarlo.');
      Object.assign(s, nuevo); selG = { cuando: null, que: null };
      aviso(`Gestión guardada: ${primerNombre(s.responsable_nombre)} · ${fechaHora(s.proxima_gestion_en)}`);
      pintarHoja(); pintar(); pintarBadge();
    } catch (e) { avisoError((e && e.message) || 'No se pudo guardar la gestión.'); }
    finally { guardando = false; hoja.classList.remove('bcsol-cargando'); }
  }
  async function copiar(texto, btn) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(texto);
      else { const ta = document.createElement('textarea'); ta.value = texto; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      if (btn) { const t = btn.textContent; btn.classList.add('ok'); btn.textContent = 'Copiado'; setTimeout(() => { btn.classList.remove('ok'); btn.textContent = t; }, 1400); }
    } catch (e) { avisoError('No se pudo copiar.'); }
  }
  async function cambiarPaso(p) {
    const s = abierta; if (!s || guardando || p === s.seguimiento) return;
    const c = db(); if (!c) return;
    // Auditoría S03: los pasos en orden se marcan directo; cualquier otro cambio es una corrección y pide el motivo.
    const de = s.seguimiento || 'recibida';
    const normal = [['recibida', 'banco'], ['banco', 'aprobada'], ['banco', 'no_aprobada'], ['aprobada', 'entregada']].some(([x, y]) => x === de && y === p)
      || (p === 'cancelada' && ['recibida', 'banco', 'aprobada'].includes(de));
    let nota = null;
    if (!normal) {
      nota = window.prompt(`Va a cambiar de «${paso(de)[1]}» a «${paso(p)[1]}». Escriba el motivo de la corrección:`, '');
      if (nota === null) return;
      nota = String(nota).trim();
      if (!nota) { avisoError('Para corregir el paso hay que escribir el motivo.'); return; }
    } else if (['aprobada', 'no_aprobada', 'entregada', 'cancelada'].includes(p) && !window.confirm(`¿Confirma que la solicitud No. ${s.numero} queda «${paso(p)[1]}»?`)) return;
    guardando = true; hoja.classList.add('bcsol-cargando');
    try {
      const { data, error } = await c.rpc('fin_solicitud_seguimiento', { p_id: s.id, p_seguimiento: p, p_nota: nota });
      if (error) throw error;
      const nuevo = Array.isArray(data) ? data[0] : data;
      if (!nuevo || !nuevo.id || nuevo.seguimiento !== p) throw new Error('El servidor no confirmó el cambio. Toque la pestaña Solicitudes para recargar y vuelva a intentarlo.');
      Object.assign(s, nuevo);
      aviso(`Solicitud No. ${s.numero}: ${paso(p)[1]}`);
      pintarHoja(); pintar(); pintarBadge();
    } catch (e) {
      avisoError((e && e.message) || 'No se pudo guardar el cambio. Intente de nuevo.');
    } finally { guardando = false; hoja.classList.remove('bcsol-cargando'); }
  }

  // ---------- Abrir el chat (y escribir el aviso) ----------
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  async function abrirChat(s, texto) {
    if (!s.hilo_id) { avisoError('Esta solicitud no tiene un chat enlazado.'); return; }
    cerrar();
    try {
      const otraLinea = typeof _crmLineaActualId !== 'undefined' && s.linea_id && String(s.linea_id) !== String(_crmLineaActualId);
      try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); } catch (e) {}
      if (otraLinea && typeof _crmEstructura !== 'undefined' && typeof _crmPoblarLineas === 'function') {
        const sx = _crmEstructura.find(z => (z.lineas || []).some(l => String(l.id) === String(s.linea_id)));
        if (sx) { _crmLineaActualId = s.linea_id; const sel = document.getElementById('crmSelSucursal'); if (sel) sel.value = sx.id; _crmPoblarLineas(sx.id, true); }
        else await window.crmLineaTab('mensajes');
      } else await window.crmLineaTab('mensajes');
      let ok = false;
      for (let i = 0; i < 40; i++) { if (typeof _waHilos !== 'undefined' && _waHilos.some(h => String(h.id) === String(s.hilo_id))) { ok = true; break; } await esperar(150); }
      if (!ok) { avisoError('No encontré ese chat en esta línea. Puede estar asignado a otro compañero.'); return; }
      await abrirHiloWhatsapp(s.hilo_id);
      if (texto) {
        // Auditoría R01 (25-oct-2026): solo se escribe si el chat abierto sigue siendo el de esta solicitud, y sin borrar lo que ya había.
        let escrito = false;
        for (let i = 0; i < 20; i++) {
          const t = document.getElementById('waTexto');
          const mismo = typeof _waHiloId !== 'undefined' && String(_waHiloId) === String(s.hilo_id);
          if (!mismo) break;
          if (t) {
            const previo = String(t.value || '').trim();
            if (previo && previo !== texto.trim() && !window.confirm('Ya hay un mensaje escrito en este chat. ¿Desea reemplazarlo por el aviso del banco?')) { aviso('Se dejó el mensaje que ya estaba escrito.', 'info'); return; }
            t.value = texto; t.dispatchEvent(new Event('input', { bubbles: true })); try { t.focus(); } catch (e) {}
            escrito = true; break;
          }
          await esperar(100);
        }
        if (escrito) aviso('El aviso quedó escrito en el chat. Revíselo y tóquelo para enviarlo.');
        else avisoError('No se escribió el aviso: se cambió de chat o la caja de escribir no estaba lista. Ábralo de nuevo desde la solicitud.');
      }
    } catch (e) { avisoError('No se pudo abrir el chat.'); }
  }
  function clicHoja(e) {
    const p = e.target.closest('[data-bcsol-paso]'); if (p) { cambiarPaso(p.getAttribute('data-bcsol-paso')); return; }
    const cu = e.target.closest('[data-bcsol-cuando]'); if (cu) { selG.cuando = cu.getAttribute('data-bcsol-cuando'); marcarOpc(cu); return; }
    const qq = e.target.closest('[data-bcsol-que]'); if (qq) { selG.que = qq.getAttribute('data-bcsol-que'); marcarOpc(qq); return; }
    const a = e.target.closest('[data-bcsol-act]'); if (!a || !abierta) return;
    const t = a.getAttribute('data-bcsol-act');
    if (t === 'chat') abrirChat(abierta);
    else if (t === 'ref') copiar(referencia(abierta), a);
    else if (t === 'todo') copiar(textoCompleto(abierta), a);
    else if (t === 'avisar') abrirChat(abierta, mensajeCliente(abierta));
    else if (t === 'gestion') guardarGestion();
  }
  function marcarOpc(btn) { [...btn.parentElement.children].forEach(b => b.classList.toggle('on', b === btn)); }

  // ---------- Eventos de la lista ----------
  document.addEventListener('click', e => {
    const cont = document.getElementById('crmLinea-solicitudes');
    if (cont && cont.contains(e.target)) {
      const cs = e.target.closest('[data-bcsol-suc]'); if (cs) { suc = cs.getAttribute('data-bcsol-suc'); pintar(); return; }
      const ce = e.target.closest('[data-bcsol-band]'); if (ce) { band = ce.getAttribute('data-bcsol-band'); pintar(); return; }
      const f = e.target.closest('[data-bcsol-id]'); if (f) { abrir(f.getAttribute('data-bcsol-id')); return; }
    }
    // Desde la tarjeta del chat: «Ver seguimiento»
    const v = e.target.closest('[data-bcsol-ver]');
    if (v) { e.preventDefault(); e.stopPropagation(); verDesdeChat(v.getAttribute('data-bcsol-ver'), v.getAttribute('data-bcsol-token')); }
  }, true);
  document.addEventListener('input', e => {
    if (!e.target.closest || !e.target.closest('#crmLinea-solicitudes .bcsol-busca')) return;
    q = e.target.value; pintar();
  });
  async function verDesdeChat(id, token) {
    try {
      if (!filas.length) await cargar();
      let s = id ? filas.find(x => String(x.id) === String(id)) : null;
      if (!s && id) { const c = db(); const r = c && await c.from('fin_solicitudes_whatsapp').select(COLS).eq('id', id).maybeSingle(); if (r && r.data) { s = r.data; filas.unshift(s); } }
      if (!s && token) { const c = db(); const r = c && await c.from('fin_solicitudes_whatsapp').select(COLS).eq('flow_token', token).maybeSingle(); if (r && r.data) { s = r.data; if (!filas.some(x => x.id === s.id)) filas.unshift(s); } }
      if (!s) { avisoError('No encontré esa solicitud.'); return; }
      abrir(s.id);
    } catch (e) { avisoError('No se pudo abrir el seguimiento.'); }
  }
  window._bcsolVer = verDesdeChat;

  // ---------- Pestaña ----------
  const TABS = { mensajes: 'crmLineaTabWa', leads: 'crmLineaTabLeads', redes: 'crmLineaTabRedes', campanas: 'crmLineaTabCampanas' };
  function envolverTab() {
    const orig = window.crmLineaTab;
    if (typeof orig !== 'function' || orig.__bcsol) return false;
    const nueva = async function (name) {
      const panel = document.getElementById('crmLinea-solicitudes'), btn = document.getElementById('crmLineaTabSolicitudes');
      if (name !== 'solicitudes' || !panel || !btn) {
        if (panel) panel.style.display = 'none';
        if (btn) btn.className = 'crm-tab-seg';
        return orig.apply(this, arguments);
      }
      try { localStorage.setItem('bayol_subtab_crmlinea', 'solicitudes'); } catch (e) {}
      try { if (typeof _igDetenerRealtime === 'function') _igDetenerRealtime(); } catch (e) {}
      ['crmLinea-mensajes', 'crmLinea-leads', 'crmLinea-redes', 'crmLinea-campanas', 'crmWaControlesWrap', 'crmHistorialBtn'].forEach(i => { const el = document.getElementById(i); if (el) el.style.display = 'none'; });
      Object.values(TABS).forEach(i => { const el = document.getElementById(i); if (el) el.className = 'crm-tab-seg'; });
      btn.className = 'crm-tab-seg on pill-hundido';
      panel.style.display = '';
      await render();
    };
    nueva.__bcsol = true;
    window.crmLineaTab = nueva;
    return true;
  }
  function iniciar() {
    if (!envolverTab()) return false;
    // Si al recargar la pestaña guardada era «Solicitudes» y el CRM ya se pintó antes que esta capa, se vuelve a abrir.
    try {
      const vista = document.getElementById('v-crmLinea');
      if (localStorage.getItem('bayol_subtab_crmlinea') === 'solicitudes' && vista && vista.classList.contains('active')) window.crmLineaTab('solicitudes');
    } catch (e) {}
    setTimeout(contarPronto, 2500);
    setInterval(() => { const v = document.getElementById('v-crmLinea'); if (v && v.classList.contains('active') && !document.hidden) contarPronto().then(() => { const p = document.getElementById('crmLinea-solicitudes'); if (p && p.style.display !== 'none' && !(hoja && hoja.classList.contains('on'))) pintar(); }); }, 120000);
    return true;
  }
  if (!iniciar()) { let n = 0; const t = setInterval(() => { if (iniciar() || ++n > 80) clearInterval(t); }, 250); }
})();
