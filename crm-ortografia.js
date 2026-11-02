/* crm-ortografia.js — marca «✓ corregido» en los mensajes que el servidor corrigió (2-nov-2026).
   Plan: docs/bitacora/2026-11-01-2345-claude-plan-correccion-ortografica-v2.md
   - Solo pinta: no envía nada ni decide nada. La corrección la hace el servidor.
   - La marca sale únicamente si el mensaje trae { ortografia: { original } } y no está fallido.
   - Al tocarla se ve lo que el empleado escribió, como TEXTO (textContent), nunca como HTML.
   - Apagar en un equipo: localStorage.bc_orto_marca_off = '1'. */
(function () {
  'use strict';
  var apagado = false;
  try { apagado = localStorage.getItem('bc_orto_marca_off') === '1'; } catch (e) {}

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** HTML de la marca, o '' si no corresponde. */
  window.bcOrtoMarca = function (original, estado) {
    if (apagado || typeof original !== 'string' || !original.trim()) return '';
    if (estado === 'fallido' || estado === 'eliminado') return '';
    return '<button type="button" class="bc-orto" data-orto="' + esc(original) + '"' +
      ' onclick="event.stopPropagation();bcOrtoVer(this)" aria-expanded="false"' +
      ' aria-label="Corregido. Ver lo que escribió">✓ corregido</button>';
  };

  /** Abre o cierra el texto original debajo de la burbuja. */
  window.bcOrtoVer = function (btn) {
    var burbuja = btn.closest('.wa-bubble-wrap, .bc-ig-msg, .bc-fb-bubble') || btn.parentNode;
    var previo = burbuja.querySelector(':scope > .bc-orto-pop');
    if (previo) { previo.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
    var pop = document.createElement('div');
    pop.className = 'bc-orto-pop';
    var et = document.createElement('div');
    et.className = 'bc-orto-et';
    et.textContent = 'Usted escribió';
    var tx = document.createElement('div');
    tx.className = 'bc-orto-tx';
    tx.textContent = btn.getAttribute('data-orto') || '';
    pop.appendChild(et);
    pop.appendChild(tx);
    burbuja.appendChild(pop);
    btn.setAttribute('aria-expanded', 'true');
  };

  if (apagado) return;
  var css = document.createElement('style');
  css.id = 'bcOrtoCss';
  css.textContent =
    /* Se ve pequeña, pero el área que se toca mide 44 px de alto. */
    '.bc-orto{all:unset;box-sizing:content-box;display:inline-block;position:relative;cursor:pointer;' +
      'font:600 10px/1 system-ui,-apple-system,sans-serif;color:#15803d;padding:3px 6px;margin:0 4px;border-radius:999px;' +
      'background:rgba(22,163,74,.10);-webkit-tap-highlight-color:transparent;vertical-align:middle;}' +
    '.bc-orto::after{content:"";position:absolute;left:-6px;right:-6px;top:50%;height:44px;transform:translateY(-50%);}' +
    '.bc-orto:focus-visible{outline:2px solid #16a34a;outline-offset:2px;}' +
    '.bc-orto:active{transform:scale(.96);}' +
    '.bc-orto-pop{margin-top:6px;padding:7px 9px;border-radius:8px;background:rgba(0,0,0,.05);text-align:left;' +
      'font-size:12.5px;line-height:1.35;color:inherit;white-space:pre-wrap;word-break:break-word;}' +
    '.bc-orto-et{font-size:10.5px;font-weight:600;opacity:.65;margin-bottom:2px;}' +
    '@media (prefers-color-scheme:dark){.bc-orto{color:#4ade80;background:rgba(74,222,128,.14);}.bc-orto-pop{background:rgba(255,255,255,.08);}}';
  (document.head || document.documentElement).appendChild(css);
})();
