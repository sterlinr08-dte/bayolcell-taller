/* bc-permisos-listas.js — 21-oct-2026 (dueño, referencia «Traspaso» de Moxen: «Aplícalo»).
   1) Ventana del ROL: los permisos se ven en dos listas (Disponibles / Asignados) que se pasan con la flecha, doble toque
      o arrastrando. Las casillas de siempre (#permisosContainer) siguen siendo la fuente: la lista solo las marca, así
      guardarRol() no cambia.
   2) Ventana del EMPLEADO: «Permisos de esta persona». Tiene todo lo de su rol y aquí se le agrega (Extra) o se le quita
      (Quitado) algo solo a ella. Se guarda en tecnicos.permisos_extra ({permiso: true|false}); la base lo respeta en
      app_actor_tiene_permiso y el taller al iniciar sesión.
   Apagar: localStorage.bc_permlistas_off = '1'. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_permlistas_off') === '1') return; } catch (e) {}
  var doc = document;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function defs() { try { return typeof PERMISOS_DEF !== 'undefined' ? PERMISOS_DEF : []; } catch (e) { return []; } }
  function todos() {
    var out = []; defs().forEach(function (g) { var gn = String(g.grupo || '').replace(/^\S+\s/, ''); (g.items || []).forEach(function (i) { out.push({ id: i.id, lb: String(i.label || '').replace(/^🧠 /, ''), g: gn }); }); });
    return out;
  }
  function nivel(lb) {
    if (/^SOLO/i.test(lb)) return ['Modo', 'm'];
    if (/^(Eliminar|Cancelar)/i.test(lb)) return ['Borrar', 'b'];
    if (/^Ver/i.test(lb) && !/editar|usar|registrar/i.test(lb)) return ['Lectura', ''];
    return ['Edición', ''];
  }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Componente de dos listas ──
  // op: { asignados:Set, marca(id)->[texto,clase]|null, alMover(ids, haciaAsignados), soloLectura }
  function DosListas(host, op) {
    var T = todos(), POR = {}; T.forEach(function (p) { POR[p.id] = p; });
    var st = { sel: { d: new Set(), a: new Set() }, q: { d: '', a: '' }, foco: { d: 0, a: 0 } };
    function lado(id) { return op.asignados.has(id) ? 'a' : 'd'; }
    function vis(k) { var t = st.q[k].trim().toLowerCase(); return T.filter(function (p) { return lado(p.id) === k && (!t || (p.lb + ' ' + p.g).toLowerCase().indexOf(t) >= 0); }); }
    host.classList.add('bcpl');
    host.innerHTML = '<div class="bcpl-grid"><section class="bcpl-p" data-k="d"></section><div class="bcpl-mid">' +
      '<button type="button" class="bcpl-fl" data-dir="a" aria-label="Asignar los marcados"><span>→</span></button>' +
      '<button type="button" class="bcpl-fl" data-dir="d" aria-label="Quitar los marcados"><span>←</span></button></div>' +
      '<section class="bcpl-p" data-k="a"></section></div>' +
      '<div class="bcpl-ay">Toque para marcar · doble toque pasa uno · en la computadora también se arrastra.</div>';
    function panel(k) {
      var el = host.querySelector('.bcpl-p[data-k="' + k + '"]'), v = vis(k), total = T.filter(function (p) { return lado(p.id) === k; }).length;
      var ns = Array.from(st.sel[k]).filter(function (id) { return lado(id) === k; }).length;
      var ck = !ns ? '' : (ns === v.length && v.length ? 'on' : 'mid'), html = '', g = '';
      v.forEach(function (p, i) {
        if (p.g !== g) { g = p.g; html += '<div class="bcpl-g">' + esc(g) + '</div>'; }
        var m = (op.marca && op.marca(p.id)) || nivel(p.lb), s = st.sel[k].has(p.id);
        html += '<div class="bcpl-it' + (s ? ' sel' : '') + '" data-id="' + p.id + '" data-i="' + i + '" role="option" aria-selected="' + s + '">' +
          '<span class="bcpl-ck' + (s ? ' on' : '') + '">' + (s ? '✓' : '') + '</span><span class="bcpl-tx">' + esc(p.lb) + '</span><span class="bcpl-tag ' + m[1] + '">' + m[0] + '</span></div>';
      });
      if (!v.length) html = '<div class="bcpl-v">' + (st.q[k] ? 'Nada coincide con «' + esc(st.q[k]) + '».' : (k === 'a' ? 'Sin permisos asignados.' : 'Ya tiene todos los permisos.')) + '</div>';
      var inp = el.querySelector('input'), tenia = inp && doc.activeElement === inp;
      el.innerHTML = '<div class="bcpl-h"><button type="button" class="bcpl-all" aria-label="Marcar todos"><span class="bcpl-ck ' + ck + '">' + (ck === 'on' ? '✓' : ck === 'mid' ? '–' : '') + '</span></button>' +
        '<b>' + (k === 'd' ? 'Disponibles' : 'Asignados') + '</b><span class="bcpl-n">' + (ns ? ns + ' / ' : '') + total + '</span></div>' +
        '<input type="search" class="bcpl-q" placeholder="Buscar permiso…" aria-label="Buscar permiso" value="' + esc(st.q[k]) + '">' +
        '<div class="bcpl-l" tabindex="0" role="listbox" aria-multiselectable="true">' + html + '</div>';
      if (tenia) { var n = el.querySelector('input'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
    }
    function pintar() {
      panel('d'); panel('a');
      ['a', 'd'].forEach(function (dir) {
        var b = host.querySelector('.bcpl-fl[data-dir="' + dir + '"]'), n = st.sel[dir === 'a' ? 'd' : 'a'].size;
        b.disabled = !n || op.soloLectura; b.classList.toggle('listo', !!n && !op.soloLectura);
        var o = b.querySelector('b'); if (o) o.remove(); if (n) b.insertAdjacentHTML('beforeend', '<b>' + n + '</b>');
      });
      if (op.alPintar) op.alPintar();
    }
    function mover(ids, hacia) {
      if (!ids.length || op.soloLectura) return;
      var desde = {}; ids.forEach(function (id) { var r = host.querySelector('.bcpl-it[data-id="' + id + '"]'); if (r) desde[id] = r.getBoundingClientRect(); });
      op.alMover(ids, hacia === 'a'); st.sel.d.clear(); st.sel.a.clear(); pintar();
      if (reduce) return;
      ids.forEach(function (id, n) {
        var dst = host.querySelector('.bcpl-it[data-id="' + id + '"]'), a = desde[id]; if (!dst || !a) return;
        var b = dst.getBoundingClientRect(); dst.classList.add('vuela');
        var c = doc.createElement('div'); c.className = 'bcpl-vuelo'; c.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
        c.textContent = POR[id] ? POR[id].lb : id; doc.body.appendChild(c);
        var an = c.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + (b.left - a.left) / 2 + 'px,' + ((b.top - a.top) / 2 - 24) + 'px) scale(1.03)', offset: .5 }, { transform: 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px)' }],
          { duration: 380, delay: Math.min(n, 8) * 35, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
        an.onfinish = function () { c.remove(); dst.classList.remove('vuela'); };
      });
    }
    host.addEventListener('click', function (e) {
      var all = e.target.closest('.bcpl-all'); if (all) { var k = all.closest('.bcpl-p').dataset.k, v = vis(k), tod = v.length && v.every(function (p) { return st.sel[k].has(p.id); }); v.forEach(function (p) { tod ? st.sel[k].delete(p.id) : st.sel[k].add(p.id); }); pintar(); return; }
      var it = e.target.closest('.bcpl-it'); if (it) { var k2 = it.closest('.bcpl-p').dataset.k, id = it.dataset.id; st.sel[k2].has(id) ? st.sel[k2].delete(id) : st.sel[k2].add(id); st.foco[k2] = +it.dataset.i; pintar(); return; }
      var fl = e.target.closest('.bcpl-fl'); if (fl) { var dir = fl.dataset.dir; mover(Array.from(st.sel[dir === 'a' ? 'd' : 'a']), dir); }
    });
    host.addEventListener('dblclick', function (e) { var it = e.target.closest('.bcpl-it'); if (!it) return; var k = it.closest('.bcpl-p').dataset.k; mover([it.dataset.id], k === 'd' ? 'a' : 'd'); });
    host.addEventListener('input', function (e) { if (!e.target.classList.contains('bcpl-q')) return; var k = e.target.closest('.bcpl-p').dataset.k; st.q[k] = e.target.value; st.foco[k] = 0; panel(k); });
    host.addEventListener('keydown', function (e) {
      var l = e.target.closest && e.target.closest('.bcpl-l'); if (!l) return; var k = l.closest('.bcpl-p').dataset.k, v = vis(k); if (!v.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); st.foco[k] = Math.max(0, Math.min(v.length - 1, st.foco[k] + (e.key === 'ArrowDown' ? 1 : -1))); }
      else if (e.key === ' ') { e.preventDefault(); var id = v[st.foco[k]].id; st.sel[k].has(id) ? st.sel[k].delete(id) : st.sel[k].add(id); }
      else if (e.key === 'Enter') { e.preventDefault(); mover(st.sel[k].size ? Array.from(st.sel[k]) : [v[st.foco[k]].id], k === 'd' ? 'a' : 'd'); return; }
      else return;
      panel(k); var nl = host.querySelector('.bcpl-p[data-k="' + k + '"] .bcpl-l'); nl.focus(); var f = nl.querySelector('.bcpl-it[data-i="' + st.foco[k] + '"]'); if (f) { f.classList.add('foco'); f.scrollIntoView({ block: 'nearest' }); }
    });
    var drag = null;
    host.addEventListener('pointerdown', function (e) { var it = e.target.closest('.bcpl-it'); if (!it || e.pointerType !== 'mouse' || e.button !== 0 || op.soloLectura) return; drag = { id: it.dataset.id, k: it.closest('.bcpl-p').dataset.k, x: e.clientX, y: e.clientY }; });
    doc.addEventListener('pointermove', function (e) {
      if (!drag) return; if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      if (!drag.on) { drag.on = true; drag.ids = st.sel[drag.k].has(drag.id) ? Array.from(st.sel[drag.k]) : [drag.id]; drag.c = doc.createElement('div'); drag.c.className = 'bcpl-vuelo'; drag.c.textContent = drag.ids.length > 1 ? drag.ids.length + ' permisos' : (POR[drag.id] || {}).lb; doc.body.appendChild(drag.c); }
      drag.c.style.left = (e.clientX + 12) + 'px'; drag.c.style.top = (e.clientY + 8) + 'px';
      var otro = host.querySelector('.bcpl-p[data-k="' + (drag.k === 'd' ? 'a' : 'd') + '"]'), r = otro.getBoundingClientRect();
      drag.den = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; otro.classList.toggle('drop', drag.den);
    });
    doc.addEventListener('pointerup', function () { if (!drag) return; if (drag.on) { drag.c.remove(); host.querySelectorAll('.drop').forEach(function (x) { x.classList.remove('drop'); }); if (drag.den) mover(drag.ids, drag.k === 'd' ? 'a' : 'd'); } drag = null; });
    pintar();
    return { pintar: pintar };
  }

  // ── 1) Ventana del ROL ──
  function enRol() {
    var cont = doc.getElementById('permisosContainer'); if (!cont) return;
    var cbs = Array.from(cont.querySelectorAll('input[type="checkbox"][data-permiso]')); if (!cbs.length) return;
    var por = {}; cbs.forEach(function (cb) { por[cb.dataset.permiso] = cb; });
    var host = doc.getElementById('bcplRol');
    // Siempre un contenedor nuevo: así no quedan dos listas escuchando los mismos toques.
    var nuevo = doc.createElement('div'); nuevo.id = 'bcplRol';
    if (host) host.replaceWith(nuevo); else cont.parentNode.insertBefore(nuevo, cont);
    host = nuevo;
    cont.style.display = 'none';
    var marcar = doc.querySelector('#modalRol [onclick="rolToggleTodos(true)"]'); if (marcar && marcar.parentNode) marcar.parentNode.style.display = 'none';
    var asig = new Set(cbs.filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.permiso; }));
    DosListas(host, {
      asignados: asig, soloLectura: cbs.every(function (c) { return c.disabled; }),
      alMover: function (ids, alta) { ids.forEach(function (id) { if (alta) asig.add(id); else asig.delete(id); if (por[id]) por[id].checked = alta; }); }
    });
  }
  function engancharRol() {
    if (typeof window.renderPermisosCheckboxes !== 'function' || window.renderPermisosCheckboxes._bcpl) return;
    var orig = window.renderPermisosCheckboxes;
    window.renderPermisosCheckboxes = function () { var r = orig.apply(this, arguments); try { enRol(); } catch (e) {} return r; };
    window.renderPermisosCheckboxes._bcpl = true;
    ['editarRol', 'abrirModalRol'].forEach(function (fn) {
      if (typeof window[fn] !== 'function' || window[fn]._bcpl) return;
      var o = window[fn]; window[fn] = function () { var r = o.apply(this, arguments); try { enRol(); } catch (e) {} return r; }; window[fn]._bcpl = true;
    });
  }

  // ── 2) Ventana del EMPLEADO ──
  var emp = { id: null, extra: {}, original: '{}' };
  function rolSel() { var s = doc.getElementById('mod_tec_rol_id'); var id = s && s.value; try { return id ? (_rolesCache || []).find(function (r) { return r.id === id; }) : null; } catch (e) { return null; } }
  function pintarEmp() {
    var sel = doc.getElementById('mod_tec_rol_id'); if (!sel) return;
    var box = doc.getElementById('bcplEmp');
    if (!box) {
      box = doc.createElement('div'); box.id = 'bcplEmp'; box.className = 'form-row';
      sel.closest('.form-row').insertAdjacentElement('afterend', box);
      sel.addEventListener('change', pintarEmp);
    }
    var tipo = (doc.getElementById('mod_tec_tipo') || {}).value;
    if (tipo === 'admin') { box.innerHTML = '<label>Permisos de esta persona</label><div class="bcpl-res">Es administrador: tiene todos los permisos.</div>'; return; }
    var r = rolSel();
    if (!r) { box.innerHTML = '<label>Permisos de esta persona</label><div class="bcpl-res">Escoja primero un <b>rol</b> arriba. Después aquí se le puede agregar o quitar algo solo a esta persona.</div>'; return; }
    if (!emp.id) { box.innerHTML = '<label>Permisos de esta persona</label><div class="bcpl-res">Guarde primero al empleado. Al editarlo podrá darle o quitarle permisos solo a esta persona.</div>'; return; }
    var base = r.permisos || {}, asig = new Set();
    todos().forEach(function (p) { var v = p.id in emp.extra ? emp.extra[p.id] : base[p.id] === true; if (v) asig.add(p.id); });
    box.innerHTML = '<label>Permisos de esta persona</label><div class="bcpl-res" id="bcplEmpRes"></div><div id="bcplEmpL"></div>';
    var nombre = ((doc.getElementById('mod_tec_nombre') || {}).value || 'Esta persona').split(' ')[0];
    DosListas(doc.getElementById('bcplEmpL'), {
      asignados: asig,
      marca: function (id) { var enRol = base[id] === true; if (asig.has(id)) return enRol ? ['Del rol', 'r'] : ['Extra', 'x']; return enRol ? ['Quitado', 'q'] : null; },
      alMover: function (ids, alta) { ids.forEach(function (id) { if (alta) asig.add(id); else asig.delete(id); var enRol = base[id] === true; if (alta === enRol) delete emp.extra[id]; else emp.extra[id] = alta; }); },
      alPintar: function () {
        var T = todos(), ex = T.filter(function (p) { return emp.extra[p.id] === true; }), qu = T.filter(function (p) { return emp.extra[p.id] === false; });
        var el = doc.getElementById('bcplEmpRes'); if (!el) return;
        el.innerHTML = '<b>' + esc(nombre) + '</b> tiene todo lo del rol <b>' + esc(r.nombre) + '</b>' +
          (ex.length ? ', <b>más</b>: ' + ex.map(function (p) { return '«' + esc(p.lb) + '»'; }).join(', ') : '') +
          (qu.length ? '; <b>menos</b>: ' + qu.map(function (p) { return '«' + esc(p.lb) + '»'; }).join(', ') : '') +
          (ex.length || qu.length ? '.' : ', sin nada extra.') +
          '<small>Lo que cambie aquí es solo para esta persona. Si cambia el rol, les cambia a todos los de ese rol.</small>';
      }
    });
  }
  function engancharEmp() {
    if (typeof window.editarTecnico === 'function' && !window.editarTecnico._bcpl) {
      var oE = window.editarTecnico;
      window.editarTecnico = function (id) {
        var r = oE.apply(this, arguments);
        try { var t = (cache.tecnicos || []).find(function (x) { return x.id === id; }) || {}; emp.id = id; emp.extra = Object.assign({}, t.permisos_extra || {}); emp.original = JSON.stringify(emp.extra); } catch (e) { emp.id = id; emp.extra = {}; emp.original = '{}'; }
        setTimeout(pintarEmp, 0); setTimeout(pintarEmp, 400); // el selector de roles puede llenarse después
        return r;
      };
      window.editarTecnico._bcpl = true;
    }
    if (typeof window.abrirModalTecnico === 'function' && !window.abrirModalTecnico._bcpl) {
      var oA = window.abrirModalTecnico;
      window.abrirModalTecnico = function () { var r = oA.apply(this, arguments); emp.id = null; emp.extra = {}; emp.original = '{}'; setTimeout(pintarEmp, 0); return r; };
      window.abrirModalTecnico._bcpl = true;
    }
    if (typeof window.guardarTecnico === 'function' && !window.guardarTecnico._bcpl) {
      var oG = window.guardarTecnico;
      window.guardarTecnico = async function () {
        // Lo de la persona se guarda antes, así la recarga de la lista ya lo trae.
        if (emp.id && JSON.stringify(emp.extra) !== emp.original) {
          try {
            var res = await supabaseClient.from('tecnicos').update({ permisos_extra: emp.extra }).eq('id', emp.id);
            if (res.error) throw res.error;
            emp.original = JSON.stringify(emp.extra);
          } catch (e) { try { toast('No se pudieron guardar los permisos de esta persona: ' + (e.message || e), 'error'); } catch (er) {} return; }
        }
        return oG.apply(this, arguments);
      };
      window.guardarTecnico._bcpl = true;
    }
    var tipo = doc.getElementById('mod_tec_tipo'); if (tipo && !tipo._bcpl) { tipo._bcpl = true; tipo.addEventListener('change', function () { setTimeout(pintarEmp, 0); }); }
  }

  var css = doc.createElement('style');
  css.textContent =
    '.bcpl{--pl-b:var(--card-bg,#fff);--pl-ln:rgba(15,23,42,.10);--pl-t:#0f172a;--pl-m:#64748b;--pl-s:#94a3b8;--pl-sel:rgba(59,130,246,.10);--pl-selb:rgba(59,130,246,.45);--pl-az:#2563eb;--pl-na:#e4572e}' +
    '.bcpl-grid{display:grid;grid-template-columns:minmax(0,1fr) 60px minmax(0,1fr);gap:10px}' +
    '.bcpl-p{background:var(--pl-b);border:1px solid var(--pl-ln);border-radius:16px;display:flex;flex-direction:column;min-width:0}' +
    '.bcpl-h{display:flex;align-items:center;gap:8px;padding:8px 12px 6px}.bcpl-h b{flex:1;font-size:15px;color:var(--pl-t)}' +
    '.bcpl-n{font-size:12px;font-weight:700;color:var(--pl-m);background:#f1f5f9;border-radius:999px;padding:3px 9px}' +
    '.bcpl-all{min-width:44px;min-height:44px;display:grid;place-items:center;border:0;background:none;cursor:pointer;margin:-6px -6px -6px -8px}' +
    '.bcpl-ck{width:22px;height:22px;border-radius:7px;border:2px solid var(--pl-s);display:grid;place-items:center;flex:none;color:#fff;font-size:13px;line-height:1}' +
    '.bcpl-ck.on,.bcpl-ck.mid{background:var(--pl-az);border-color:var(--pl-az)}' +
    '.bcpl-q{margin:0 12px 8px;height:48px;border-radius:14px;border:1px solid var(--pl-ln);background:#f8fafc;color:var(--pl-t);font-size:16px;padding:0 14px;outline:none;width:auto}' +
    '.bcpl-q:focus{border-color:rgba(59,130,246,.6);box-shadow:0 0 0 4px rgba(59,130,246,.16)}' +
    '.bcpl-l{overflow:auto;max-height:46vh;padding:0 6px 10px;outline:none}' +
    '.bcpl-g{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--pl-s);padding:10px 8px 4px;position:sticky;top:0;background:var(--pl-b);z-index:1}' +
    '.bcpl-it{display:flex;align-items:center;gap:10px;min-height:48px;padding:5px 8px;border-radius:12px;cursor:pointer;user-select:none;-webkit-user-select:none;border:1px solid transparent;touch-action:pan-y}' +
    '.bcpl-it:hover{background:var(--pl-sel)}.bcpl-it.sel{background:var(--pl-sel);border-color:var(--pl-selb)}.bcpl-it.foco{outline:3px solid var(--pl-az);outline-offset:-2px}.bcpl-it.vuela{visibility:hidden}' +
    '.bcpl-tx{flex:1;min-width:0;font-size:14px;line-height:1.3;color:var(--pl-t)}' +
    '.bcpl-tag{font-size:11.5px;font-weight:600;padding:3px 8px;border-radius:999px;background:#f1f5f9;color:#475569;white-space:nowrap}' +
    '.bcpl-tag.b{background:#fef2f2;color:#b91c1c}.bcpl-tag.m{background:#f0fdf4;color:#15803d}.bcpl-tag.x{background:rgba(228,87,46,.14);color:#c2410c}.bcpl-tag.q{background:#fef2f2;color:#b91c1c;text-decoration:line-through}.bcpl-tag.r{color:#94a3b8}' +
    '.bcpl-v{color:var(--pl-m);text-align:center;padding:22px 10px;font-size:14px}' +
    '.bcpl-mid{display:flex;flex-direction:column;justify-content:center;gap:10px;align-items:center}' +
    '.bcpl-fl{position:relative;width:52px;height:52px;border-radius:16px;border:1px solid var(--pl-ln);background:var(--pl-b);color:var(--pl-t);font-size:22px;cursor:pointer;transition:transform .16s ease-out}' +
    '.bcpl-fl:active{transform:scale(.95)}.bcpl-fl:disabled{opacity:.4;cursor:default}.bcpl-fl.listo{background:var(--pl-na);color:#fff;border-color:var(--pl-na)}' +
    '.bcpl-fl b{position:absolute;top:-8px;right:-8px;min-width:22px;height:22px;border-radius:999px;background:#0f172a;color:#fff;font-size:12px;display:grid;place-items:center;padding:0 6px}' +
    '.bcpl .drop{border-color:var(--pl-na);box-shadow:0 0 0 4px rgba(228,87,46,.18)}' +
    '.bcpl-ay{font-size:12px;color:var(--pl-m);margin-top:8px}' +
    '.bcpl-res{background:#f8fafc;border:1px solid rgba(15,23,42,.08);border-radius:14px;padding:10px 14px;font-size:14px;line-height:1.5;color:#0f172a;margin-bottom:10px}.bcpl-res b{color:#c2410c}.bcpl-res small{display:block;color:#64748b;font-size:12.5px;margin-top:2px}' +
    '.bcpl-vuelo{position:fixed;z-index:3000;pointer-events:none;border-radius:12px;background:#fff;border:1px solid rgba(59,130,246,.45);box-shadow:0 12px 30px rgba(15,23,42,.18);display:flex;align-items:center;padding:6px 10px;font-size:14px;color:#0f172a}' +
    '.bcpl{container-type:inline-size}' +
    '@container (max-width:640px){.bcpl-grid{grid-template-columns:minmax(0,1fr)}.bcpl-mid{flex-direction:row}.bcpl-fl span{display:inline-block;transform:rotate(90deg)}.bcpl-l{max-height:38vh}}';
  doc.head.appendChild(css);

  function enganchar() { engancharRol(); engancharEmp(); }
  enganchar();
  if (doc.readyState !== 'complete') window.addEventListener('load', enganchar);
  setTimeout(enganchar, 1500);
  window.bcPermListas = { DosListas: DosListas, emp: emp };
})();
