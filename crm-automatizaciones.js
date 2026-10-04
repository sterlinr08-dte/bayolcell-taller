/* 4 oct 2026 — Automatizaciones estilo ManyChat, Fase 1: «Comentario → privado» (Instagram / Facebook).
   Panel solo para administradores. Cada automatización nace APAGADA; solo envía la que el administrador active.
   El envío lo hace el motor del servidor (Edge `social-automatizaciones`, cron cada 2 min), no esta pantalla.
   Botón «Automatizaciones» en la fila de filtros de Instagram/Facebook (#bcSmartInteractionNav).
   Capa aislada: no cambia ids/onclick existentes. API: window.BayolAutomatizaciones.abrir() */
(function(){
  'use strict';
  if (window.BayolAutomatizaciones) return;
  var VERSION = '20261004-a1';
  var st = { lista: [], editando: null, posts: {}, cargandoPosts: false };

  function cli(){ return (typeof supabaseClient !== 'undefined') ? supabaseClient : window.supabaseClient; }
  function esAdmin(){ try { return typeof isAdminUser === 'function' && isAdminUser(); } catch(e){ return false; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function aviso(m, err){ try { (err && typeof toastError === 'function') ? toastError(m) : toast(m); } catch(e){ console.log(m); } }
  async function preguntar(m){ try { if (typeof confirmar === 'function') return await confirmar(m); } catch(e){} return window.confirm(m); }
  function $(s, r){ return (r || document).querySelector(s); }
  function canal(){ var v = document.getElementById('v-crmLinea'); return v ? v.getAttribute('data-social-channel') : ''; }
  function fecha(t){ if (!t) return '—'; var d = new Date(t); if (isNaN(d)) return '—';
    return d.toLocaleString('es-DO', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' }); }
  function red(p){ return p === 'instagram' ? { n:'Instagram', ic:'ti-brand-instagram', col:'#d62976' } : { n:'Facebook', ic:'ti-brand-facebook', col:'#0866ff' }; }
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

  async function abrir(){
    if (!esAdmin()) { aviso('Solo un administrador puede configurar automatizaciones.', true); return; }
    st.editando = null;
    caja('Automatizaciones', '<div class="bcau-vacio"><i class="ti ti-loader"></i>Cargando…</div>');
    try { await cargar(); pintarLista(); }
    catch(e){ caja('Automatizaciones', '<div class="bcau-vacio"><i class="ti ti-alert-triangle"></i>No se pudieron cargar las automatizaciones.</div>'); }
  }

  function tarjeta(a){
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
    var cuerpo = '<div class="bcau-nota"><b>Comentario → mensaje privado.</b> Cuando alguien comenta la palabra clave en tu publicación, le llega un mensaje privado automático (una vez por persona y publicación). ' +
      'Solo envían las que tú actives, solo a comentarios hechos después de activarlas, y nunca si ese chat ya lo atiende un empleado.</div>';
    cuerpo += st.lista.length ? st.lista.map(tarjeta).join('') :
      '<div class="bcau-vacio"><i class="ti ti-bolt"></i><b>Todavía no tienes automatizaciones</b><br>Crea la primera: por ejemplo, «Comenta PRECIO y te lo mando por privado».</div>';
    var f = caja('Automatizaciones', cuerpo, '<button type="button" class="bcau-btn pri" data-bcau="nueva"><i class="ti ti-plus"></i> Nueva automatización</button>');
    f.querySelector('[data-bcau="nueva"]').onclick = function(){ editor(null); };
    f.querySelectorAll('.bcau-card').forEach(function(card){
      var a = st.lista.find(function(x){ return x.id === card.dataset.id; });
      card.addEventListener('click', function(e){
        var b = e.target.closest('[data-acc]'); if (!b || !a) return;
        var acc = b.dataset.acc;
        if (acc === 'editar') editor(a);
        else if (acc === 'previa') vistaPrevia(a);
        else if (acc === 'historial') historial(a);
        else if (acc === 'revisar') revisarAhora(a, b);
        else if (acc === 'borrar') borrar(a);
      });
      var sw = card.querySelector('input[data-acc="activo"]');
      sw.addEventListener('change', function(){ cambiarActivo(a, sw); });
    });
  }

  async function cambiarActivo(a, sw){
    var activar = sw.checked;
    if (activar) {
      var ok = await preguntar('¿Activar «' + a.nombre + '»?\n\nDesde ahora, cada persona que comente ' +
        (a.coincidencia === 'cualquiera' ? 'cualquier cosa' : '«' + (a.palabras || []).join('», «') + '»') +
        (a.post_id ? ' en esa publicación' : ' en tus publicaciones recientes') + ' de ' + red(a.plataforma).n +
        ' recibirá este mensaje privado automático:\n\n' + a.mensaje_privado);
      if (!ok) { sw.checked = false; return; }
    }
    sw.disabled = true;
    var r = await cli().from('social_automatizaciones').update({ activo: activar }).eq('id', a.id);
    if (r.error) { sw.checked = !activar; sw.disabled = false; aviso('No se pudo guardar: ' + (r.error.message || ''), true); return; }
    aviso(activar ? 'Automatización activada. Revisa los comentarios cada 2 minutos.' : 'Automatización apagada.');
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
    b.title = 'Automatizaciones: comentario → mensaje privado';
    b.innerHTML = '<span class="bc-smart-interaction-icon"><i class="ti ti-bolt"></i></span><span class="bc-smart-interaction-copy"><b><i class="ti ti-bolt" style="color:#FF6B35"></i> Automatizaciones</b><small>Comentario → privado</small></span>';
    b.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); abrir(); });
    nav.appendChild(b);
  }
  var pend = false;
  var obs = new MutationObserver(function(){ if (pend) return; pend = true; requestAnimationFrame(function(){ pend = false; asegurarBoton(); }); });
  function iniciar(){
    var v = document.getElementById('v-crmLinea');
    if (!v) { setTimeout(iniciar, 400); return; }
    obs.observe(v, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-social-channel'] });
    asegurarBoton();
  }
  iniciar();

  window.BayolAutomatizaciones = { abrir: abrir, version: VERSION, _st: st };
})();
