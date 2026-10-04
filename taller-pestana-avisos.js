/* =====================================================================
   BAYOL CELL — Aviso en la pestaña del navegador (2 oct 2026)
   Como WhatsApp Web: el título de la pestaña lleva "(N)" con las
   conversaciones sin leer y el ícono muestra un punto rojo con el número.
   Si entra un mensaje nuevo mientras estás en otra pestaña o programa,
   el título PARPADEA hasta que vuelves.
   - Cuenta WhatsApp + Instagram + Facebook (whatsapp_hilos, instagram_hilos,
     social_hilos con no_leidos_count > 0, sin archivados).
   - Respeta la visibilidad del CRM: el admin cuenta todo; un empleado solo
     lo asignado a él + lo que no tiene dueño (y su sucursal si tiene una).
   - Solo lectura: no marca nada como leído ni cambia datos.
   - Capa aislada: se quita borrando este archivo y su línea en
     crm-marketing-consent.js.
   ===================================================================== */
(function(){
  'use strict';
  if (window.__bcAvisoPestana) return;
  window.__bcAvisoPestana = true;

  var BASE = document.title || 'SISTEMA TALLER BAYOL CELL';
  var total = 0, anterior = null, parpadeo = null, alterna = false, ultimoIcono = '';
  var TABLAS = ['whatsapp_hilos', 'instagram_hilos', 'social_hilos'];

  function usuario(){ try { return (typeof sessionUser !== 'undefined' && sessionUser) ? sessionUser : null; } catch(e){ return null; } }
  function esAdmin(){ try { return typeof isAdminUser === 'function' && isAdminUser(); } catch(e){ return false; } }
  function puedeVerCrm(){
    if (!usuario()) return false;
    if (esAdmin()) return true;
    try { return typeof tienePermiso === 'function' && (tienePermiso('whatsapp_ver') || tienePermiso('leads_ver')); } catch(e){ return false; }
  }
  function cliente(){ try { return (typeof supabaseClient !== 'undefined') ? supabaseClient : null; } catch(e){ return null; } }

  // ---------- Ícono de la pestaña (logo + punto rojo con número) ----------
  function linkIcono(){
    var l = document.getElementById('bcFavicon');
    if (!l){ l = document.createElement('link'); l.id = 'bcFavicon'; l.rel = 'icon'; l.type = 'image/png'; document.head.appendChild(l); }
    return l;
  }
  // Ícono del taller (azul noche + «B» naranja + llave, 4 oct 2026): assets/taller/taller-icon-64.png.
  // Encima se pinta el punto rojo con el número de chats sin leer.
  var imgBase = null, imgLista = false;
  function cargarBase(){
    if (imgBase) return;
    imgBase = new Image();
    imgBase.onload = function(){ imgLista = true; var n = ultimoIcono; ultimoIcono = null; dibujarIcono(+n || 0); };
    imgBase.src = 'assets/taller/taller-icon-64.png?v=20261004';
  }
  function dibujarIcono(n){
    cargarBase();
    var clave = String(n);
    if (clave === ultimoIcono) return;
    ultimoIcono = clave;
    if (!imgLista) return; // se pinta al terminar de cargar la imagen
    try {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      g.drawImage(imgBase, 0, 0, 64, 64);
      if (n > 0){
        var txt = n > 99 ? '99+' : String(n), r = txt.length > 2 ? 22 : 19;
        g.beginPath(); g.arc(64 - r + 1, r - 1, r, 0, Math.PI * 2);
        g.fillStyle = '#e11d2e'; g.fill();
        g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
        g.fillStyle = '#fff'; g.font = 'bold ' + (txt.length > 2 ? 18 : 24) + 'px system-ui, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64 - r + 1, r);
      }
      linkIcono().href = c.toDataURL('image/png');
    } catch(e){}
  }

  // ---------- Título ----------
  function tituloNormal(){ return total > 0 ? '(' + total + ') ' + BASE : BASE; }
  function tituloAviso(){ return total === 1 ? '● 1 mensaje nuevo' : '● ' + total + ' mensajes nuevos'; }
  function pintar(){
    if (!parpadeo) document.title = tituloNormal();
    dibujarIcono(total);
  }
  function enOtraParte(){ return document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus()); }
  function iniciarParpadeo(){
    if (parpadeo) return;
    alterna = false;
    parpadeo = setInterval(function(){
      if (!enOtraParte() || total === 0){ detenerParpadeo(); return; }
      alterna = !alterna;
      document.title = alterna ? tituloAviso() : tituloNormal();
    }, 1000);
    document.title = tituloAviso(); alterna = true;
  }
  function detenerParpadeo(){
    if (parpadeo){ clearInterval(parpadeo); parpadeo = null; }
    document.title = tituloNormal();
  }

  function actualizar(n){
    n = Math.max(0, n | 0);
    var subio = anterior !== null && n > anterior;
    total = n; anterior = n;
    if (subio && enOtraParte()) iniciarParpadeo();
    if (total === 0) detenerParpadeo();
    pintar();
  }

  // ---------- Contar conversaciones sin leer ----------
  var contando = false;
  async function contar(){
    if (contando || !puedeVerCrm()) return;
    var sb = cliente(); if (!sb) return;
    contando = true;
    try {
      var u = usuario(), admin = esAdmin(), n = 0, algunaOk = false;
      for (var i = 0; i < TABLAS.length; i++){
        try {
          var campos = 'id,asignado_id,asignado_tipo,sucursal_id,estado' + (TABLAS[i] === 'whatsapp_hilos' ? ',silenciado' : '');
          var r = await sb.from(TABLAS[i]).select(campos).gt('no_leidos_count', 0).limit(2000);
          if (r.error && campos.indexOf('silenciado') > 0) r = await sb.from(TABLAS[i]).select('id,asignado_id,asignado_tipo,sucursal_id,estado').gt('no_leidos_count', 0).limit(2000);
          if (r.error || !r.data) continue;
          algunaOk = true;
          r.data.forEach(function(h){
            if (h.estado === 'archivado' || h.silenciado) return;
            if (!admin){
              if (u.sucursal_id && h.sucursal_id && String(h.sucursal_id) !== String(u.sucursal_id)) return;
              if (h.asignado_id && !(String(h.asignado_id) === String(u.id) && (!h.asignado_tipo || h.asignado_tipo === u._tipo))) return;
            }
            n++;
          });
        } catch(e){}
      }
      if (algunaOk) actualizar(n);
    } finally { contando = false; }
  }

  // Volver a la pestaña: deja de parpadear y recuenta
  function alVolver(){ if (!enOtraParte()){ detenerParpadeo(); contar(); } }
  document.addEventListener('visibilitychange', alVolver);
  window.addEventListener('focus', alVolver);
  // Tocar algo en el CRM (abrir un chat lo marca leído): recontar al poco rato
  var tCrm = null;
  document.addEventListener('click', function(e){
    if (!e.target || !e.target.closest || !e.target.closest('#v-crmLinea')) return;
    clearTimeout(tCrm); tCrm = setTimeout(contar, 1500);
  }, true);

  function arrancar(){
    if (!usuario()){ setTimeout(arrancar, 2000); return; }
    BASE = (document.title || BASE).replace(/^\(\d+\+?\)\s*/, '');
    pintar();
    contar();
    setInterval(contar, 20000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

  window.BayolAvisoPestana = { contar: contar, actualizar: actualizar, estado: function(){ return { total: total, parpadeando: !!parpadeo, titulo: document.title }; } };
})();
