/* bc-wa-meta.js — 21-oct-2026 (prueba de WhatsApp en el CRM sin Zernio).
   Si un chat es de una línea conectada DIRECTO a Meta (whatsapp_lineas con whatsapp_phone_number_id y sin
   zernio_account_id), lo que la bandeja manda a «whatsapp-enviar» se manda a «whatsapp-meta-enviar».
   Los chats de Zernio no cambian. Sin líneas de Meta esta capa no hace nada.
   Apagar: localStorage.bc_wa_meta_off = '1'. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_wa_meta_off') === '1') return; } catch (e) {}
  var lineasMeta = null, lineaDeHilo = {};
  var fetchOrig = window.fetch.bind(window);

  function sb() { try { return typeof supabaseClient !== 'undefined' ? supabaseClient : null; } catch (e) { return null; } }
  async function cargarLineas() {
    if (lineasMeta) return lineasMeta;
    var c = sb(); if (!c) return new Set();
    try {
      var r = await c.from('whatsapp_lineas').select('id').eq('activo', true).not('whatsapp_phone_number_id', 'is', null).is('zernio_account_id', null);
      lineasMeta = new Set((r.data || []).map(function (x) { return x.id; }));
    } catch (e) { return new Set(); }
    return lineasMeta;
  }
  async function esDeMeta(hiloId) {
    var set = await cargarLineas(); if (!set.size || !hiloId) return false;
    if (!(hiloId in lineaDeHilo)) {
      try { var r = await sb().from('whatsapp_hilos').select('linea_id').eq('id', hiloId).maybeSingle(); var d = Array.isArray(r.data) ? r.data[0] : r.data; lineaDeHilo[hiloId] = d ? d.linea_id : null; }
      catch (e) { return false; }
    }
    return set.has(lineaDeHilo[hiloId]);
  }

  window.fetch = async function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (/\/functions\/v1\/whatsapp-enviar(\?|$)/.test(url) && init && typeof init.body === 'string') {
        var hilo = (JSON.parse(init.body) || {}).hilo_id;
        if (await esDeMeta(hilo)) return fetchOrig(url.replace('/whatsapp-enviar', '/whatsapp-meta-enviar'), init);
      }
    } catch (e) {}
    return fetchOrig(input, init);
  };
  window.bcWaMeta = { recargar: function () { lineasMeta = null; lineaDeHilo = {}; return cargarLineas(); } };
})();
