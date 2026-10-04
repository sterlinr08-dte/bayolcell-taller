/* 4 oct 2026 — Automatizaciones estilo ManyChat, Fase 1: «Comentario → privado» (Instagram / Facebook).
   Panel solo para administradores. Cada automatización nace APAGADA; solo envía la que el administrador active.
   El envío lo hace el motor del servidor (Edge `social-automatizaciones`, cron cada 2 min), no esta pantalla.
   Botón «Automatizaciones» en la fila de filtros de Instagram/Facebook (#bcSmartInteractionNav).
   Capa aislada: no cambia ids/onclick existentes. API: window.BayolAutomatizaciones.abrir() */
(function(){
  'use strict';
  if (window.BayolAutomatizaciones) return;
  var VERSION = '20261004-a3';
  var st = { lista: [], editando: null, posts: {}, cargandoPosts: false, tab: 'comentario', lineas: null, etiquetas: null };

  function cli(){ return (typeof supabaseClient !== 'undefined') ? supabaseClient : window.supabaseClient; }
  function esAdmin(){ try { return typeof isAdminUser === 'function' && isAdminUser(); } catch(e){ return false; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function aviso(m, err){ try { (err && typeof toastError === 'function') ? toastError(m) : toast(m); } catch(e){ console.log(m); } }
  async function preguntar(m){ try { if (typeof confirmar === 'function') return await confirmar(m); } catch(e){} return window.confirm(m); }
  function $(s, r){ return (r || document).querySelector(s); }
  function canal(){ var v = document.getElementById('v-crmLinea'); return v ? v.getAttribute('data-social-channel') : ''; }
  function fecha(t){ if (!t) return '—'; var d = new Date(t); if (isNaN(d)) return '—';
    return d.toLocaleString('es-DO', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' }); }
  function red(p){ return p === 'instagram' ? { n:'Instagram', ic:'ti-brand-instagram', col:'#d62976' } : p === 'whatsapp' ? { n:'WhatsApp', ic:'ti-brand-whatsapp', col:'#1fa855' } : { n:'Facebook', ic:'ti-brand-facebook', col:'#0866ff' }; }
  function esMensaje(a){ return a && a.tipo === 'mensaje'; }
  function normalizar(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function coincide(texto, palabras, modo){ if (modo === 'cualquiera') return true; var t = normalizar(texto); if (!t) return false;
    var ps = (palabras || []).map(normalizar).filter(Boolean); if (!ps.length) return false;
    if (modo === 'exacta') return ps.some(function(p){ return t === p; });
    return ps.some(function(p){ return (' ' + t + ' ').indexOf(' ' + p + ' ') >= 0; }); }
  async function cargarLineas(){ if (st.lineas) return st.lineas; try { var r = await cli().rpc('whatsapp_lineas_directorio'); st.lineas = (r.data || []); } catch(e){ st.lineas = []; } return st.lineas; }
  var CAMPOS = [['nombre','Nombre'],['telefono','Teléfono'],['cedula','Cédula'],['correo','Correo'],['equipo','Equipo / modelo'],['texto','Texto libre']];
  function campoTxt(c){ var x = CAMPOS.find(function(k){ return k[0] === c; }); return x ? x[1] : 'Texto'; }
  async function cargarEtiquetas(){ if (st.etiquetas) return st.etiquetas; try { var r = await cli().from('whatsapp_etiquetas').select('id,nombre,color,orden').order('orden').order('nombre'); st.etiquetas = r.data || []; } catch(e){ st.etiquetas = []; } return st.etiquetas; }
  function etiq(id){ return (st.etiquetas || []).find(function(x){ return String(x.id) === String(id); }); }
  function chipEtiqueta(id){ var e = etiq(id); return e ? '<span class="bcau-chip" style="background:' + esc(e.color || '#e9edef') + '22;color:#111b21"><i class="ti ti-circle-filled" style="color:' + esc(e.color || '#8696a0') + ';font-size:9px"></i> ' + esc(e.nombre) + '</span>' : ''; }
  function nombreLinea(id){ if (!id) return 'Todas las líneas'; var l = (st.lineas || []).find(function(x){ return x.id === id; }); return l ? ((l.sucursal_nombre ? l.sucursal_nombre + ' · ' : '') + l.nombre) : 'Una línea'; }
  function modoTxt(m){ return m === 'exacta' ? 'Comentario exacto' : m === 'cualquiera' ? 'Cualquier comentario' : 'Contiene la palabra'; }

  function css(){
    if (document.getElementById('bcauCss')) return;
    var s = document.createElement('style'); s.id = 'bcauCss';
    s.textContent = [
      '#bcauFondo{position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center;padding:16px}',
      '#bcauCaja{background:#fff;border-radius:16px;width:min(760px,100%);max-height:min(88vh,860px);display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(15,23,42,.25);overflow:hidden;font-size:14px;color:#111b21}',
      '#bcauCaja .bcau-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e9edef}',
      '#bcauCaja .bcau-head h3{margin:0;font-size:17px;font-weight:600;flex:1}',
      '#bcauCaja .bcau-cerrar{width:36px;height:36px;border-radius:50%;border:0;background:#f0f2f5;cursor:pointer;font-size:18px;color:#54656f}',
      '#bcauCaja .bcau-body{padding:14px 16px;overflow:auto;flex:1}',
      '#bcauCaja .bcau-foot{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #e9edef;flex-wrap:wrap}',
      '.bcau-btn{border:0;border-radius:10px;padding:9px 14px;font-weight:600;cursor:pointer;background:#f0f2f5;color:#111b21;display:inline-flex;align-items:center;gap:6px;font-size:13.5px}',
      '.bcau-btn.pri{background:#FF6B35;color:#fff}.bcau-btn.pri:hover{background:#D65225}',
      '.bcau-btn.peligro{background:#fdecec;color:#b91c1c}.bcau-btn.chico{padding:6px 10px;font-size:12.5px}',
      '.bcau-btn:disabled{opacity:.55;cursor:default}',
      '.bcau-nota{background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:10px;padding:9px 12px;font-size:12.5px;margin-bottom:12px;line-height:1.45}',
      '.bcau-card{border:1px solid #e9edef;border-radius:12px;padding:12px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}',
      '.bcau-card.on{border-color:#86efac;background:#f6fef9}',
      '.bcau-thumb{width:52px;height:52px;border-radius:10px;background:#f0f2f5;object-fit:cover;flex:none;display:flex;align-items:center;justify-content:center;color:#8696a0;font-size:22px}',
      '.bcau-info{flex:1;min-width:0}.bcau-info b{font-size:14.5px}.bcau-info small{color:#475569;display:block;margin-top:2px}',
      '.bcau-chips{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.bcau-chip{background:#f0f2f5;border-radius:999px;padding:2px 9px;font-size:12px}',
      '.bcau-acc{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}',
      '.bcau-err{color:#b91c1c;font-size:12px;margin-top:4px}',
      '.bcau-sw{position:relative;width:46px;height:26px;flex:none;cursor:pointer}.bcau-sw input{opacity:0;width:0;height:0;position:absolute}',
      '.bcau-sw span{position:absolute;inset:0;background:#cbd5e1;border-radius:999px;transition:background .2s}',
      '.bcau-sw span::after{content:"";position:absolute;width:20px;height:20px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}',
      '.bcau-sw input:checked+span{background:#22c55e}.bcau-sw input:checked+span::after{transform:translateX(20px)}',
      '.bcau-sw input:focus-visible+span{outline:2px solid #FF6B35;outline-offset:2px}',
      '.bcau-vacio{text-align:center;color:#475569;padding:28px 10px}.bcau-vacio i{font-size:34px;color:#FF6B35;display:block;margin-bottom:8px}',
      '.bcau-f{margin-bottom:12px}.bcau-f label{display:block;font-weight:600;font-size:13px;margin-bottom:5px}',
      '.bcau-f input[type=text],.bcau-f textarea,.bcau-f select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:9px 11px;font:inherit;background:#fff;color:#111b21}',
      '.bcau-f textarea{min-height:80px;resize:vertical}.bcau-f .ayuda{color:#475569;font-size:12px;margin-top:4px}',
      '.bcau-seg{display:inline-flex;background:#f0f2f5;border-radius:10px;padding:3px;gap:3px}',
      '.bcau-seg button{border:0;background:transparent;border-radius:8px;padding:7px 12px;cursor:pointer;font-weight:600;color:#54656f;display:inline-flex;gap:6px;align-items:center}',
      '.bcau-seg button.on{background:#fff;color:#111b21;box-shadow:0 1px 3px rgba(0,0,0,.12)}',
      '.bcau-posts{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-top:8px;max-height:280px;overflow:auto}',
      '.bcau-post{border:2px solid transparent;border-radius:10px;background:#f8fafc;cursor:pointer;padding:0;text-align:left;overflow:hidden;font:inherit}',
      '.bcau-post.on{border-color:#FF6B35}.bcau-post img,.bcau-post .ph{width:100%;aspect-ratio:1;object-fit:cover;display:flex;align-items:center;justify-content:center;background:#e9edef;color:#8696a0}',
      '.bcau-post span{display:block;font-size:11.5px;padding:4px 6px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.bcau-fila{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f0f2f5;align-items:flex-start}.bcau-fila:last-child{border:0}',
      '.bcau-est{font-size:11.5px;font-weight:600;border-radius:999px;padding:2px 8px;flex:none}',
      '.bcau-est.ok{background:#dcfce7;color:#166534}.bcau-est.error{background:#fee2e2;color:#991b1b}.bcau-est.omitido_tomado,.bcau-est.enviando{background:#f1f5f9;color:#475569}',
      '#bcSmartInteractionNav .bcau-chip-btn{margin-left:auto !important}',
      '.bcau-tabs{display:flex;gap:6px;margin-bottom:12px}.bcau-tabs button{flex:1;border:1px solid #e9edef;background:#fff;border-radius:10px;padding:9px 10px;font-weight:600;cursor:pointer;color:#54656f;display:inline-flex;gap:6px;align-items:center;justify-content:center}.bcau-tabs button.on{border-color:#FF6B35;color:#D65225;background:#fff7f3}',
      '.bcau-bot{display:grid;grid-template-columns:150px 1fr auto;gap:6px;margin-bottom:6px;align-items:start}.bcau-bot input,.bcau-bot textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;font:inherit}.bcau-bot textarea{min-height:40px;resize:vertical}',
      '.bcau-prueba{background:#efeae2;border-radius:12px;padding:12px;margin-top:10px}.bcau-burbuja{background:#fff;border-radius:8px;padding:8px 10px;max-width:85%;box-shadow:0 1px 1px rgba(0,0,0,.08);white-space:pre-wrap}.bcau-burbuja.yo{background:#d9fdd3;margin-left:auto}.bcau-burbuja + .bcau-burbuja{margin-top:6px}',
      '.bcau-preg{display:grid;grid-template-columns:24px 1fr 150px auto;gap:6px;margin-bottom:6px;align-items:center}.bcau-preg input,.bcau-preg select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;font:inherit;background:#fff}.bcau-preg .n{font-weight:700;color:#8696a0;text-align:center}',
      '.bcau-etqs{display:flex;flex-wrap:wrap;gap:6px}.bcau-etqs button{border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:5px 11px;cursor:pointer;font:inherit;font-size:13px;display:inline-flex;gap:6px;align-items:center}.bcau-etqs button.on{border-color:#111b21;background:#f0f2f5;font-weight:600}',
      '.bcau-form{display:flex;gap:10px;align-items:flex-start;padding:8px 14px;background:#eef6ff;border-bottom:1px solid #cfe3fb;color:#0b3a66;font-size:13px;flex:0 0 auto}.bcau-form .tx{flex:1;min-width:0}.bcau-form dl{margin:4px 0 0;display:flex;flex-wrap:wrap;gap:4px 14px}.bcau-form dt{font-weight:600;display:inline}.bcau-form dd{display:inline;margin:0 0 0 4px}.bcau-form button{border:0;background:transparent;cursor:pointer;color:#0b3a66;font-size:16px}',
      '@media (max-width:640px){.bcau-preg{grid-template-columns:20px 1fr auto}.bcau-preg select{grid-column:2/3}}',
      '.bcau-pbtn{display:block;text-align:center;color:#027eb5;background:#fff;border-radius:8px;padding:7px;margin-top:4px;max-width:85%;font-weight:600;font-size:13px}',
      '.bcau-bot-etq{grid-column:2/3;border:1px solid #cbd5e1;border-radius:10px;padding:6px 8px;font:inherit;background:#fff}',
      '@media (max-width:640px){.bcau-bot{grid-template-columns:1fr auto}.bcau-bot textarea,.bcau-bot .bcau-bot-etq{grid-column:1/-1}.bcau-bot [data-quitar]{grid-row:1;grid-column:2}}',
      '@media (max-width:640px){#bcauFondo{padding:0;align-items:flex-end}#bcauCaja{border-radius:16px 16px 0 0;max-height:92vh}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function cerrar(){ var f = document.getElementById('bcauFondo'); if (f) f.remove(); document.removeEventListener('keydown', teclaEsc, true); }
  function teclaEsc(e){ if (e.key === 'Escape' && document.getElementById('bcauFondo')) { e.preventDefault(); e.stopPropagation(); if (st.editando) { st.editando = null; pintarLista(); } else cerrar(); } }
  function caja(titulo, cuerpo, pie){
    css();
    var f = document.getElementById('bcauFondo');
    if (!f) {
      f = document.createElement('div'); f.id = 'bcauFondo';
      f.addEventListener('mousedown', function(e){ if (e.target === f) cerrar(); });
      document.body.appendChild(f);
      document.addEventListener('keydown', teclaEsc, true);
    }
    f.innerHTML = '<div id="bcauCaja" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '">' +
      '<div class="bcau-head"><i class="ti ti-bolt" style="color:#FF6B35;font-size:20px"></i><h3>' + esc(titulo) + '</h3>' +
      '<button type="button" class="bcau-cerrar modal-close" aria-label="Cerrar" data-bcau="cerrar"><i class="ti ti-x"></i></button></div>' +
      '<div class="bcau-body">' + cuerpo + '</div>' + (pie ? '<div class="bcau-foot">' + pie + '</div>' : '') + '</div>';
    f.querySelector('[data-bcau="cerrar"]').onclick = cerrar;
    return f;
  }

  async function cargar(){
    var r = await cli().from('social_automatizaciones').select('*').order('creado_en', { ascending: false });
    if (r.error) throw r.error;
    st.lista = r.data || [];
  }

  async function abrir(tab){
    if (!esAdmin()) { aviso('Solo un administrador puede configurar automatizaciones.', true); return; }
    st.editando = null;
    if (tab === 'mensaje' || tab === 'comentario') st.tab = tab;
    caja('Automatizaciones', '<div class="bcau-vacio"><i class="ti ti-loader"></i>Cargando…</div>');
    try { await Promise.all([cargar(), cargarLineas(), cargarEtiquetas()]); pintarLista(); }
    catch(e){ caja('Automatizaciones', '<div class="bcau-vacio"><i class="ti ti-alert-triangle"></i>No se pudieron cargar las automatizaciones.</div>'); }
  }

  function tarjetaMensaje(a){
    var R = red(a.plataforma);
    var pal = a.coincidencia === 'cualquiera' ? '<span class="bcau-chip">Cualquier mensaje</span>'
      : (a.palabras || []).map(function(p){ return '<span class="bcau-chip">' + esc(p) + '</span>'; }).join('');
    var bots = (a.botones || []).map(function(b){ return '<span class="bcau-chip" style="background:#e7f3ff;color:#0b5394"><i class="ti ti-hand-finger"></i> ' + esc(b.titulo) + '</span>'; }).join('');
    return '<div class="bcau-card' + (a.activo ? ' on' : '') + '" data-id="' + esc(a.id) + '"><span class="bcau-thumb"><i class="ti ' + R.ic + '" style="color:' + R.col + '"></i></span>' +
      '<div class="bcau-info"><b>' + esc(a.nombre) + '</b>' +
      '<small><i class="ti ' + R.ic + '" style="color:' + R.col + '"></i> ' + R.n + (a.plataforma === 'whatsapp' ? ' · ' + esc(nombreLinea(a.linea_id)) : '') + ' · una vez por chat cada ' + (a.enfriamiento_horas || 24) + ' h</small>' +
      '<div class="bcau-chips">' + pal + bots + '</div>' +
      ((a.preguntas || []).length ? '<small><i class="ti ti-list-numbers"></i> ' + a.preguntas.length + ' pregunta(s): ' + esc(a.preguntas.map(function(p){ return campoTxt(p.campo); }).join(', ')) + '</small>' : '') +
      ((a.etiquetas_auto || []).length ? '<div class="bcau-chips">' + a.etiquetas_auto.map(chipEtiqueta).join('') + '</div>' : '') +
      '<small>' + (a.activo ? 'Activa desde ' + fecha(a.activado_en) : 'Apagada') + ' · Respuestas enviadas: <b>' + (a.enviados_count || 0) + '</b></small>' +
      '<div class="bcau-acc">' +
        '<button type="button" class="bcau-btn chico" data-acc="editar"><i class="ti ti-pencil"></i> Editar</button>' +
        '<button type="button" class="bcau-btn chico" data-acc="previa"><i class="ti ti-player-play"></i> Probar</button>' +
        '<button type="button" class="bcau-btn chico" data-acc="historial"><i class="ti ti-list-details"></i> Historial</button>' +
        '<button type="button" class="bcau-btn chico peligro" data-acc="borrar"><i class="ti ti-trash"></i> Borrar</button>' +
      '</div></div>' +
      '<label class="bcau-sw" title="' + (a.activo ? 'Apagar' : 'Activar') + '"><input type="checkbox" data-acc="activo"' + (a.activo ? ' checked' : '') + ' aria-label="' + (a.activo ? 'Apagar' : 'Activar') + ' ' + esc(a.nombre) + '"><span></span></label></div>';
  }

  function tarjeta(a){
    if (esMensaje(a)) return tarjetaMensaje(a);
    var R = red(a.plataforma);
    var pal = a.coincidencia === 'cualquiera' ? '<span class="bcau-chip">Cualquier comentario</span>'
      : (a.palabras || []).map(function(p){ return '<span class="bcau-chip">' + esc(p) + '</span>'; }).join('');
    var thumb = a.post_imagen ? '<img class="bcau-thumb" src="' + esc(a.post_imagen) + '" alt="">' : '<span class="bcau-thumb"><i class="ti ' + R.ic + '" style="color:' + R.col + '"></i></span>';
    return '<div class="bcau-card' + (a.activo ? ' on' : '') + '" data-id="' + esc(a.id) + '">' + thumb +
      '<div class="bcau-info"><b>' + esc(a.nombre) + '</b>' +
      '<small><i class="ti ' + R.ic + '" style="color:' + R.col + '"></i> ' + R.n + ' · ' + (a.post_id ? 'Publicación: ' + esc((a.post_texto || 'elegida').slice(0, 60)) : 'Cualquier publicación reciente') + '</small>' +
      '<div class="bcau-chips">' + pal + '</div>' +
      '<small>' + (a.activo ? 'Activa desde ' + fecha(a.activado_en) : 'Apagada') + ' · Enviados: <b>' + (a.enviados_count || 0) + '</b>' + (a.ultima_revision ? ' · Última revisión ' + fecha(a.ultima_revision) : '') + '</small>' +
      (a.ultimo_error ? '<div class="bcau-err"><i class="ti ti-alert-triangle"></i> ' + esc(a.ultimo_error) + '</div>' : '') +
      '<div class="bcau-acc">' +
        '<button type="button" class="bcau-btn chico" data-acc="editar"><i class="ti ti-pencil"></i> Editar</button>' +
        '<button type="button" class="bcau-btn chico" data-acc="previa"><i class="ti ti-eye"></i> Vista previa</button>' +
        '<button type="button" class="bcau-btn chico" data-acc="historial"><i class="ti ti-list-details"></i> Historial</button>' +
        (a.activo ? '<button type="button" class="bcau-btn chico" data-acc="revisar"><i class="ti ti-refresh"></i> Revisar ahora</button>' : '') +
        '<button type="button" class="bcau-btn chico peligro" data-acc="borrar"><i class="ti ti-trash"></i> Borrar</button>' +
      '</div></div>' +
      '<label class="bcau-sw" title="' + (a.activo ? 'Apagar' : 'Activar') + '"><input type="checkbox" data-acc="activo"' + (a.activo ? ' checked' : '') + ' aria-label="' + (a.activo ? 'Apagar' : 'Activar') + ' ' + esc(a.nombre) + '"><span></span></label></div>';
  }

  function pintarLista(){
    var lista = st.lista.filter(function(a){ return (a.tipo || 'comentario') === st.tab; });
    var cuentaTipo = function(t){ return st.lista.filter(function(a){ return (a.tipo || 'comentario') === t; }).length; };
    var cuerpo = '<div class="bcau-tabs" role="tablist">' +
      '<button type="button" data-tab="comentario" role="tab" aria-selected="' + (st.tab === 'comentario') + '" class="' + (st.tab === 'comentario' ? 'on' : '') + '"><i class="ti ti-message-circle"></i> Comentario → privado (' + cuentaTipo('comentario') + ')</button>' +
      '<button type="button" data-tab="mensaje" role="tab" aria-selected="' + (st.tab === 'mensaje') + '" class="' + (st.tab === 'mensaje' ? 'on' : '') + '"><i class="ti ti-messages"></i> Respuestas en chats (' + cuentaTipo('mensaje') + ')</button></div>';
    cuerpo += st.tab === 'mensaje'
      ? '<div class="bcau-nota"><b>Palabra clave en el chat → respuesta automática.</b> Si un cliente escribe la palabra por WhatsApp, Instagram o Facebook, le contesta solo, con hasta 3 botones. Cada botón puede tener su propia respuesta. ' +
        'Solo responden las que tú actives, una vez por chat en el tiempo que elijas, y nunca si el chat ya lo atiende un empleado. El chat sigue apareciendo como pendiente para que alguien lo atienda.</div>'
      : '<div class="bcau-nota"><b>Comentario → mensaje privado.</b> Cuando alguien comenta la palabra clave en tu publicación, le llega un mensaje privado automático (una vez por persona y publicación). ' +
        'Solo envían las que tú actives, solo a comentarios hechos después de activarlas, y nunca si ese chat ya lo atiende un empleado.</div>';
    cuerpo += lista.length ? lista.map(tarjeta).join('') :
      (st.tab === 'mensaje'
        ? '<div class="bcau-vacio"><i class="ti ti-messages"></i><b>Todavía no tienes respuestas automáticas</b><br>Ejemplo: si escriben «horario», contestar con el horario y botones «Ubicación» y «Hablar con alguien».</div>'
        : '<div class="bcau-vacio"><i class="ti ti-bolt"></i><b>Todavía no tienes automatizaciones</b><br>Crea la primera: por ejemplo, «Comenta PRECIO y te lo mando por privado».</div>');
    var f = caja('Automatizaciones', cuerpo, '<button type="button" class="bcau-btn pri" data-bcau="nueva"><i class="ti ti-plus"></i> ' + (st.tab === 'mensaje' ? 'Nueva respuesta automática' : 'Nueva automatización') + '</button>');
    f.querySelector('[data-bcau="nueva"]').onclick = function(){ st.tab === 'mensaje' ? editorMensaje(null) : editor(null); };
    f.querySelectorAll('.bcau-tabs [data-tab]').forEach(function(b){ b.onclick = function(){ st.tab = b.dataset.tab; pintarLista(); }; });
    f.querySelectorAll('.bcau-card').forEach(function(card){
      var a = st.lista.find(function(x){ return x.id === card.dataset.id; });
      card.addEventListener('click', function(e){
        var b = e.target.closest('[data-acc]'); if (!b || !a) return;
        var acc = b.dataset.acc;
        if (acc === 'editar') (esMensaje(a) ? editorMensaje(a) : editor(a));
        else if (acc === 'previa') (esMensaje(a) ? probar(a) : vistaPrevia(a));
        else if (acc === 'historial') (esMensaje(a) ? historialMensaje(a) : historial(a));
        else if (acc === 'revisar') revisarAhora(a, b);
        else if (acc === 'borrar') borrar(a);
      });
      var sw = card.querySelector('input[data-acc="activo"]');
      sw.addEventListener('change', function(){ cambiarActivo(a, sw); });
    });
  }

  async function cambiarActivo(a, sw){
    var activar = sw.checked;
    if (activar && esMensaje(a)) {
      var okm = await preguntar('¿Activar «' + a.nombre + '»?\n\nDesde ahora, cuando un cliente escriba ' +
        (a.coincidencia === 'cualquiera' ? 'cualquier mensaje' : '«' + (a.palabras || []).join('», «') + '»') + ' por ' + red(a.plataforma).n +
        (a.plataforma === 'whatsapp' ? ' (' + nombreLinea(a.linea_id) + ')' : '') + ', se le contestará automáticamente:\n\n' + a.mensaje_privado +
        ((a.botones || []).length ? '\n\nBotones: ' + a.botones.map(function(b){ return b.titulo; }).join(' · ') : ''));
      if (!okm) { sw.checked = false; return; }
    } else if (activar) {
      var ok = await preguntar('¿Activar «' + a.nombre + '»?\n\nDesde ahora, cada persona que comente ' +
        (a.coincidencia === 'cualquiera' ? 'cualquier cosa' : '«' + (a.palabras || []).join('», «') + '»') +
        (a.post_id ? ' en esa publicación' : ' en tus publicaciones recientes') + ' de ' + red(a.plataforma).n +
        ' recibirá este mensaje privado automático:\n\n' + a.mensaje_privado);
      if (!ok) { sw.checked = false; return; }
    }
    sw.disabled = true;
    var r = await cli().from('social_automatizaciones').update({ activo: activar }).eq('id', a.id);
    if (r.error) { sw.checked = !activar; sw.disabled = false; aviso('No se pudo guardar: ' + (r.error.message || ''), true); return; }
    aviso(activar ? (esMensaje(a) ? 'Respuesta automática activada.' : 'Automatización activada. Revisa los comentarios cada 2 minutos.') : 'Automatización apagada.');
    await cargar(); pintarLista();
  }

  async function borrar(a){
    if (!(await preguntar('¿Borrar la automatización «' + a.nombre + '»? Se borra también su historial.'))) return;
    var r = await cli().from('social_automatizaciones').delete().eq('id', a.id);
    if (r.error) { aviso('No se pudo borrar.', true); return; }
    aviso('Automatización borrada.'); await cargar(); pintarLista();
  }

  async function invocarMotor(body){
    var r = await cli().functions.invoke('social-automatizaciones', { body: body });
    if (r.error) throw r.error;
    return r.data || {};
  }

  async function revisarAhora(a, btn){
    btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Revisando…';
    try {
      var d = await invocarMotor({ id: a.id });
      aviso('Revisado: ' + (d.enviados || 0) + ' enviado(s)' + (d.omitidos ? ', ' + d.omitidos + ' omitido(s) por chat tomado' : '') + (d.errores && d.errores.length ? ', ' + d.errores.length + ' con error' : '') + '.');
    } catch(e){ aviso('No se pudo revisar ahora.', true); }
    await cargar(); pintarLista();
  }

  async function vistaPrevia(a){
    caja('Vista previa — ' + a.nombre, '<div class="bcau-vacio"><i class="ti ti-loader"></i>Mirando los comentarios de los últimos 7 días…</div>');
    try {
      var d = await invocarMotor({ accion: 'simular', id: a.id });
      var filas = (d.simulados || []).map(function(s){
        return '<div class="bcau-fila"><i class="ti ti-message-circle" style="color:#8696a0;margin-top:2px"></i><div style="flex:1;min-width:0"><b>' + esc(s.autor) + '</b> <small style="color:#475569">' + fecha(s.fecha) + '</small><div>' + esc(s.texto) + '</div></div>' +
          (s.tomado ? '<span class="bcau-est omitido_tomado">Chat tomado: no se enviaría</span>' : '<span class="bcau-est ok">Se le enviaría</span>') + '</div>';
      }).join('');
      var cuerpo = '<div class="bcau-nota">Esto es solo una prueba: <b>no se envió nada</b>. Muestra qué comentarios de los últimos 7 días coinciden con la regla. ' +
        'Al activarla, solo se responderán comentarios nuevos.</div>' +
        '<p style="color:#475569;margin:0 0 8px">Revisé ' + (d.publicaciones || 0) + ' publicación(es) y ' + (d.comentarios || 0) + ' comentario(s).</p>' +
        (filas || '<div class="bcau-vacio"><i class="ti ti-mood-empty"></i>Ningún comentario reciente coincide con la regla.</div>') +
        (d.errores && d.errores.length ? '<div class="bcau-err">Hubo un problema al leer algunas publicaciones.</div>' : '');
      var f = caja('Vista previa — ' + a.nombre, cuerpo, '<button type="button" class="bcau-btn" data-bcau="volver"><i class="ti ti-arrow-left"></i> Volver</button>');
      f.querySelector('[data-bcau="volver"]').onclick = pintarLista;
    } catch(e){
      var f2 = caja('Vista previa', '<div class="bcau-vacio"><i class="ti ti-alert-triangle"></i>No se pudo hacer la vista previa.</div>', '<button type="button" class="bcau-btn" data-bcau="volver">Volver</button>');
      f2.querySelector('[data-bcau="volver"]').onclick = pintarLista;
    }
  }

  async function historial(a){
    caja('Historial — ' + a.nombre, '<div class="bcau-vacio"><i class="ti ti-loader"></i>Cargando…</div>');
    var r = await cli().from('social_automatizacion_envios').select('*').eq('automatizacion_id', a.id).order('creado_en', { ascending: false }).limit(100);
    var txt = { ok:'Enviado', error:'Error', omitido_tomado:'Omitido: chat tomado', enviando:'Enviando' };
    var filas = (r.data || []).map(function(e){
      return '<div class="bcau-fila"><div style="flex:1;min-width:0"><b>' + esc(e.autor_nombre || 'Contacto') + '</b> <small style="color:#475569">' + fecha(e.creado_en) + '</small><div>' + esc(e.texto || '') + '</div>' +
        (e.error ? '<div class="bcau-err">' + esc(e.error) + '</div>' : '') +
        (e.publico_ok === false ? '<div class="bcau-err">La respuesta pública no se pudo publicar.</div>' : '') + '</div>' +
        '<span class="bcau-est ' + esc(e.estado) + '">' + (txt[e.estado] || esc(e.estado)) + '</span></div>';
    }).join('');
    var f = caja('Historial — ' + a.nombre, filas || '<div class="bcau-vacio"><i class="ti ti-inbox"></i>Todavía no ha enviado ningún mensaje.</div>',
      '<button type="button" class="bcau-btn" data-bcau="volver"><i class="ti ti-arrow-left"></i> Volver</button>');
    f.querySelector('[data-bcau="volver"]').onclick = pintarLista;
  }

  // ---------- Editor ----------
  function editor(a){
    st.editando = a ? Object.assign({}, a) : { nombre:'', plataforma: canal() === 'facebook' ? 'facebook' : 'instagram', post_id:null, post_texto:null, post_imagen:null, post_enlace:null,
      palabras:[], coincidencia:'contiene', mensaje_privado:'', respuesta_publica:'' };
    var e = st.editando;
    var cuerpo =
      '<div class="bcau-f"><label for="bcauNombre">Nombre (para ti)</label><input type="text" id="bcauNombre" maxlength="80" placeholder="Ej.: Precio del iPhone 13" value="' + esc(e.nombre) + '"></div>' +
      '<div class="bcau-f"><label>Red social</label><div class="bcau-seg" id="bcauRed">' +
        '<button type="button" data-red="instagram"><i class="ti ti-brand-instagram"></i> Instagram</button>' +
        '<button type="button" data-red="facebook"><i class="ti ti-brand-facebook"></i> Facebook</button></div></div>' +
      '<div class="bcau-f"><label>¿En qué publicación?</label><div class="bcau-seg" id="bcauDonde">' +
        '<button type="button" data-donde="todas">Cualquier publicación reciente</button>' +
        '<button type="button" data-donde="una">Una publicación</button></div>' +
        '<div id="bcauPostsWrap"></div></div>' +
      '<div class="bcau-f"><label for="bcauModo">¿Cuándo responde?</label><select id="bcauModo">' +
        '<option value="contiene">Si el comentario contiene alguna de las palabras</option>' +
        '<option value="exacta">Si el comentario es exactamente la palabra</option>' +
        '<option value="cualquiera">A cualquier comentario</option></select></div>' +
      '<div class="bcau-f" id="bcauPalWrap"><label for="bcauPal">Palabras clave</label><input type="text" id="bcauPal" placeholder="precio, info, cuanto" value="' + esc((e.palabras || []).join(', ')) + '">' +
        '<div class="ayuda">Sepáralas con coma. No importan mayúsculas ni tildes.</div></div>' +
      '<div class="bcau-f"><label for="bcauPriv">Mensaje privado que se envía</label><textarea id="bcauPriv" maxlength="1000" placeholder="¡Hola {nombre}! Gracias por escribir. El precio es…">' + esc(e.mensaje_privado) + '</textarea>' +
        '<div class="ayuda">Escribe {nombre} para poner el primer nombre de la persona.</div></div>' +
      '<div class="bcau-f"><label for="bcauPub">Respuesta pública en el comentario (opcional)</label><textarea id="bcauPub" maxlength="500" style="min-height:56px" placeholder="¡Te escribimos por privado!">' + esc(e.respuesta_publica || '') + '</textarea>' +
        '<div class="ayuda">Si la dejas vacía, solo se manda el privado.</div></div>' +
      (a ? '' : '<div class="bcau-nota" style="margin:0">Se guarda <b>apagada</b>. Usa «Vista previa» para ver a quién le respondería y luego actívala.</div>');
    var f = caja(a ? 'Editar automatización' : 'Nueva automatización', cuerpo,
      '<button type="button" class="bcau-btn" data-bcau="cancelar">Cancelar</button><button type="button" class="bcau-btn pri" data-bcau="guardar"><i class="ti ti-device-floppy"></i> Guardar</button>');
    $('#bcauModo', f).value = e.coincidencia;
    function sync(){
      f.querySelectorAll('#bcauRed button').forEach(function(b){ b.classList.toggle('on', b.dataset.red === e.plataforma); });
      f.querySelectorAll('#bcauDonde button').forEach(function(b){ b.classList.toggle('on', (b.dataset.donde === 'una') === !!e._una); });
      $('#bcauPalWrap', f).style.display = $('#bcauModo', f).value === 'cualquiera' ? 'none' : '';
      pintarPosts();
    }
    e._una = !!e.post_id;
    f.querySelectorAll('#bcauRed button').forEach(function(b){ b.onclick = function(){ if (e.plataforma !== b.dataset.red) { e.plataforma = b.dataset.red; e.post_id = null; e.post_texto = e.post_imagen = e.post_enlace = null; } sync(); }; });
    f.querySelectorAll('#bcauDonde button').forEach(function(b){ b.onclick = function(){ e._una = b.dataset.donde === 'una'; if (!e._una) { e.post_id = null; e.post_texto = e.post_imagen = e.post_enlace = null; } sync(); }; });
    $('#bcauModo', f).onchange = sync;
    f.querySelector('[data-bcau="cancelar"]').onclick = function(){ st.editando = null; pintarLista(); };
    f.querySelector('[data-bcau="guardar"]').onclick = guardar;
    sync();
    setTimeout(function(){ var n = $('#bcauNombre'); if (n && !a) n.focus(); }, 30);
  }

  async function pintarPosts(){
    var e = st.editando, wrap = document.getElementById('bcauPostsWrap'); if (!wrap || !e) return;
    if (!e._una) { wrap.innerHTML = '<div class="ayuda" style="color:#475569;font-size:12px;margin-top:6px">Revisa las 10 publicaciones más recientes que tengan comentarios.</div>'; return; }
    var lista = st.posts[e.plataforma];
    if (!lista) {
      wrap.innerHTML = '<div class="ayuda" style="margin-top:8px"><i class="ti ti-loader"></i> Cargando publicaciones…</div>';
      if (st.cargandoPosts) return;
      st.cargandoPosts = true;
      try {
        var r = await cli().functions.invoke('social-facebook-comentarios', { body: { action: 'posts', platform: e.plataforma, limit: 30 } });
        if (r.error || !r.data || r.data.ok === false) throw r.error || new Error('posts');
        st.posts[e.plataforma] = r.data.data || [];
      } catch(err){ st.posts[e.plataforma] = null; wrap.innerHTML = '<div class="bcau-err">No se pudieron cargar las publicaciones de ' + red(e.plataforma).n + '.</div>'; st.cargandoPosts = false; return; }
      st.cargandoPosts = false;
      if (st.editando !== e) return;
      lista = st.posts[e.plataforma];
    }
    if (!lista.length) { wrap.innerHTML = '<div class="ayuda">No hay publicaciones.</div>'; return; }
    wrap.innerHTML = '<div class="bcau-posts">' + lista.map(function(p){
      return '<button type="button" class="bcau-post' + (String(p.id) === String(e.post_id) ? ' on' : '') + '" data-post="' + esc(p.id) + '">' +
        (p.picture ? '<img src="' + esc(p.picture) + '" alt="" loading="lazy">' : '<span class="ph"><i class="ti ti-photo"></i></span>') +
        '<span>' + esc((p.content || 'Sin texto').slice(0, 40)) + '</span><span style="color:#64748b">' + (p.commentCount || 0) + ' coment.</span></button>';
    }).join('') + '</div>';
    wrap.querySelectorAll('[data-post]').forEach(function(b){ b.onclick = function(){
      var p = lista.find(function(x){ return String(x.id) === b.dataset.post; }); if (!p) return;
      e.post_id = String(p.id); e.post_texto = (p.content || '').slice(0, 300); e.post_imagen = p.picture || null; e.post_enlace = p.permalink || null;
      wrap.querySelectorAll('.bcau-post').forEach(function(x){ x.classList.toggle('on', x === b); });
    }; });
  }

  async function guardar(){
    var e = st.editando; if (!e) return;
    var nombre = ($('#bcauNombre').value || '').trim();
    var modo = $('#bcauModo').value;
    var palabras = ($('#bcauPal').value || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 20);
    var priv = ($('#bcauPriv').value || '').trim();
    var pub = ($('#bcauPub').value || '').trim();
    if (!nombre) { aviso('Ponle un nombre.', true); $('#bcauNombre').focus(); return; }
    if (e._una && !e.post_id) { aviso('Elige la publicación.', true); return; }
    if (modo !== 'cualquiera' && !palabras.length) { aviso('Escribe al menos una palabra clave.', true); $('#bcauPal').focus(); return; }
    if (!priv) { aviso('Escribe el mensaje privado.', true); $('#bcauPriv').focus(); return; }
    var datos = { nombre: nombre, plataforma: e.plataforma, post_id: e._una ? e.post_id : null, post_texto: e._una ? e.post_texto : null,
      post_imagen: e._una ? e.post_imagen : null, post_enlace: e._una ? e.post_enlace : null,
      palabras: modo === 'cualquiera' ? [] : palabras, coincidencia: modo, mensaje_privado: priv, respuesta_publica: pub || null };
    var btn = document.querySelector('[data-bcau="guardar"]'); if (btn) btn.disabled = true;
    var r;
    if (e.id) r = await cli().from('social_automatizaciones').update(datos).eq('id', e.id);
    else {
      datos.activo = false;
      try { if (typeof sessionUser !== 'undefined' && sessionUser) datos.creado_por = sessionUser.nombre || String(sessionUser.id || ''); } catch(x){}
      r = await cli().from('social_automatizaciones').insert(datos);
    }
    if (r.error) { if (btn) btn.disabled = false; aviso('No se pudo guardar: ' + (r.error.message || ''), true); return; }
    aviso(e.id ? 'Automatización actualizada.' : 'Automatización creada (apagada).');
    st.editando = null; await cargar(); pintarLista();
  }

  // ---------- Respuestas en chats (Fase 2) ----------
  function filaBoton(b, i, wa){
    var ops = '<option value="">Sin etiqueta</option>' + (st.etiquetas || []).map(function(e){ return '<option value="' + esc(e.id) + '"' + (String(e.id) === String(b.etiqueta || '') ? ' selected' : '') + '>Etiqueta: ' + esc(e.nombre) + '</option>'; }).join('');
    return '<div class="bcau-bot" data-bot="' + i + '"><input type="text" maxlength="20" placeholder="Texto del botón" value="' + esc(b.titulo || '') + '" aria-label="Texto del botón ' + (i + 1) + '">' +
      '<textarea maxlength="1000" placeholder="Respuesta al tocarlo (opcional: vacío = lo atiende un empleado)" aria-label="Respuesta del botón ' + (i + 1) + '">' + esc(b.respuesta || '') + '</textarea>' +
      '<button type="button" class="bcau-btn chico peligro" data-quitar="' + i + '" aria-label="Quitar botón"><i class="ti ti-x"></i></button>' +
      (wa ? '<select class="bcau-bot-etq" aria-label="Etiqueta al tocar el botón ' + (i + 1) + '">' + ops + '</select>' : '') + '</div>';
  }
  function filaPregunta(p, i){
    return '<div class="bcau-preg" data-preg="' + i + '"><span class="n">' + (i + 1) + '</span><input type="text" maxlength="300" placeholder="Pregunta, ej.: ¿Cuál es tu nombre completo?" value="' + esc(p.pregunta || '') + '" aria-label="Pregunta ' + (i + 1) + '">' +
      '<select aria-label="Tipo de dato de la pregunta ' + (i + 1) + '">' + CAMPOS.map(function(c){ return '<option value="' + c[0] + '"' + (c[0] === (p.campo || 'texto') ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="bcau-btn chico peligro" data-quitarp="' + i + '" aria-label="Quitar pregunta"><i class="ti ti-x"></i></button></div>';
  }

  async function editorMensaje(a){
    await Promise.all([cargarLineas(), cargarEtiquetas()]);
    st.editando = a ? Object.assign({}, a, { botones: (a.botones || []).map(function(b){ return Object.assign({}, b); }),
        preguntas: (a.preguntas || []).map(function(p){ return Object.assign({}, p); }), etiquetas_auto: (a.etiquetas_auto || []).slice() })
      : { tipo: 'mensaje', nombre: '', plataforma: canal() === 'instagram' ? 'instagram' : canal() === 'facebook' ? 'facebook' : 'whatsapp',
          linea_id: null, palabras: [], coincidencia: 'contiene',
          mensaje_privado: '', botones: [], enfriamiento_horas: 24, preguntas: [], mensaje_final: '', etiquetas_auto: [] };
    var e = st.editando;
    var opsLinea = '<option value="">Todas las líneas</option>' + (st.lineas || []).map(function(l){ return '<option value="' + esc(l.id) + '">' + esc((l.sucursal_nombre ? l.sucursal_nombre + ' · ' : '') + l.nombre) + '</option>'; }).join('');
    var cuerpo =
      '<div class="bcau-f"><label for="bcauNombre">Nombre (para ti)</label><input type="text" id="bcauNombre" maxlength="80" placeholder="Ej.: Horario de la tienda" value="' + esc(e.nombre) + '"></div>' +
      '<div class="bcau-f"><label>Red social</label><div class="bcau-seg" id="bcauRed">' +
        '<button type="button" data-red="whatsapp"><i class="ti ti-brand-whatsapp"></i> WhatsApp</button>' +
        '<button type="button" data-red="instagram"><i class="ti ti-brand-instagram"></i> Instagram</button>' +
        '<button type="button" data-red="facebook"><i class="ti ti-brand-facebook"></i> Facebook</button></div></div>' +
      '<div class="bcau-f" id="bcauLineaWrap"><label for="bcauLinea">Línea de WhatsApp</label><select id="bcauLinea">' + opsLinea + '</select></div>' +
      '<div class="bcau-f"><label for="bcauModo">¿Cuándo responde?</label><select id="bcauModo">' +
        '<option value="contiene">Si el mensaje contiene alguna de las palabras</option>' +
        '<option value="exacta">Si el mensaje es exactamente la palabra</option>' +
        '<option value="cualquiera">A cualquier mensaje (bienvenida)</option></select></div>' +
      '<div class="bcau-f" id="bcauPalWrap"><label for="bcauPal">Palabras clave</label><input type="text" id="bcauPal" placeholder="horario, a que hora, abierto" value="' + esc((e.palabras || []).join(', ')) + '">' +
        '<div class="ayuda">Sepáralas con coma. No importan mayúsculas ni tildes. Cuenta la palabra completa.</div></div>' +
      '<div class="bcau-f"><label for="bcauPriv">Respuesta automática</label><textarea id="bcauPriv" maxlength="1000" placeholder="¡Hola {nombre}! Estamos abiertos de lunes a sábado de 8:30 a 6:00.">' + esc(e.mensaje_privado) + '</textarea>' +
        '<div class="ayuda">Escribe {nombre} para poner el primer nombre del cliente.</div></div>' +
      '<div class="bcau-f"><label>Botones (hasta 3)</label><div id="bcauBots"></div>' +
        '<button type="button" class="bcau-btn chico" id="bcauAddBot"><i class="ti ti-plus"></i> Agregar botón</button>' +
        '<div class="ayuda">Máximo 20 letras por botón. Si el botón no tiene respuesta, el cliente queda esperando a un empleado (útil para «Hablar con alguien»).</div></div>' +
      '<div class="bcau-f"><label>Preguntas para guardar datos (opcional)</label><div id="bcauPregs"></div>' +
        '<button type="button" class="bcau-btn chico" id="bcauAddPreg"><i class="ti ti-plus"></i> Agregar pregunta</button>' +
        '<div class="ayuda">Después de la respuesta, se le pregunta una por una. Revisa que la cédula tenga 11 números, el teléfono 10 y el correo sea válido (si no, vuelve a preguntar una vez). El cliente puede escribir «cancelar» para salir. Lo que conteste queda en el historial y en las notas del lead.</div></div>' +
      '<div class="bcau-f" id="bcauFinWrap"><label for="bcauFin">Mensaje al terminar las preguntas</label><textarea id="bcauFin" maxlength="1000" style="min-height:56px" placeholder="¡Gracias {nombre}! Ya tenemos tus datos, en breve te escribe un asesor.">' + esc(e.mensaje_final || '') + '</textarea></div>' +
      '<div class="bcau-f" id="bcauEtqWrap"><label id="bcauEtqLbl">Poner etiquetas al chat</label><div class="bcau-etqs" id="bcauEtqs"></div><div class="ayuda">Solo WhatsApp. Se agregan, nunca se quitan las que ya tenga.</div></div>' +
      '<div class="bcau-f"><label for="bcauEnf">No repetir en el mismo chat durante</label><select id="bcauEnf">' +
        '<option value="1">1 hora</option><option value="6">6 horas</option><option value="24">24 horas</option><option value="72">3 días</option><option value="168">7 días</option></select></div>' +
      (a ? '' : '<div class="bcau-nota" style="margin:0">Se guarda <b>apagada</b>. Usa «Probar» para ver cómo contesta y luego actívala.</div>');
    var f = caja(a ? 'Editar respuesta automática' : 'Nueva respuesta automática', cuerpo,
      '<button type="button" class="bcau-btn" data-bcau="cancelar">Cancelar</button><button type="button" class="bcau-btn pri" data-bcau="guardar"><i class="ti ti-device-floppy"></i> Guardar</button>');
    $('#bcauModo', f).value = e.coincidencia;
    $('#bcauLinea', f).value = e.linea_id || '';
    $('#bcauEnf', f).value = String(e.enfriamiento_horas || 24);
    function leerBotones(){
      e.botones = Array.prototype.map.call(f.querySelectorAll('#bcauBots .bcau-bot'), function(r){
        var sel = r.querySelector('.bcau-bot-etq');
        return { titulo: r.querySelector('input').value.trim(), respuesta: r.querySelector('textarea').value.trim(), etiqueta: sel ? sel.value : '' };
      });
      e.preguntas = Array.prototype.map.call(f.querySelectorAll('#bcauPregs .bcau-preg'), function(r){
        return { pregunta: r.querySelector('input').value.trim(), campo: r.querySelector('select').value };
      });
    }
    function pintarPregs(){
      var w = $('#bcauPregs', f);
      w.innerHTML = e.preguntas.map(filaPregunta).join('');
      $('#bcauAddPreg', f).style.display = e.preguntas.length >= 10 ? 'none' : '';
      $('#bcauFinWrap', f).style.display = e.preguntas.length ? '' : 'none';
      $('#bcauEtqLbl', f).textContent = e.preguntas.length ? 'Poner etiquetas al chat al terminar las preguntas' : 'Poner etiquetas al chat cuando se active';
      w.querySelectorAll('[data-quitarp]').forEach(function(b){ b.onclick = function(){ leerBotones(); e.preguntas.splice(+b.dataset.quitarp, 1); pintarPregs(); }; });
    }
    function pintarEtqs(){
      var w = $('#bcauEtqs', f);
      w.innerHTML = (st.etiquetas || []).length ? st.etiquetas.map(function(x){ var on = e.etiquetas_auto.indexOf(String(x.id)) >= 0;
        return '<button type="button" data-etq="' + esc(x.id) + '" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '"><i class="ti ti-circle-filled" style="color:' + esc(x.color || '#8696a0') + ';font-size:10px"></i> ' + esc(x.nombre) + '</button>'; }).join('')
        : '<span class="ayuda">No hay etiquetas creadas.</span>';
      w.querySelectorAll('[data-etq]').forEach(function(b){ b.onclick = function(){ var id = String(b.dataset.etq), k = e.etiquetas_auto.indexOf(id); if (k >= 0) e.etiquetas_auto.splice(k, 1); else e.etiquetas_auto.push(id); pintarEtqs(); }; });
    }
    function pintarBots(){
      var w = $('#bcauBots', f);
      w.innerHTML = e.botones.map(function(b, i){ return filaBoton(b, i, e.plataforma === 'whatsapp'); }).join('');
      $('#bcauAddBot', f).style.display = e.botones.length >= 3 ? 'none' : '';
      w.querySelectorAll('[data-quitar]').forEach(function(b){ b.onclick = function(){ leerBotones(); e.botones.splice(+b.dataset.quitar, 1); pintarBots(); }; });
    }
    function sync(){
      f.querySelectorAll('#bcauRed button').forEach(function(b){ b.classList.toggle('on', b.dataset.red === e.plataforma); });
      $('#bcauLineaWrap', f).style.display = e.plataforma === 'whatsapp' ? '' : 'none';
      $('#bcauEtqWrap', f).style.display = e.plataforma === 'whatsapp' ? '' : 'none';
      $('#bcauPalWrap', f).style.display = $('#bcauModo', f).value === 'cualquiera' ? 'none' : '';
    }
    f.querySelectorAll('#bcauRed button').forEach(function(b){ b.onclick = function(){ leerBotones(); e.plataforma = b.dataset.red; pintarBots(); sync(); }; });
    $('#bcauModo', f).onchange = sync;
    $('#bcauAddPreg', f).onclick = function(){ leerBotones(); if (e.preguntas.length < 10) e.preguntas.push({ pregunta: '', campo: 'texto' }); pintarPregs(); var ins = f.querySelectorAll('#bcauPregs input'); if (ins.length) ins[ins.length - 1].focus(); };
    $('#bcauAddBot', f).onclick = function(){ leerBotones(); if (e.botones.length < 3) e.botones.push({ titulo: '', respuesta: '' }); pintarBots(); var ins = f.querySelectorAll('#bcauBots input'); if (ins.length) ins[ins.length - 1].focus(); };
    f.querySelector('[data-bcau="cancelar"]').onclick = function(){ st.editando = null; pintarLista(); };
    f.querySelector('[data-bcau="guardar"]').onclick = function(){ leerBotones(); guardarMensaje(); };
    pintarBots(); pintarPregs(); pintarEtqs(); sync();
    setTimeout(function(){ var n = $('#bcauNombre'); if (n && !a) n.focus(); }, 30);
  }

  async function guardarMensaje(){
    var e = st.editando; if (!e) return;
    var nombre = ($('#bcauNombre').value || '').trim();
    var modo = $('#bcauModo').value;
    var palabras = ($('#bcauPal').value || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 20);
    var resp = ($('#bcauPriv').value || '').trim();
    var wa = e.plataforma === 'whatsapp';
    var botones = (e.botones || []).filter(function(b){ return b.titulo; }).slice(0, 3).map(function(b){ return { titulo: b.titulo.slice(0, 20), respuesta: b.respuesta || '', etiqueta: wa ? (b.etiqueta || '') : '' }; });
    var preguntas = (e.preguntas || []).filter(function(p){ return p.pregunta; }).slice(0, 10);
    var fin = ($('#bcauFin').value || '').trim();
    if (!nombre) { aviso('Ponle un nombre.', true); $('#bcauNombre').focus(); return; }
    if (modo !== 'cualquiera' && !palabras.length) { aviso('Escribe al menos una palabra clave.', true); $('#bcauPal').focus(); return; }
    if (!resp) { aviso('Escribe la respuesta automática.', true); $('#bcauPriv').focus(); return; }
    var titulos = botones.map(function(b){ return normalizar(b.titulo); });
    if (titulos.some(function(t, i){ return titulos.indexOf(t) !== i; })) { aviso('Dos botones tienen el mismo texto.', true); return; }
    var datos = { tipo: 'mensaje', nombre: nombre, plataforma: e.plataforma, linea_id: e.plataforma === 'whatsapp' ? ($('#bcauLinea').value || null) : null,
      palabras: modo === 'cualquiera' ? [] : palabras, coincidencia: modo, mensaje_privado: resp, botones: botones,
      enfriamiento_horas: parseInt($('#bcauEnf').value, 10) || 24, post_id: null, respuesta_publica: null,
      preguntas: preguntas, mensaje_final: preguntas.length ? (fin || null) : null, etiquetas_auto: wa ? (e.etiquetas_auto || []) : [] };
    var btn = document.querySelector('[data-bcau="guardar"]'); if (btn) btn.disabled = true;
    var r;
    if (e.id) r = await cli().from('social_automatizaciones').update(datos).eq('id', e.id);
    else {
      datos.activo = false;
      try { if (typeof sessionUser !== 'undefined' && sessionUser) datos.creado_por = sessionUser.nombre || String(sessionUser.id || ''); } catch(x){}
      r = await cli().from('social_automatizaciones').insert(datos);
    }
    if (r.error) { if (btn) btn.disabled = false; aviso('No se pudo guardar: ' + (r.error.message || ''), true); return; }
    aviso(e.id ? 'Respuesta automática actualizada.' : 'Respuesta automática creada (apagada).');
    st.editando = null; st.tab = 'mensaje'; await cargar(); pintarLista();
  }

  function probar(a){
    var cuerpo = '<div class="bcau-nota">Escribe lo que mandaría un cliente para ver si esta respuesta se activa. <b>No se envía nada.</b></div>' +
      '<div class="bcau-f"><label for="bcauProbarTxt">Mensaje del cliente</label><input type="text" id="bcauProbarTxt" placeholder="Ej.: ¿A qué hora abren?"></div>' +
      '<div id="bcauProbarRes"></div>';
    var f = caja('Probar — ' + a.nombre, cuerpo, '<button type="button" class="bcau-btn" data-bcau="volver"><i class="ti ti-arrow-left"></i> Volver</button>');
    f.querySelector('[data-bcau="volver"]').onclick = pintarLista;
    var inp = $('#bcauProbarTxt', f), res = $('#bcauProbarRes', f);
    function pinta(){
      var t = inp.value.trim();
      if (!t) { res.innerHTML = ''; return; }
      var boton = (a.botones || []).find(function(b){ return normalizar(b.titulo) === normalizar(t); });
      var nombre = 'Juan';
      var html = '<div class="bcau-prueba"><div class="bcau-burbuja">' + esc(t) + '</div>';
      if (boton) {
        html += boton.respuesta ? '<div class="bcau-burbuja yo">' + esc(boton.respuesta.replace(/\{nombre\}/gi, nombre)) + '</div>' : '';
        html += '</div><p style="color:#475569;font-size:12.5px;margin:6px 0 0">' + (boton.respuesta ? 'Es el botón «' + esc(boton.titulo) + '»: se contesta con su respuesta (si ese chat recibió antes esta automatización).' : 'Es el botón «' + esc(boton.titulo) + '» sin respuesta: lo atiende un empleado.') + '</p>';
      } else if (coincide(t, a.palabras, a.coincidencia)) {
        html += '<div class="bcau-burbuja yo">' + esc(String(a.mensaje_privado || '').replace(/\{nombre\}/gi, nombre)) + '</div>' +
          (a.botones || []).map(function(b){ return '<span class="bcau-pbtn" style="margin-left:auto">' + esc(b.titulo) + '</span>'; }).join('') + '</div>' +
          '<p style="color:#166534;font-size:12.5px;margin:6px 0 0"><i class="ti ti-check"></i> Se activa (con el nombre real del cliente en lugar de «Juan»).</p>' +
          ((a.preguntas || []).length ? '<p style="color:#475569;font-size:12.5px;margin:6px 0 0">Luego pregunta, una por una: ' + a.preguntas.map(function(p, i){ return (i + 1) + ') ' + esc(p.pregunta); }).join(' · ') +
            (a.mensaje_final ? '. Al terminar: «' + esc(String(a.mensaje_final).replace(/\{nombre\}/gi, nombre)) + '»' : '') + '</p>' : '') +
          ((a.etiquetas_auto || []).length ? '<div class="bcau-chips" style="margin-top:6px">Etiquetas: ' + a.etiquetas_auto.map(chipEtiqueta).join('') + '</div>' : '');
      } else {
        html += '</div><p style="color:#475569;font-size:12.5px;margin:6px 0 0"><i class="ti ti-x"></i> No se activa: ese mensaje no tiene ninguna de las palabras clave.</p>';
      }
      res.innerHTML = html;
    }
    inp.addEventListener('input', pinta);
    setTimeout(function(){ inp.focus(); }, 30);
  }

  async function historialMensaje(a){
    caja('Historial — ' + a.nombre, '<div class="bcau-vacio"><i class="ti ti-loader"></i>Cargando…</div>');
    var r = await cli().from('social_auto_respuestas').select('*').eq('automatizacion_id', a.id).order('creado_en', { ascending: false }).limit(100);
    var fl = (a.preguntas || []).length ? await cli().from('social_auto_flujos').select('*').eq('automatizacion_id', a.id).order('creado_en', { ascending: false }).limit(50) : { data: [] };
    var estF = { activo:'Contestando', completo:'Completo', cancelado:'Cancelado', vencido:'Sin terminar' };
    var formularios = (fl.data || []).map(function(x){
      return '<div class="bcau-fila"><div style="flex:1;min-width:0"><b>' + esc(x.contacto || 'Cliente') + '</b> <small style="color:#475569">' + fecha(x.creado_en) + '</small><div>' +
        ((x.respuestas || []).map(function(rr){ return '<span class="bcau-chip">' + esc(campoTxt(rr.campo)) + ': ' + esc(rr.valor) + '</span>'; }).join(' ') || '<small style="color:#475569">Sin respuestas todavía</small>') + '</div></div>' +
        '<span class="bcau-est ' + (x.estado === 'completo' ? 'ok' : x.estado === 'activo' ? 'enviando' : 'omitido_tomado') + '">' + (estF[x.estado] || esc(x.estado)) + '</span></div>';
    }).join('');
    var txt = { ok:'Respondido', error:'Error', omitido_tomado:'Omitido: chat tomado', enviando:'Enviando' };
    var filas = (r.data || []).map(function(e){
      return '<div class="bcau-fila"><div style="flex:1;min-width:0"><b>' + esc(e.contacto || 'Cliente') + '</b> <small style="color:#475569">' + fecha(e.creado_en) + (e.boton ? ' · tocó «' + esc(e.boton) + '»' : '') + '</small><div>' + esc(e.texto || '') + '</div>' +
        (e.error ? '<div class="bcau-err">' + esc(e.error) + '</div>' : '') + '</div>' +
        '<span class="bcau-est ' + esc(e.estado) + '">' + (txt[e.estado] || esc(e.estado)) + '</span></div>';
    }).join('');
    if (formularios) filas = '<h4 style="margin:0 0 6px;font-size:14px">Datos recogidos</h4>' + formularios + '<h4 style="margin:14px 0 6px;font-size:14px">Mensajes</h4>' + filas;
    var f = caja('Historial — ' + a.nombre, filas || '<div class="bcau-vacio"><i class="ti ti-inbox"></i>Todavía no ha respondido a nadie.</div>',
      '<button type="button" class="bcau-btn" data-bcau="volver"><i class="ti ti-arrow-left"></i> Volver</button>');
    f.querySelector('[data-bcau="volver"]').onclick = pintarLista;
  }

  // ---------- Datos del formulario en el chat de WhatsApp (franja azul arriba de los mensajes) ----------
  var formCache = {}, formPidiendo = {};
  async function cargarFormulario(id){
    if (!id || formPidiendo[id] || (formCache[id] && Date.now() - formCache[id].t < 30000)) return;
    formPidiendo[id] = true;
    try {
      var r = await cli().from('social_auto_flujos').select('estado,respuestas,actualizado_en,automatizacion_id').eq('canal', 'whatsapp').eq('hilo_id', id)
        .in('estado', ['activo', 'completo']).order('creado_en', { ascending: false }).limit(1);
      formCache[id] = { t: Date.now(), f: (r.data || [])[0] || null };
    } catch(e){ formCache[id] = { t: Date.now(), f: null }; }
    formPidiendo[id] = false;
    pintarFormulario();
  }
  var formOcultos = {};
  function pintarFormulario(){
    var det = document.getElementById('waDetalle'); if (!det) return;
    var id = null; try { id = (typeof _waHiloId !== 'undefined') ? _waHiloId : null; } catch(e){}
    var ya = det.querySelector('.bcau-form');
    var c = id && formCache[id], fo = c && c.f;
    if (!id || canal() !== 'whatsapp') { if (ya) ya.remove(); return; }
    if (!c) { cargarFormulario(id); if (ya && ya.dataset.hilo !== id) ya.remove(); return; }
    cargarFormulario(id);
    if (!fo || !(fo.respuestas || []).length || formOcultos[id]) { if (ya) ya.remove(); return; }
    var firma = id + '|' + fo.estado + '|' + fo.actualizado_en;
    if (ya && ya.dataset.firma === firma) return;
    if (ya) ya.remove();
    css();
    var box = document.createElement('div'); box.className = 'bcau-form'; box.dataset.hilo = id; box.dataset.firma = firma;
    box.innerHTML = '<i class="ti ti-forms" style="font-size:18px;margin-top:1px"></i><div class="tx"><b>' + (fo.estado === 'completo' ? 'Datos que dio el cliente' : 'El cliente está contestando las preguntas') + '</b><dl>' +
      fo.respuestas.map(function(r){ return '<div><dt>' + esc(campoTxt(r.campo)) + ':</dt><dd>' + esc(r.valor) + '</dd></div>'; }).join('') + '</dl></div>' +
      '<button type="button" aria-label="Ocultar datos del formulario" title="Ocultar"><i class="ti ti-x"></i></button>';
    box.querySelector('button').onclick = function(){ formOcultos[id] = true; box.remove(); };
    var scroll = det.querySelector('#waMessagesScroll');
    if (scroll && scroll.parentNode) scroll.parentNode.insertBefore(box, scroll); else det.appendChild(box);
  }

  // ---------- Botón en la fila de filtros de Instagram/Facebook ----------
  function asegurarBoton(){
    var nav = document.getElementById('bcSmartInteractionNav');
    if (!nav) return;
    var c = canal(), visible = esAdmin() && (c === 'instagram' || c === 'facebook');
    var b = nav.querySelector('.bcau-chip-btn');
    if (!visible) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement('button');
    b.type = 'button'; b.className = 'bc-smart-interaction bcau-chip-btn';
    b.title = 'Automatizaciones: comentario → privado y respuestas en chats';
    b.innerHTML = '<span class="bc-smart-interaction-icon"><i class="ti ti-bolt"></i></span><span class="bc-smart-interaction-copy"><b><i class="ti ti-bolt" style="color:#FF6B35"></i> Automatizaciones</b><small>Comentario → privado</small></span>';
    b.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); abrir(); });
    nav.appendChild(b);
  }
  // En WhatsApp: ícono en las acciones rápidas (abre directo en «Respuestas en chats»).
  function asegurarBotonWa(){
    var acc = document.querySelector('#v-crmLinea .crm-acciones-rapidas');
    if (!acc) return;
    var b = document.getElementById('bcauWaBtn');
    if (!esAdmin()) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement('button');
    b.type = 'button'; b.id = 'bcauWaBtn'; b.className = 'crm-icon-btn';
    b.title = 'Respuestas automáticas por palabra clave'; b.setAttribute('aria-label', 'Respuestas automáticas por palabra clave');
    b.innerHTML = '<i class="ti ti-bolt"></i>';
    b.addEventListener('click', function(ev){ ev.preventDefault(); abrir('mensaje'); });
    var ref = acc.querySelector('[onclick^="renderCrmLinea"]');
    acc.insertBefore(b, ref || null);
  }
  var pend = false;
  var obs = new MutationObserver(function(){ if (pend) return; pend = true; requestAnimationFrame(function(){ pend = false; asegurarBoton(); asegurarBotonWa(); pintarFormulario(); }); });
  function iniciar(){
    var v = document.getElementById('v-crmLinea');
    if (!v) { setTimeout(iniciar, 400); return; }
    obs.observe(v, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-social-channel'] });
    asegurarBoton(); asegurarBotonWa();
  }
  iniciar();

  window.BayolAutomatizaciones = { abrir: abrir, version: VERSION, _st: st };
})();
