/* CRM: messages render before optional media and AI suggestions. */
(() => {
  'use strict';
  if(window.__bcMessageLoading) return;
  window.__bcMessageLoading=true;
  async function bounded(task,ms=15000){
    let timer;
    try{return await Promise.race([task,new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('La conexión tardó demasiado. Vuelve a abrir la conversación.')),ms);
    })]);}finally{clearTimeout(timer);}
  }

  // cargarMensajesHilo lo define crm-whatsapp-pagination.js (últimos 80 + carga de viejos al subir,
  // adjuntos en segundo plano). Antes este archivo lo reemplazaba y cargaba TODO el historial de golpe.
  window.abrirHiloWhatsapp=async function(id){
    _waCancelarGrabacionSiActiva();_crmListaAnimarProxima=false;
    _waForzarScrollFondo=_waHiloId!==id;
    if(_waHiloId!==id){_waMensajes=[];_waSugerenciasIA=[];}
    _waHiloId=id;
    _pintarWhatsapp();
    const h=_waHilos.find(x=>x.id===id);
    // Read acknowledgement must not block reading the messages.
    if(h?.no_leidos_count){
      bounded(supabaseClient.from('whatsapp_hilos').update({no_leidos_count:0}).eq('id',id))
        .then(({error})=>{if(!error){h.no_leidos_count=0;if(_waHiloId===id)_pintarWhatsappLista();}})
        .catch(e=>logError('marcar leido',e));
    }
    await cargarMensajesHilo(id);
    if(_waHiloId===id)_pintarWhatsapp();
  };

  const originalRender=window.renderWhatsapp;
  window.renderWhatsapp=async function(){
    // Paint the inbox immediately; data refresh cannot leave a blank screen.
    _pintarWhatsapp();
    try{await bounded(originalRender(),20000);}
    catch(e){toastError(e.message||'No se pudo actualizar WhatsApp.');}
  };
})();
