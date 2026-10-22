/* BAYOL CELL: /financiamiento. Draft only; reuse existing send and GPS actions.
   22-oct-2026 (dueño: «agrega la opción de poder agregar respuestas rápidas»): respuestas rápidas guardadas en
   whatsapp_respuestas_rapidas (todas las ven; edita o borra quien la creó o un administrador). Salen primero en el
   menú «/» y en el botón ⚡ junto a la caja de escribir. Elegir una la pone en la caja (no se envía sola) y cambia
   {nombre} por el nombre del cliente. */
(() => {
  'use strict';
  if (window.__bcFinanciamientoQuickReply) return;
  const loadBranches = window._waSlashCargarSucursales;
  const chooseBranch = window._waSlashElegir;
  if (typeof loadBranches !== 'function' || typeof chooseBranch !== 'function') {
    console.warn('[CRM] Financiamiento: el menu de WhatsApp no esta disponible.');
    return;
  }
  window.__bcFinanciamientoQuickReply = '20261022-r1';

  const FORM = [
    '\ud83d\udccb *SOLICITUD DE FINANCIAMIENTO \u2013 BAYOL CELL*', '',
    'Para iniciar su solicitud de financiamiento, por favor complete las siguientes informaciones:', '',
    '\ud83e\udeaa *N\u00famero de c\u00e9dula:*',
    '\ud83d\udc64 *Nombres y apellidos:*',
    '\ud83d\udcf1 *Tel\u00e9fono o celular:*', '',
    '\ud83d\udccd *Direcci\u00f3n actual:*',
    '\u2022 Provincia:', '\u2022 Ciudad/Municipio:', '\u2022 Sector:',
    '\u2022 Calle:', '\u2022 No. de casa:', '',
    '\ud83d\udce6 *Equipo o art\u00edculo que desea financiar:*', '',
    'Por favor, verifique que todas las informaciones est\u00e9n correctas antes de enviarlas.'
  ].join('\n');
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const thread = () => typeof _waHiloId === 'undefined' ? null : _waHiloId;
  let menu, anchor, context, options = [], selected = 0, sequence = 0;
  let replies = [], repliesAt = 0, pendingReplies;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function loadReplies(force) {
    if (!force && Date.now() - repliesAt < 60000) return Promise.resolve(replies);
    if (pendingReplies) return pendingReplies;
    pendingReplies = Promise.resolve().then(() => supabaseClient.from('whatsapp_respuestas_rapidas')
      .select('id, atajo, texto, creado_por_id, creado_por_nombre').order('atajo', { ascending: true }).limit(300))
      .then(r => { if (!r.error) { replies = r.data || []; repliesAt = Date.now(); } return replies; })
      .catch(() => replies).finally(() => { pendingReplies = null; });
    return pendingReplies;
  }
  function clientName() {
    try {
      const h = (window._waHilos || (typeof _waHilos !== 'undefined' ? _waHilos : [])).find(x => x.id === thread());
      const n = String((h && h.nombre_perfil) || '').trim();
      if (!n || /^[+\d\s()-]+$/.test(n)) return '';
      return n.split(/\s+/)[0];
    } catch (e) { return ''; }
  }
  function fillText(texto) {
    const n = clientName();
    return String(texto || '').replace(/\{\s*nombre\s*\}/gi, n).replace(/[ \t]+([,.!?])/g, '$1').replace(/ {2,}/g, ' ');
  }
  function preview(t) { const x = String(t || '').replace(/\s+/g, ' ').trim(); return x.length > 70 ? x.slice(0, 68) + '…' : x; }
  let branches = [], pendingBranches;

  const style = document.createElement('style');
  style.textContent = '#waSlashMenu.bc-fin-menu{position:fixed!important;z-index:100000!important;box-sizing:border-box;width:300px;min-width:0!important;max-width:calc(100vw - 16px);overflow-y:auto;padding:6px;border-radius:12px;}#waSlashMenu.bc-fin-menu button{width:100%;text-align:left;white-space:normal;min-height:44px;}#waSlashMenu.bc-fin-menu .bc-fin-hint{display:block;font-size:11px;opacity:.75;}#waSlashMenu.bc-fin-menu .bc-fin-heading{padding:6px 10px;font-size:11px;opacity:.7;}textarea#waTexto.bc-fin-composer{resize:none!important;box-sizing:border-box;min-height:40px!important;max-height:140px!important;overflow-y:auto!important;white-space:pre-wrap!important;}';
  document.head.appendChild(style);

  function isCurrent(input, value, token) {
    return token === sequence && input === document.getElementById('waTexto') &&
      input.isConnected && !input.disabled && input.value === value && thread() === context;
  }
  function close() {
    sequence++;
    if (menu) menu.style.display = 'none';
    if (anchor) { anchor.setAttribute('aria-expanded', 'false'); anchor.removeAttribute('aria-activedescendant'); }
    options = [];
    selected = 0;
  }
  function isOpen() { return !!menu && menu.style.display === 'block'; }
  function position() {
    if (!isOpen()) return;
    if (!anchor?.isConnected || thread() !== context) { close(); return; }
    const r = anchor.getBoundingClientRect();
    const vv = window.visualViewport;
    const left = vv ? vv.offsetLeft : 0, top = vv ? vv.offsetTop : 0;
    const width = vv ? vv.width : window.innerWidth;
    const height = vv ? vv.height : window.innerHeight;
    menu.style.width = Math.max(0, Math.min(300, width - 16)) + 'px';
    menu.style.maxHeight = Math.max(44, Math.min(320, height - 16)) + 'px';
    menu.style.left = Math.max(left + 8, Math.min(r.left, left + width - menu.offsetWidth - 8)) + 'px';
    const above = r.top - menu.offsetHeight - 6;
    menu.style.top = Math.max(top + 8, Math.min(above >= top + 8 ? above : r.bottom + 6, top + height - menu.offsetHeight - 8)) + 'px';
  }
  function highlight() {
    menu?.querySelectorAll('button[data-fin-index]').forEach((button, i) => {
      button.classList.toggle('wa-slash-hl', i === selected);
      button.setAttribute('aria-selected', String(i === selected));
    });
    if (options[selected]) anchor?.setAttribute('aria-activedescendant', 'bcFinOption-' + selected);
    else anchor?.removeAttribute('aria-activedescendant');
  }
  function resizeComposer(input) {
    if (!input?.classList.contains('bc-fin-composer')) return;
    input.style.setProperty('height', '40px', 'important');
    input.style.setProperty('height', Math.min(140, Math.max(40, input.scrollHeight + 2)) + 'px', 'important');
  }
  function insertForm(input, text) {
    if (input.tagName !== 'TEXTAREA') {
      const area = document.createElement('textarea');
      for (const a of input.attributes) {
        if (!['type', 'value', 'size'].includes(a.name)) area.setAttribute(a.name, a.value);
      }
      const css = window.getComputedStyle(input);
      for (const p of ['font', 'color', 'background-color', 'border', 'border-radius', 'padding', 'flex', 'width', 'min-width']) {
        area.style.setProperty(p, css.getPropertyValue(p));
      }
      for (const p of ['oninput', 'onkeydown', 'onkeyup', 'onfocus', 'onblur', 'onchange']) {
        if (typeof input[p] === 'function') area[p] = input[p];
      }
      area.rows = 1;
      input.replaceWith(area);
      input = area;
    }
    input.classList.add('bc-fin-composer');
    input.setAttribute('aria-multiline', 'true');
    input.value = text == null ? FORM : text;
    input.focus();
    input.setSelectionRange(0, 0);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    resizeComposer(input);
    window._waActualizarBotonEnvio?.();
    input.scrollTop = 0;
  }
  function choose(index) {
    const option = options[index], input = anchor;
    if (!option || !input?.isConnected || input !== document.getElementById('waTexto') ||
      input.disabled || !input.value.startsWith('/') || thread() !== context) { close(); return; }
    close();
    if (option.type === 'form') insertForm(input);
    else if (option.type === 'reply') insertForm(input, fillText(option.texto));
    else if (option.type === 'new' || option.type === 'admin') { input.value = ''; window._waActualizarBotonEnvio?.(); openManager(option.type === 'new'); }
    else chooseBranch(option.id);
  }
  function paint(input, loading) {
    if (!menu) {
      menu = document.getElementById('waSlashMenu') || document.createElement('div');
      menu.id = 'waSlashMenu';
      menu.className = 'wa-acciones-menu bc-fin-menu';
      menu.setAttribute('role', 'listbox');
      menu.setAttribute('aria-label', 'Respuestas rapidas y ubicaciones');
      if (!menu.isConnected) document.body.appendChild(menu);
    }
    anchor = input;
    const query = normalize(input.value.slice(1));
    const previous = options[selected];
    options = [];
    replies.filter(r => !query || normalize(r.atajo).includes(query) || normalize(r.texto).includes(query))
      .forEach(r => options.push({ type: 'reply', id: r.id, name: '/' + r.atajo, hint: preview(r.texto), texto: r.texto }));
    if (['financiamiento', 'financiar', 'solicitud', 'formulario', 'credito'].some(w => w.startsWith(query))) {
      options.push({ type: 'form', name: 'Financiamiento', hint: '/financiamiento - Insertar formulario' });
    }
    branches.filter(b => normalize(b.nombre).includes(query)).forEach(b => options.push({ type: 'branch', id: b.id, name: String(b.nombre), hint: 'Enviar ubicacion de la sucursal' }));
    options.push({ type: 'new', name: 'Nueva respuesta rápida', hint: 'Guardar un texto para usarlo con /' });
    if (replies.length) options.push({ type: 'admin', name: 'Administrar respuestas rápidas', hint: 'Editar o borrar' });
    const retained = previous ? options.findIndex(o => o.type === previous.type && o.id === previous.id) : -1;
    selected = retained >= 0 ? retained : (options.length ? 0 : -1);
    menu.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'bc-fin-heading';
    heading.textContent = 'Respuestas rápidas y ubicaciones';
    menu.appendChild(heading);
    options.forEach((option, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.tabIndex = -1; button.id = 'bcFinOption-' + i;
      button.dataset.finIndex = String(i); button.setAttribute('role', 'option');
      const icon = document.createElement('i');
      icon.className = 'ti ' + ({ form: 'ti-file-dollar', reply: 'ti-bolt', new: 'ti-plus', admin: 'ti-settings' }[option.type] || 'ti-map-pin');
      icon.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span'); text.textContent = option.name;
      const hint = document.createElement('small'); hint.className = 'bc-fin-hint'; hint.textContent = option.hint;
      text.appendChild(hint); button.append(icon, text);
      button.addEventListener('click', () => choose(i));
      menu.appendChild(button);
    });
    if (!options.length) {
      const empty = document.createElement('div'); empty.className = 'bc-fin-heading';
      empty.textContent = loading ? 'Cargando…' : 'Ninguna opción coincide.';
      menu.appendChild(empty);
    }
    input.setAttribute('aria-controls', 'waSlashMenu');
    input.setAttribute('aria-expanded', 'true');
    menu.style.display = 'block';
    highlight(); position();
  }
  async function detect(input) {
    if (!input?.isConnected || input.disabled || !input.value.startsWith('/')) { close(); return; }
    anchor = input; context = thread();
    const token = ++sequence, value = input.value;
    paint(input, true);
    try {
      if (!pendingBranches) {
        pendingBranches = Promise.resolve().then(() => loadBranches()).then(value => {
          branches = Array.isArray(value) ? value : [];
          return branches;
        }).finally(() => { pendingBranches = null; });
      }
      await Promise.all([pendingBranches, loadReplies()]);
    } catch (error) { console.warn('[CRM] No se pudieron cargar las ubicaciones del menu.'); }
    if (isCurrent(input, value, token)) paint(input, false);
  }
  // ---- Ventana para crear, editar y borrar respuestas rápidas ----
  function me() { try { return typeof _crmMiIdentidad === 'function' ? _crmMiIdentidad() : {}; } catch (e) { return {}; } }
  function amAdmin() { try { return typeof isAdminUser === 'function' && !!isAdminUser(); } catch (e) { return false; } }
  function canEdit(r) { const y = me(); return amAdmin() || (r.creado_por_id && y.id && String(r.creado_por_id) === String(y.id)); }
  let editing = null;
  function managerHTML(focusNew) {
    const list = replies.map(r => `<div class="bc-rr-item"><div class="bc-rr-tx"><b>/${esc(r.atajo)}</b><span>${esc(preview(r.texto))}</span>` +
      `<small>${esc(r.creado_por_nombre || '')}</small></div>` +
      (canEdit(r) ? `<div class="bc-rr-acc"><button type="button" data-rr-edit="${esc(r.id)}" aria-label="Editar"><i class="ti ti-pencil"></i></button>` +
        `<button type="button" data-rr-del="${esc(r.id)}" aria-label="Borrar"><i class="ti ti-trash"></i></button></div>` : '') + `</div>`).join('');
    return `<div class="bc-rr">
      <form class="bc-rr-form" autocomplete="off">
        <label>Atajo<input name="atajo" maxlength="40" placeholder="garantia" required></label>
        <label>Texto<textarea name="texto" rows="5" maxlength="4000" placeholder="Hola {nombre}, la pantalla tiene 30 días de garantía." required></textarea></label>
        <p class="bc-rr-ayuda">Escriba <b>/</b> y el atajo en el chat para usarla. <b>{nombre}</b> se cambia por el nombre del cliente.</p>
        <div class="bc-rr-btns"><button type="button" class="bc-rr-cancel" hidden>Cancelar</button><button type="submit" class="bc-rr-save">Guardar respuesta</button></div>
      </form>
      <div class="bc-rr-list">${list || '<p class="bc-rr-vacio">Todavía no hay respuestas rápidas.</p>'}</div></div>`;
  }
  function paintManager(focusNew) {
    const body = document.getElementById('modalGenericoBody'); const root = body && body.querySelector('.bc-rr');
    if (!root) return;
    root.outerHTML = managerHTML(focusNew);
    wireManager(focusNew);
  }
  function wireManager(focusNew) {
    const root = document.querySelector('#modalGenericoBody .bc-rr'); if (!root) return;
    const form = root.querySelector('.bc-rr-form'), at = form.atajo, tx = form.texto, save = form.querySelector('.bc-rr-save'), cancel = form.querySelector('.bc-rr-cancel');
    const setEditing = r => {
      editing = r || null;
      at.value = r ? r.atajo : ''; tx.value = r ? r.texto : '';
      save.textContent = r ? 'Guardar cambios' : 'Guardar respuesta'; cancel.hidden = !r;
      if (r) at.focus();
    };
    setEditing(null);
    cancel.addEventListener('click', () => setEditing(null));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const atajo = at.value.trim().replace(/^\/+/, '').replace(/\s+/g, '').toLowerCase(), texto = tx.value.trim();
      if (!atajo || !texto) { (atajo ? tx : at).focus(); return; }
      save.disabled = true; save.textContent = 'Guardando…';
      try {
        const q = supabaseClient.from('whatsapp_respuestas_rapidas');
        const r = editing ? await q.update({ atajo, texto }).eq('id', editing.id).select('id') : await q.insert({ atajo, texto }).select('id');
        if (r.error) throw r.error;
        if (editing && !(r.data || []).length) throw new Error('sin_permiso');
        await loadReplies(true); paintManager(false);
        window.toast?.(editing ? '✅ Respuesta rápida actualizada.' : '✅ Respuesta rápida guardada. Úsela con /' + atajo);
      } catch (err) {
        const m = String((err && (err.message || err.code)) || '');
        window.toastError?.(/23505|duplicate|unique/i.test(m) ? 'Ya existe una respuesta con el atajo /' + atajo + '.' : /sin_permiso|row-level|42501/i.test(m) ? 'Solo quien la creó o un administrador puede cambiarla.' : 'No se pudo guardar la respuesta.');
        save.disabled = false; save.textContent = editing ? 'Guardar cambios' : 'Guardar respuesta';
      }
    });
    root.querySelectorAll('[data-rr-edit]').forEach(b => b.addEventListener('click', () => setEditing(replies.find(r => r.id === b.dataset.rrEdit))));
    root.querySelectorAll('[data-rr-del]').forEach(b => b.addEventListener('click', async () => {
      const r = replies.find(x => x.id === b.dataset.rrDel); if (!r) return;
      if (!window.confirm('¿Borrar la respuesta rápida /' + r.atajo + '?')) return;
      const res = await supabaseClient.from('whatsapp_respuestas_rapidas').delete().eq('id', r.id).select('id');
      if (res.error || !(res.data || []).length) { window.toastError?.('No se pudo borrar. Solo quien la creó o un administrador puede borrarla.'); return; }
      await loadReplies(true); paintManager(false); window.toast?.('Respuesta rápida borrada.');
    }));
    if (focusNew) setTimeout(() => at.focus(), 60);
  }
  async function openManager(focusNew) {
    if (typeof abrirModalGenerico !== 'function') return;
    await loadReplies(true);
    abrirModalGenerico('Respuestas rápidas', managerHTML(focusNew), { ancho: '520px' });
    wireManager(focusNew);
  }
  // Botón ⚡ junto a la caja de escribir: abre el mismo menú que «/».
  window._waAbrirRapidas = function () {
    const input = document.getElementById('waTexto'); if (!input || input.disabled) return;
    if (input.value.trim() && !input.value.startsWith('/')) { openManager(true); return; }
    input.value = '/'; input.focus(); try { input.setSelectionRange(1, 1); } catch (e) {}
    detect(input);
  };
  window._waAdministrarRapidas = () => openManager(false);
  const rrStyle = document.createElement('style');
  rrStyle.textContent = '.bc-rr-form{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}.bc-rr-form label{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:700;color:#334155}' +
    '.bc-rr-form input,.bc-rr-form textarea{box-sizing:border-box;width:100%;min-height:48px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;font-size:16px;font-weight:400;color:#0f172a}' +
    '.bc-rr-form textarea{min-height:110px;resize:vertical}.bc-rr-ayuda{margin:0;font-size:13px;color:#64748b}.bc-rr-btns{display:flex;gap:8px}' +
    '.bc-rr-save,.bc-rr-cancel{flex:1;min-height:54px;border-radius:12px;border:0;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}.bc-rr-save{background:linear-gradient(180deg,#128C7E,#075E54);color:#fff}.bc-rr-save:disabled{opacity:.6}' +
    '.bc-rr-cancel{background:#f1f5f9;color:#334155}.bc-rr-save:active,.bc-rr-cancel:active{transform:scale(.97)}' +
    '.bc-rr-list{display:flex;flex-direction:column;gap:6px;border-top:1px solid #e2e8f0;padding-top:12px}.bc-rr-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:12px}' +
    '.bc-rr-tx{flex:1;min-width:0;display:flex;flex-direction:column}.bc-rr-tx b{font-size:14px;color:#075E54}.bc-rr-tx span{font-size:13px;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bc-rr-tx small{font-size:12px;color:#94a3b8}' +
    '.bc-rr-acc{display:flex;gap:4px}.bc-rr-acc button{width:44px;height:44px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:18px;cursor:pointer}.bc-rr-acc button:active{transform:scale(.95)}.bc-rr-vacio{margin:0;font-size:13px;color:#64748b;text-align:center;padding:10px}';
  document.head.appendChild(rrStyle);
  window._waSlashDetectar = detect;
  window._waSlashCerrar = close;
  window._waSlashAbierto = isOpen;
  window._waSlashMover = delta => {
    if (!isOpen() || !options.length) return;
    selected = (selected + delta + options.length) % options.length;
    highlight(); menu.querySelector('#bcFinOption-' + selected)?.scrollIntoView({ block: 'nearest' });
  };
  window._waSlashElegirResaltado = () => choose(selected);

  document.addEventListener('pointerdown', e => { if (isOpen() && e.target !== anchor && !menu.contains(e.target)) close(); }, true);
  document.addEventListener('focusin', e => { if (isOpen() && e.target !== anchor && !menu.contains(e.target)) close(); }, true);
  document.addEventListener('input', e => { if (e.target.id === 'waTexto') resizeComposer(e.target); }, true);
  document.addEventListener('keydown', e => {
    if (e.target.id !== 'waTexto' || !e.target.classList.contains('bc-fin-composer') || e.key !== 'Enter') return;
    if (e.isComposing || e.shiftKey) { e.stopImmediatePropagation(); if (e.shiftKey) close(); }
    else e.preventDefault();
  }, true);
  const updateSendButton = window._waActualizarBotonEnvio;
  if (typeof updateSendButton === 'function') window._waActualizarBotonEnvio = function(...args) {
    const result = updateSendButton.apply(this, args);
    resizeComposer(document.getElementById('waTexto'));
    return result;
  };
  window.addEventListener('resize', position);
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
})();
