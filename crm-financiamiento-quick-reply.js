/* BAYOL CELL: /financiamiento. Draft only; reuse existing send and GPS actions. */
(() => {
  'use strict';
  if (window.__bcFinanciamientoQuickReply) return;
  const loadBranches = window._waSlashCargarSucursales;
  const chooseBranch = window._waSlashElegir;
  if (typeof loadBranches !== 'function' || typeof chooseBranch !== 'function') {
    console.warn('[CRM] Financiamiento: el menu de WhatsApp no esta disponible.');
    return;
  }
  window.__bcFinanciamientoQuickReply = '20260923-1';

  const FORM = [
    '\ud83d\udccb *SOLICITUD DE FINANCIAMIENTO \u2013 BAYOL CELL*', '',
    'Para iniciar tu solicitud de financiamiento, por favor completa las siguientes informaciones:', '',
    '\ud83e\udeaa *N\u00famero de c\u00e9dula:*',
    '\ud83d\udc64 *Nombres y apellidos:*',
    '\ud83d\udcf1 *Tel\u00e9fono o celular:*', '',
    '\ud83d\udccd *Direcci\u00f3n actual:*',
    '\u2022 Provincia:', '\u2022 Ciudad/Municipio:', '\u2022 Sector:',
    '\u2022 Calle:', '\u2022 No. de casa:', '',
    '\ud83d\udce6 *Equipo o art\u00edculo que deseas financiar:*', '',
    'Por favor, verifica que todas las informaciones est\u00e9n correctas antes de enviarlas.'
  ].join('\n');
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const thread = () => typeof _waHiloId === 'undefined' ? null : _waHiloId;
  let menu, anchor, context, options = [], selected = 0, sequence = 0;
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
  function insertForm(input) {
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
    input.value = FORM;
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
    if (['financiamiento', 'financiar', 'solicitud', 'formulario', 'credito'].some(w => w.startsWith(query))) {
      options.push({ type: 'form', name: 'Financiamiento', hint: '/financiamiento - Insertar formulario' });
    }
    branches.filter(b => normalize(b.nombre).includes(query)).forEach(b => options.push({ type: 'branch', id: b.id, name: String(b.nombre), hint: 'Enviar ubicacion de la sucursal' }));
    const retained = previous ? options.findIndex(o => o.type === previous.type && o.id === previous.id) : -1;
    selected = retained >= 0 ? retained : (options.length ? 0 : -1);
    menu.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'bc-fin-heading';
    heading.textContent = 'Respuestas rapidas y ubicaciones';
    menu.appendChild(heading);
    options.forEach((option, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.tabIndex = -1; button.id = 'bcFinOption-' + i;
      button.dataset.finIndex = String(i); button.setAttribute('role', 'option');
      const icon = document.createElement('i');
      icon.className = 'ti ' + (option.type === 'form' ? 'ti-file-dollar' : 'ti-map-pin');
      icon.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span'); text.textContent = option.name;
      const hint = document.createElement('small'); hint.className = 'bc-fin-hint'; hint.textContent = option.hint;
      text.appendChild(hint); button.append(icon, text);
      button.addEventListener('click', () => choose(i));
      menu.appendChild(button);
    });
    if (!options.length) {
      const empty = document.createElement('div'); empty.className = 'bc-fin-heading';
      empty.textContent = loading ? 'Cargando ubicaciones...' : 'Ninguna opcion coincide.';
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
      await pendingBranches;
    } catch (error) { console.warn('[CRM] No se pudieron cargar las ubicaciones del menu.'); }
    if (isCurrent(input, value, token)) paint(input, false);
  }
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
