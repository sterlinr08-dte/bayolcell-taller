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

  function hydrate(list,sign,current,paint){
    const queue=list.filter(m=>m.media_path);
    let timer;
    const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(current())paint();},80);};
    async function worker(){
      while(queue.length && current()){
        const m=queue.shift();
        try{m._mediaUrl=await bounded(sign(m.media_path),8000);}catch{m._mediaUrl=null;}
        if(current())refresh();
      }
    }
    Promise.all(Array.from({length:4},worker)).catch(()=>{});
  }

  window.cargarMensajesHilo=async function(hiloId){
    const token=++_waCargaToken;
    const current=()=>token===_waCargaToken && _waHiloId===hiloId;
    try{
      const {data,error}=await bounded(supabaseClient.from('whatsapp_mensajes').select('*').eq('hilo_id',hiloId).order('creado_en',{ascending:true}));
      if(token!==_waCargaToken)return;
      if(error)throw error;
      const list=data||[];
      for(const [tempId,opt] of _waMensajesOptimistas){
        if(opt.hilo_id!==hiloId)continue;
        if(opt.wa_message_id && list.some(m=>m.wa_message_id===opt.wa_message_id))_waMensajesOptimistas.delete(tempId);
        else list.push(opt);
      }
      list.sort((a,b)=>new Date(a.creado_en)-new Date(b.creado_en));
      _waMensajes=list;
      _waSugerenciasIA=[];
      hydrate(list,_waSignedUrl,current,_pintarWhatsappDetalle);
      // Suggestions are optional: never delay the conversation for them.
      bounded(supabaseClient.from('whatsapp_ia_sugerencias').select('id, texto_sugerido, razon, creado_en').eq('hilo_id',hiloId).eq('estado','pendiente').order('creado_en',{ascending:true}))
        .then(({data,error})=>{if(current() && !error){_waSugerenciasIA=data||[];_pintarWhatsappDetalle();}}).catch(()=>{});
    }catch(e){
      if(token!==_waCargaToken)return;
      _waMensajes=[];_waSugerenciasIA=[];
      logError('cargarMensajesHilo',e);toastError(e.message||'No se pudieron cargar los mensajes.');
    }
  };

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
