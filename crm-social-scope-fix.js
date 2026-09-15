/* BAYOL CELL — Redes: navegación inteligente de 2 barras */
(() => {
  'use strict';
  if (window.__bcSocialScopeFix) return;
  window.__bcSocialScopeFix = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  // Supabase and Zernio calls must never leave the inbox on an endless
  // spinner.  A timeout only changes the UI state; it does not expose any
  // credential or cancel a server-side import that may still be running.
  const withTimeout = (promise, ms=12000) => {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('La solicitud tardó demasiado')), ms);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
  };
  const state = {
    visible: false,
    channel: 'instagram',
    view: 'all',
    unreadOnly: false,
    refreshTimer: null,
    originalCrmLineaTab: null,
    meta: {
      whatsapp: { count: null, account: 'Mensajes', ready: true },
      instagram: { count: null, account: '', ready: true },
      facebook: { count: null, account: 'Pendiente', ready: false },
      tiktok: { count: null, account: 'Pendiente', ready: false }
    }
  };

  const CHANNELS = {
    whatsapp: { label:'WhatsApp', icon:'ti-brand-whatsapp' },
    instagram: { label:'Instagram', icon:'ti-brand-instagram' },
    facebook: { label:'Facebook', icon:'ti-brand-facebook' },
    tiktok: { label:'TikTok', icon:'ti-brand-tiktok' }
  };

  // Comentarios de Facebook e Instagram (Zernio) — reemplaza el placeholder
  // "Integración backend pendiente" por la funcionalidad real: publicaciones,
  // comentarios con respuestas anidadas, Responder público, Private Reply y
  // Lead. Un mismo panel/estado sirve a los dos canales (mismo endpoint de
  // Zernio, solo cambia la cuenta consultada) -- ver fbc.platform.
  const fbc = {
    platform: null, // 'facebook' | 'instagram' -- del último canal renderizado
    postId: null, posts: [], postsLoading: false, postsError: null, postsCursor: null, postsHasMore: false,
    comments: [], commentsLoading: false, commentsError: null, commentsCursor: null, commentsHasMore: false,
    openBox: null, // {commentId, mode:'reply'|'private'}
    likeBusy: new Set()
  };

  function fbcResetState(){
    fbc.postId = null; fbc.posts = []; fbc.postsLoading = false; fbc.postsError = null;
    fbc.postsCursor = null; fbc.postsHasMore = false;
    fbc.comments = []; fbc.commentsLoading = false; fbc.commentsError = null;
    fbc.commentsCursor = null; fbc.commentsHasMore = false;
    fbc.openBox = null; fbc.likeBusy = new Set();
  }

  // Códigos técnicos que devuelve social-facebook-comentarios (o Supabase al
  // fallar la llamada) -> mensaje en español entendible para el equipo.
  const FBC_ERRORES = {
    account_not_configured: 'No hay una cuenta conectada todavía.',
    postId_required: 'Falta elegir una publicación.',
    postId_message_required: 'Escribe un mensaje antes de enviar.',
    postId_commentId_message_required: 'Escribe un mensaje antes de enviar.',
    zernio_error: '{red} no respondió. Intenta de nuevo en un momento.',
    zernio_reply_failed: 'No se pudo publicar la respuesta. Puede que el comentario ya no exista.',
    zernio_private_reply_failed: 'No se pudo enviar el Private Reply. Puede que ya se haya usado el único envío de este comentario, o que tenga más de 7 días.',
    postId_commentId_required: 'Falta elegir el comentario.',
    zernio_like_failed: 'No se pudo dar like al comentario.',
    zernio_unlike_failed: 'No se pudo quitar el like.',
    unknown_action: 'Acción no reconocida.',
    upstream_failed: '{red} no respondió. Intenta de nuevo en un momento.',
    missing_auth: 'Tu sesión venció. Vuelve a entrar.',
    zernio_key_not_configured: 'Falta configurar la conexión con {red} (avisa a soporte).',
    method_not_allowed: 'No se pudo completar la acción.',
    invalid_json: 'No se pudo completar la acción.'
  };
  function fbcFriendly(msg){
    const texto = FBC_ERRORES[msg] || msg || 'No se pudo completar la acción.';
    return texto.includes('{red}') ? texto.replace('{red}', fbcRedLabel()) : texto;
  }

  // Nombre de la red para mensajes genéricos (el panel de Comentarios sirve
  // a Facebook e Instagram con el mismo código -- ver fbc.platform).
  function fbcRedLabel(){
    return (fbc.platform || state.channel) === 'instagram' ? 'Instagram' : 'Facebook';
  }

  async function fbcInvoke(action, extra){
    const client = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
    if (!client?.functions?.invoke) throw new Error('Sin conexión a Supabase.');
    const { data, error } = await withTimeout(client.functions.invoke('social-facebook-comentarios', { body: { action, platform: state.channel, ...extra } }), 18000);
    if (error) throw new Error(fbcFriendly(error?.message));
    if (data?.ok !== true) throw new Error(fbcFriendly(data?.error));
    return data;
  }

  function fbcToast(msg, isError){
    if (typeof window.toastError === 'function' && isError) return window.toastError(msg);
    if (typeof window.toast === 'function') return window.toast(msg);
    alert(msg);
  }

  function fbcFecha(iso){
    try { return new Date(iso).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return ''; }
  }

  function ensureTikTokPanel(){
    const view=$('#v-crmLinea');
    if(!view || $('#bcSocialTikTokPanel')) return;
    const panel=document.createElement('section');
    panel.id='bcSocialTikTokPanel';
    panel.innerHTML=`
      <div class="bc-tt-placeholder">
        <div class="bc-tt-box">
          <div class="bc-tt-icon"><i class="ti ti-brand-tiktok"></i></div>
          <h3>TikTok preparado para integración</h3>
          <p>La interfaz ya reserva TikTok dentro de Redes. Las acciones de comentarios e inbox se habilitarán únicamente cuando exista una integración oficial y autorizada para BAYOL CELL.</p>
          <span class="bc-tt-state"><i class="ti ti-clock"></i> Integración backend pendiente</span>
        </div>
      </div>`;
    view.appendChild(panel);
  }

  function ensureFacebookPanel(){
    const panel=$('#bcSocialFacebookPanel');
    if(!panel || panel.dataset.fbReady==='1') return;
    panel.innerHTML=`<div class="bc-social-generic-shell" data-social-generic="facebook">
      <aside class="bc-social-generic-list">
        <div class="bc-social-generic-head"><div class="bc-social-generic-account"><span class="bc-social-generic-logo fb"><i class="ti ti-brand-facebook"></i></span><span><b>Facebook Messenger</b><small id="bcFbAccountSub">Conectando cuenta…</small></span><em id="bcFbStatus">Conectando</em></div><label class="bc-social-generic-search"><i class="ti ti-search"></i><input id="bcFbSearch" type="search" placeholder="Buscar conversación…"></label></div>
        <div class="bc-social-generic-threads" id="bcFbThreads"><div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando conversaciones…</div></div>
      </aside>
      <section class="bc-social-generic-chat" id="bcFbChat"><div class="bc-ig-empty"><div><i class="ti ti-brand-facebook"></i><b>Selecciona una conversación</b><span>Los mensajes de Messenger aparecerán aquí.</span></div></div></section>
    </div>`;
    panel.dataset.fbReady='1';
    panel.addEventListener('click',e=>{ const row=e.target.closest('[data-fb-thread]'); if(row) openFacebookThread(row.dataset.fbThread); });
    $('#bcFbSearch')?.addEventListener('input',e=>{ const q=String(e.target.value||'').toLowerCase(); $$('#bcFbThreads [data-fb-thread]').forEach(r=>{r.hidden=q && !r.textContent.toLowerCase().includes(q);}); });
  }

  async function loadFacebookThreads(){
    const client=typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient;
    const host=$('#bcFbThreads');
    if(!client?.from || !host) return;
    if(host.dataset.fbLoading==='1'){host.dataset.fbReload='1';return;}
    host.dataset.fbLoading='1';
    try{
      host.innerHTML='<div class="bc-social-loading"><span class="bc-social-spin"></span>Comprobando Facebook…</div>';
      const actor=typeof sessionUser!=='undefined'?sessionUser:window.sessionUser;
      const sucursalId=actor?.sucursal_id||actor?.sucursalId;
      let accountQuery=client.from('social_cuentas').select('id,username,display_name,estado').eq('plataforma','facebook').eq('activo',true);
      if(sucursalId) accountQuery=accountQuery.eq('sucursal_id',sucursalId);
      const {data:account,error:accountError}=await withTimeout(accountQuery.order('actualizado_en',{ascending:false}).limit(1).maybeSingle(),12000);
      if(accountError) throw accountError;
      if(!account){
        state.meta.facebook.ready=false;
        state.meta.facebook.account='Sin cuenta';
        syncHeaderState();
        host.innerHTML='<div class="bc-social-empty-state"><i class="ti ti-brand-facebook"></i><b>Facebook no está vinculado</b><span>Conecta la página BayolCell en Zernio.</span></div>';
        return;
      }
      const sub=$('#bcFbAccountSub'); if(sub) sub.textContent=account.display_name||account.username||'BayolCell';
      const status=$('#bcFbStatus'); if(status){status.textContent='Conectado';status.className='on';}
      state.meta.facebook.ready=true;
      state.meta.facebook.account=account.display_name||account.username||'BayolCell';
      syncHeaderState();
      const {data:threadsRaw,error}=await withTimeout(client.from('social_hilos').select('id,participant_name,participant_username,ultimo_mensaje_preview,ultimo_mensaje_at,no_leidos_count,estado,asignado_id,asignado_tipo').eq('cuenta_id',account.id).order('actualizado_en',{ascending:false}).limit(100),12000);
      if(error) throw error;
      let threads=threadsRaw||[];
      // Mismo candado que WhatsApp/Instagram (ver CLAUDE.md): un empleado
      // no-admin solo ve lo asignado a el o sin dueño todavia.
      try {
        if (typeof window.isAdminUser==='function' && !window.isAdminUser()
            && typeof window._crmMiIdentidad==='function' && typeof window._crmMismoAsignado==='function') {
          const yo=window._crmMiIdentidad();
          threads=threads.filter(t=>!t.asignado_id||window._crmMismoAsignado(t,yo));
        }
      } catch(e){ console.error('CRM Social Facebook: filtro de asignacion fallo', e); }
      setupFacebookRealtime();
      if(!threads?.length){host.innerHTML='<div class="bc-social-empty-state"><i class="ti ti-message-circle"></i><b>Sin conversaciones todavía</b><span>La importación inicial de Zernio puede tardar unos segundos.</span></div>';return;}
      host.innerHTML=threads.map(t=>{const name=t.participant_name||t.participant_username||'Contacto de Facebook';const initials=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();return `<button type="button" class="bc-social-generic-thread${t.no_leidos_count?' unread':''}" data-fb-thread="${t.id}"><span class="bc-social-generic-avatar">${escapeHtml(initials)}</span><span class="bc-social-generic-thread-copy"><b>${escapeHtml(name)}</b><small>${escapeHtml(t.ultimo_mensaje_preview||'Sin mensajes')}</small></span>${t.no_leidos_count?`<em>${t.no_leidos_count}</em>`:''}</button>`;}).join('');
    }catch(e){
      state.meta.facebook.ready=false;
      syncHeaderState();
      host.innerHTML='<div class="bc-social-error"><i class="ti ti-alert-triangle"></i><b>No se pudo cargar Facebook</b><span>La conexión tardó demasiado o la sesión no tiene acceso a esta sucursal.</span><button type="button" id="bcFbRetry">Reintentar</button></div>';
      $('#bcFbRetry')?.addEventListener('click',()=>{ accountSyncStarted=false; loadFacebookThreads(); syncConnectedAccounts(); });
    }finally{
      host.dataset.fbLoading='0';
      if(host.dataset.fbReload==='1'){
        delete host.dataset.fbReload;
        if(state.visible && state.channel==='facebook') loadFacebookThreads();
      }
    }
  }

  // 15 sept 2026: Facebook nunca tuvo suscripción en tiempo real (a
  // diferencia de Instagram, que sí -- ver setupRealtime() en
  // crm-social-hub.js). Junto con eso, social_hilos/social_mensajes
  // tampoco estaban agregadas a la publicación supabase_realtime de
  // Supabase (mismo problema que ya se había resuelto antes para
  // whatsapp_hilos/whatsapp_mensajes/leads) -- sin ESA migración, esta
  // suscripción tampoco recibiría nada aunque el código esté bien.
  let facebookRealtimeChannel=null;
  let facebookRealtimeTimer=null;
  function setupFacebookRealtime(){
    const client=typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient;
    if(facebookRealtimeChannel || !client?.channel) return;
    try{
      facebookRealtimeChannel=client.channel('bc-social-facebook')
        .on('postgres_changes',{event:'*',schema:'public',table:'social_hilos'},()=>scheduleFacebookRealtime())
        .on('postgres_changes',{event:'*',schema:'public',table:'social_mensajes'},payload=>{
          if(facebookSelectedThread && (payload.new?.hilo_id===facebookSelectedThread || payload.old?.hilo_id===facebookSelectedThread)) scheduleFacebookRealtime(true);
          else scheduleFacebookRealtime(false);
        }).subscribe();
    }catch(e){console.warn('Realtime Facebook no disponible',e);}
  }
  function scheduleFacebookRealtime(openChat){
    clearTimeout(facebookRealtimeTimer);
    facebookRealtimeTimer=setTimeout(async()=>{
      if(!(state.visible && state.channel==='facebook')) return;
      await loadFacebookThreads();
      if(openChat && facebookSelectedThread) await openFacebookThread(facebookSelectedThread);
    },180);
  }

  let facebookMessageGeneration=0;
  let facebookSelectedThread=null;
  async function openFacebookThread(id){
    const client=typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient; const chat=$('#bcFbChat'); if(!client?.from||!chat)return;
    const generation=++facebookMessageGeneration;
    facebookSelectedThread=id;
    const current=()=>generation===facebookMessageGeneration && facebookSelectedThread===id && state.visible && state.channel==='facebook';
    // 15 sept 2026: .bc-fb-open se activa YA (antes de esperar la respuesta
    // de Supabase) -- en celular #bcSocialFacebookPanel .bc-social-generic-chat
    // es display:none sin esta clase, así que sin esto ni el spinner de
    // carga se llegaba a ver (el chat entero queda invisible hasta que
    // render() la agrega más abajo, y si algo falla antes de eso -- ver los
    // catch/fallback de esta función -- nunca se agregaba).
    $('#bcSocialFacebookPanel')?.classList.add('bc-fb-open');
    chat.innerHTML='<div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando mensajes…</div>';
    try{
    const {data:thread,error:threadError}=await withTimeout(client.from('social_hilos').select('id,participant_name,participant_username,asignado_id,asignado_tipo').eq('id',id).maybeSingle(),12000);
    if(!current())return;
    if(threadError)throw threadError;
    if(!thread)throw new Error('Conversación no disponible.');
    const {data:rows,error:messagesError}=await withTimeout(client.from('social_mensajes').select('id,direccion,cuerpo,tipo_contenido,media_url,estado,creado_en,metadata').eq('hilo_id',id).order('creado_en',{ascending:false}).order('id',{ascending:false}).limit(500),12000);
    if(!current())return;
    if(messagesError)throw messagesError;
    const messages=(rows||[]).filter(m=>!m.metadata?.upload_only).reverse();
    if(window.BayolFacebookChat){
      window.BayolFacebookChat.render(thread,messages,{reload:()=>{if(current())return openFacebookThread(id);},refreshList:loadFacebookThreads});
      return;
    }
    // 15 sept 2026: si crm-facebook-chat.js no llegó a cargar (falla de red,
    // ver el .onerror del loader en crm-marketing-consent.js que sigue de
    // largo sin avisar), este fallback es lo único que pinta el chat. A
    // diferencia de render(), nunca traía un botón para volver a la lista
    // en celular -- se agrega aquí (.bc-fb-open ya se activó arriba).
    const name=thread.participant_name||thread.participant_username||'Contacto de Facebook';
    chat.innerHTML=`<div class="bc-social-generic-chat-head"><button type="button" id="bcFbBackFallback" class="bc-fb-icon" aria-label="Volver a conversaciones"><i class="ti ti-arrow-left"></i></button><span class="bc-social-generic-avatar">${escapeHtml(name.slice(0,2).toUpperCase())}</span><div><b>${escapeHtml(name)}</b><small>${escapeHtml(thread.participant_username||'Messenger')}</small></div><span class="bc-social-generic-channel">Facebook</span></div><div class="bc-social-generic-messages" id="bcFbMessages">${(messages||[]).map(m=>`<div class="bc-social-generic-message ${m.direccion==='out'?'out':'in'}"><div>${escapeHtml(m.cuerpo|| (m.media_url?'Adjunto':'Mensaje sin texto'))}</div><small>${new Date(m.creado_en).toLocaleString('es-DO',{dateStyle:'short',timeStyle:'short'})} · ${m.estado||''}</small></div>`).join('')||'<div class="bc-ig-empty"><div><b>Sin mensajes</b></div></div>'}</div><form class="bc-social-generic-composer" id="bcFbComposer"><textarea id="bcFbText" rows="1" placeholder="Escribe un mensaje…"></textarea><button type="submit" aria-label="Enviar"><i class="ti ti-send"></i></button></form>`;
    $('#bcFbBackFallback').onclick=()=>{
      $('#bcSocialFacebookPanel')?.classList.remove('bc-fb-open');
      facebookSelectedThread=null;
    };
    const messagesEl=$('#bcFbMessages'); if(messagesEl)messagesEl.scrollTop=messagesEl.scrollHeight;
    $('#bcFbComposer')?.addEventListener('submit',async e=>{
      e.preventDefault();const ta=$('#bcFbText'),text=String(ta?.value||'').trim();
      const btn=e.currentTarget.querySelector('button');if(!text||btn.disabled)return;
      btn.disabled=true;
      try{
        const {data,error}=await withTimeout(client.functions.invoke('social-enviar',{body:{hiloId:id,text}}),22000);
        if(error)throw error;
        if(data?.ok!==true)throw new Error('No se confirmó el envío.');
        ta.value='';
        if(current())await openFacebookThread(id);
        await loadFacebookThreads();
      }catch(err){alert('No se confirmó el envío. Revisa la conversación antes de reenviar; el mensaje podría haber salido.');}
      finally{btn.disabled=false;}
    });
    }catch(error){
      if(!current())return;
      // 15 sept 2026: .bc-fb-open ya se activó arriba (antes del fetch), así
      // que esta tarjeta de error sí se ve en celular -- pero antes de ese
      // cambio, un timeout de red al abrir un chat (de las formas más
      // comunes de caer aquí) dejaba SOLO la lista visible, sin ningún
      // aviso ni forma de volver ("una capa por encima" / todo en blanco).
      // Le falta igual un botón de volver, porque el header normal
      // (con el nombre del contacto) nunca llegó a pintarse.
      chat.innerHTML='<div class="bc-social-generic-chat-head"><button type="button" id="bcFbBackFallback" class="bc-fb-icon" aria-label="Volver a conversaciones"><i class="ti ti-arrow-left"></i></button><div><b>Facebook Messenger</b></div></div><div class="bc-social-error"><b>No se pudieron cargar los mensajes</b><span>Comprueba la conexión y vuelve a intentarlo.</span><button type="button" id="bcFbRetryMessages">Reintentar</button></div>';
      $('#bcFbBackFallback').onclick=()=>{
        $('#bcSocialFacebookPanel')?.classList.remove('bc-fb-open');
        facebookSelectedThread=null;
      };
      $('#bcFbRetryMessages')?.addEventListener('click',()=>openFacebookThread(id));
    }
  }

  // Llamado por _crmAsignarHTML (taller.html) despues de Asignarme/Reasignar
  // en un hilo de Facebook -- refresca la lista y, si el hilo asignado es el
  // que está abierto, lo vuelve a cargar para que el encabezado muestre el
  // nuevo estado ("Asignado a mí" / los botones desaparecen, etc).
  window._fbRefrescarAsignacion=function(){
    if (window.BayolSocialNetworks) window.BayolSocialNetworks.refresh();
    else loadFacebookThreads();
    if (facebookSelectedThread) openFacebookThread(facebookSelectedThread);
  };

  function ensureContextPanel(){
    const view=$('#v-crmLinea');
    if(!view || $('#bcSocialContextPanel')) return;
    const panel=document.createElement('section');
    panel.id='bcSocialContextPanel';
    panel.innerHTML='<div class="bc-social-context-card"></div>';
    view.appendChild(panel);
  }

  function ensureFbcStyles(){
    if ($('#bcFbcStyles')) return;
    const style = document.createElement('style');
    style.id = 'bcFbcStyles';
    style.textContent = `
      #bcSocialContextPanel.bc-fbc-active{display:flex;padding:0;overflow:hidden;}
      .bc-fbc-shell{display:flex;width:100%;height:100%;min-height:0;}
      .bc-fbc-posts{width:300px;min-width:230px;border-right:1px solid rgba(15,23,42,.08);display:flex;flex-direction:column;background:#fbfbfe;}
      .bc-fbc-posts-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(15,23,42,.06);font-weight:700;font-size:13px;}
      .bc-fbc-posts-head button{border:none;background:transparent;cursor:pointer;color:#475569;padding:4px;border-radius:8px;}
      .bc-fbc-posts-head button:hover{background:rgba(15,23,42,.06);}
      .bc-fbc-posts-list{flex:1;overflow-y:auto;padding:6px;}
      .bc-fbc-post{display:flex;gap:9px;width:100%;text-align:left;border:none;background:transparent;padding:8px;border-radius:12px;cursor:pointer;margin-bottom:2px;}
      .bc-fbc-post:hover{background:rgba(59,130,246,.08);}
      .bc-fbc-post.on{background:rgba(59,130,246,.14);}
      .bc-fbc-post.has-comments{border-left:3px solid #f59e0b;}
      .bc-fbc-post.has-comments.on{background:rgba(245,158,11,.14);}
      .bc-fbc-count-hot{color:#b45309;}
      .bc-fbc-post-pic{width:42px;height:42px;border-radius:9px;object-fit:cover;flex:none;background:#e2e8f0;}
      .bc-fbc-post-copy{min-width:0;}
      .bc-fbc-post-copy p{margin:0 0 3px;font-size:12.5px;line-height:1.35;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      .bc-fbc-post-copy small{color:#64748b;font-size:11px;}
      .bc-fbc-comments{flex:1;display:flex;flex-direction:column;min-width:0;}
      .bc-fbc-comments-head{padding:12px 16px;border-bottom:1px solid rgba(15,23,42,.06);display:flex;align-items:flex-start;gap:10px;}
      .bc-fbc-comments-head .bc-fbc-post-pic{width:52px;height:52px;border-radius:10px;}
      .bc-fbc-comments-head p{margin:0 0 4px;font-size:12.5px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      .bc-fbc-comments-head a{font-size:11.5px;color:#2563eb;text-decoration:none;}
      .bc-fbc-comments-body{flex:1;overflow-y:auto;padding:12px 16px;}
      .bc-fbc-comment{display:flex;gap:9px;margin-bottom:16px;}
      .bc-fbc-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:none;background:#e2e8f0;}
      .bc-fbc-body-col{flex:1;min-width:0;}
      .bc-fbc-meta{display:flex;align-items:center;gap:7px;font-size:12px;}
      .bc-fbc-meta b{color:#0f172a;}
      .bc-fbc-meta small{color:#94a3b8;}
      .bc-fbc-badge{background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;}
      .bc-fbc-comment>.bc-fbc-body-col>p{margin:2px 0 6px;font-size:13px;color:#1e293b;white-space:pre-wrap;word-break:break-word;}
      .bc-fbc-actions{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
      .bc-fbc-actions button{border:1px solid rgba(255,255,255,.88);background:linear-gradient(145deg,rgba(255,255,255,.88),rgba(255,247,243,.62));color:#14213d;font-size:11.5px;font-weight:700;padding:6px 10px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background .18s ease,border-color .18s ease,box-shadow .18s ease,transform .16s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,.98),inset 0 -2px 5px rgba(20,33,61,.05),0 6px 13px -11px rgba(20,33,61,.5);backdrop-filter:blur(10px) saturate(140%);-webkit-backdrop-filter:blur(10px) saturate(140%);}
      .bc-fbc-actions button:hover{background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,237,230,.82));border-color:#ffc2ad;box-shadow:inset 0 1px 0 #fff,0 8px 16px -12px rgba(255,107,53,.38);transform:translateY(-1px);}
      .bc-fbc-actions button:active{transform:translateY(1px);box-shadow:inset 0 2px 5px rgba(20,33,61,.14),0 3px 8px -7px rgba(20,33,61,.36);}
      .bc-fbc-actions button.like.liked{background:linear-gradient(145deg,#ff9a7a,#FF6B35 54%,#D65225);border-color:rgba(255,255,255,.86);color:#14213d;box-shadow:inset 0 1px 0 rgba(255,255,255,.54),inset 0 -3px 7px rgba(125,34,12,.18),0 8px 17px -12px rgba(255,107,53,.78);}
      .bc-fbc-actions button:disabled{opacity:.62;cursor:wait;transform:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.75);}
      .bc-fbc-replybox{margin:6px 0;display:flex;gap:6px;}
      .bc-fbc-replybox[hidden]{display:none;}
      .bc-fbc-replybox textarea{flex:1;resize:none;border:1px solid rgba(15,23,42,.15);border-radius:10px;padding:7px 9px;font-size:12.5px;font-family:inherit;min-height:34px;}
      .bc-fbc-replybox .bc-fbc-box-btns{display:flex;flex-direction:column;gap:4px;}
      .bc-fbc-replybox button{border:none;border-radius:8px;padding:6px 10px;font-size:11.5px;font-weight:700;cursor:pointer;}
      .bc-fbc-replybox .send{background:#e31e24;color:#fff;}
      .bc-fbc-replybox .cancel{background:#e2e8f0;color:#334155;}
      .bc-fbc-replybox.private textarea{border-color:#a855f7;}
      .bc-fbc-replybox.private .send{background:#7c3aed;}
      .bc-fbc-replies{margin-top:6px;padding-left:14px;border-left:2px solid rgba(15,23,42,.08);}
      .bc-fbc-reply{display:flex;gap:8px;margin-bottom:8px;}
      .bc-fbc-reply .bc-fbc-avatar{width:26px;height:26px;}
      .bc-fbc-reply p{margin:1px 0;font-size:12px;color:#334155;white-space:pre-wrap;word-break:break-word;}
      .bc-fbc-more-replies{font-size:11px;color:#94a3b8;margin-top:2px;}
      .bc-fbc-loadmore{display:block;margin:8px auto;background:transparent;border:1px solid rgba(15,23,42,.14);border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer;color:#334155;}
      .bc-fbc-loadmore:hover{background:#f1f5f9;}
      @media (max-width: 760px){
        .bc-fbc-shell{flex-direction:column;}
        .bc-fbc-posts{width:100%;max-height:38%;border-right:none;border-bottom:1px solid rgba(15,23,42,.08);}
      }
    `;
    document.head.appendChild(style);
  }

  function fbcTruncate(text, max){
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : (t || 'Publicación sin texto');
  }

  function renderFacebookCommentsPanel(){
    ensureFbcStyles();
    const panel = $('#bcSocialContextPanel');
    if (!panel) return;
    panel.classList.add('bc-fbc-active');
    // 15 sept 2026: este panel ahora sirve tanto a Facebook como a Instagram
    // (mismo endpoint de Zernio, solo cambia la cuenta consultada). Si se
    // cambió de canal desde la última vez, hay que botar el cache -- si no,
    // se ven publicaciones/comentarios de la otra red.
    if (fbc.platform && fbc.platform !== state.channel) {
      fbcResetState();
      delete panel.dataset.fbcBuilt;
    }
    fbc.platform = state.channel;
    // Si ya estaba armado (el agente solo se fue a otra sub-pestaña — p.ej.
    // Mensajes — y volvió a Comentarios), no se reconstruye de cero: se
    // pierde la publicación/comentarios que tenía abiertos si no se hace
    // este chequeo (antes recargaba las publicaciones y mostraba de nuevo
    // "Elige una publicación" cada vez).
    if (panel.dataset.fbcBuilt === '1' && $('#bcFbcPostsList', panel)) {
      fbcRenderPosts();
      if (fbc.postId) fbcRenderComments();
      return;
    }
    panel.dataset.fbcBuilt = '1';
    panel.innerHTML = `
      <div class="bc-fbc-shell">
        <aside class="bc-fbc-posts">
          <div class="bc-fbc-posts-head"><span id="bcFbcPostsHeadLabel">Publicaciones</span><button type="button" id="bcFbcRefreshPosts" title="Actualizar"><i class="ti ti-refresh"></i></button></div>
          <div class="bc-fbc-posts-list" id="bcFbcPostsList"></div>
        </aside>
        <section class="bc-fbc-comments" id="bcFbcCommentsPane">
          <div class="bc-ig-empty"><div><i class="ti ti-message-circle"></i><b>Elige una publicación</b><span>Sus comentarios aparecerán aquí.</span></div></div>
        </section>
      </div>`;
    bindFbcPanel();
    loadFbcPosts();
  }

  function fbcRenderPosts(){
    const host = $('#bcFbcPostsList');
    const label = $('#bcFbcPostsHeadLabel');
    if (!host) return;
    if (fbc.postsLoading && !fbc.posts.length) { host.innerHTML = '<div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando publicaciones…</div>'; return; }
    if (fbc.postsError && !fbc.posts.length) { host.innerHTML = `<div class="bc-social-error"><i class="ti ti-alert-triangle"></i><b>No se pudieron cargar</b><span>${escapeHtml(fbc.postsError)}</span><button type="button" id="bcFbcRetryPosts">Reintentar</button></div>`; return; }
    if (!fbc.posts.length) { host.innerHTML = '<div class="bc-social-empty-state"><i class="ti ti-photo"></i><b>Sin publicaciones</b><span>Todavía no hay contenido en la página.</span></div>'; return; }
    // La mayoría de las publicaciones recientes no tienen comentarios (son
    // promos sin respuesta). Sin esto, Sterling entraba y los primeros clics
    // caían siempre en publicaciones vacías -> parecía que no hacía nada.
    // Se muestran primero las que SÍ tienen comentarios (orden estable, el
    // resto queda por fecha como llegó de Facebook).
    const ordenados = fbc.posts.map((p, i) => ({ p, i }))
      .sort((a, b) => (Number(b.p.commentCount || 0) > 0) - (Number(a.p.commentCount || 0) > 0) || a.i - b.i)
      .map(x => x.p);
    const conComentarios = fbc.posts.filter(p => Number(p.commentCount || 0) > 0).length;
    if (label) label.textContent = conComentarios ? `Publicaciones (${conComentarios} con comentarios)` : 'Publicaciones';
    host.innerHTML = ordenados.map(p => {
      const tieneComentarios = Number(p.commentCount || 0) > 0;
      return `
      <button type="button" class="bc-fbc-post${p.id === fbc.postId ? ' on' : ''}${tieneComentarios ? ' has-comments' : ''}" data-fbc-post="${escapeHtml(p.id)}">
        ${p.picture ? `<img class="bc-fbc-post-pic" src="${escapeHtml(p.picture)}" alt="">` : '<span class="bc-fbc-post-pic"></span>'}
        <span class="bc-fbc-post-copy"><p>${escapeHtml(fbcTruncate(p.content, 90))}</p><small>${fbcFecha(p.createdTime)} · <b class="${tieneComentarios ? 'bc-fbc-count-hot' : ''}">${p.commentCount || 0} coment.</b> · ${p.likeCount || 0} likes</small></span>
      </button>`;
    }).join('') + (fbc.postsHasMore ? '<button type="button" class="bc-fbc-loadmore" id="bcFbcMorePosts">Cargar más publicaciones</button>' : '');
  }

  async function loadFbcPosts(reset){
    if (fbc.postsLoading) return;
    const esPrimeraCarga = !reset && !fbc.postId && !fbc.posts.length && !fbc.postsCursor;
    if (reset) { fbc.posts = []; fbc.postsCursor = null; }
    fbc.postsLoading = true; fbc.postsError = null;
    fbcRenderPosts();
    try {
      const data = await fbcInvoke('posts', { limit: 50, cursor: fbc.postsCursor || undefined });
      const nuevos = data.data || [];
      fbc.posts = fbc.postsCursor ? fbc.posts.concat(nuevos) : nuevos;
      fbc.postsHasMore = !!data.pagination?.hasMore;
      fbc.postsCursor = data.pagination?.nextCursor || null;
    } catch (e) {
      fbc.postsError = e?.message || `Error de conexión con ${fbcRedLabel()}.`;
    } finally {
      fbc.postsLoading = false;
      fbcRenderPosts();
    }
    // Primera vez que se abre el panel: si hay alguna publicación con
    // comentarios reales, se abre sola para que se vea de inmediato que
    // funciona (en vez de que el primer clic caiga en una vacía).
    if (esPrimeraCarga && !fbc.postId) {
      const conComentarios = fbc.posts.find(p => Number(p.commentCount || 0) > 0);
      if (conComentarios) loadFbcComments(conComentarios.id);
    }
  }

  function fbcCommentIsLiked(c){
    return typeof c?.isLiked === 'boolean' ? c.isLiked : c?.liked === true;
  }

  function fbcLikeButtonHTML(c){
    if (c.canLike === false) return '';
    const liked = fbcCommentIsLiked(c);
    const busy = fbc.likeBusy.has(String(c.id));
    const label = liked ? 'Quitar like' : 'Like';
    return `<button type="button" class="like${liked ? ' liked' : ''}" data-fbc-act="like" data-fbc-comment="${escapeHtml(c.id)}" aria-pressed="${liked ? 'true' : 'false'}" aria-label="${label}"${busy ? ' disabled aria-busy="true"' : ''}><i class="ti ${liked ? 'ti-heart-filled' : 'ti-heart'}"></i><span>${label}</span></button>`;
  }

  function fbcSyncLikeButton(btn, liked, busy){
    if (!btn) return;
    const label = liked ? 'Quitar like' : 'Like';
    btn.classList.toggle('liked', liked);
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    btn.setAttribute('aria-label', label);
    btn.innerHTML = `<i class="ti ${liked ? 'ti-heart-filled' : 'ti-heart'}"></i><span>${label}</span>`;
    btn.disabled = !!busy;
    if (busy) btn.setAttribute('aria-busy', 'true');
    else btn.removeAttribute('aria-busy');
  }

  async function fbcToggleLike(commentId, btn){
    const comment = fbc.comments.find(c => String(c.id) === String(commentId));
    const id = String(commentId || '');
    if (!comment || !id || btn?.disabled || fbc.likeBusy.has(id)) return;
    const wasLiked = fbcCommentIsLiked(comment);
    const action = wasLiked ? 'unlike' : 'like';
    fbc.likeBusy.add(id);
    fbcSyncLikeButton(btn, wasLiked, true);
    let nextLiked = wasLiked;
    let success = false;
    try {
      const data = await fbcInvoke(action, {
        postId: fbc.postId,
        commentId,
        ...(wasLiked && comment.likeUri ? { likeUri: String(comment.likeUri) } : {})
      });
      nextLiked = typeof data.liked === 'boolean' ? data.liked : !wasLiked;
      success = true;
      fbcToast(nextLiked ? 'Like agregado.' : 'Like retirado.');
    } catch (e) {
      fbcToast(e?.message || 'No se pudo actualizar el like.', true);
    } finally {
      fbc.likeBusy.delete(id);
      const liveComment = fbc.comments.find(c => String(c.id) === id);
      if (success && liveComment) {
        liveComment.isLiked = nextLiked;
        liveComment.liked = nextLiked;
      }
      const liveButton = btn?.isConnected ? btn : null;
      if (liveButton) fbcSyncLikeButton(liveButton, success ? nextLiked : wasLiked, false);
      else if (success && liveComment) fbcRenderComments();
    }
  }

  function fbcCommentActionsHTML(c){
    const leadDone = c._leadDone ? ' done' : '';
    return `<div class="bc-fbc-actions">
      ${fbcLikeButtonHTML(c)}
      <button type="button" data-fbc-act="reply" data-fbc-comment="${escapeHtml(c.id)}"><i class="ti ti-message-reply"></i> Responder público</button>
      <button type="button" data-fbc-act="private" data-fbc-comment="${escapeHtml(c.id)}"><i class="ti ti-send"></i> Private Reply</button>
      <button type="button" class="${leadDone}" data-fbc-act="lead" data-fbc-comment="${escapeHtml(c.id)}"><i class="ti ${c._leadDone ? 'ti-check' : 'ti-user-plus'}"></i> ${c._leadDone ? 'Lead creado' : 'Lead'}</button>
    </div>`;
  }

  function fbcReplyHTML(r){
    return `<div class="bc-fbc-reply">
      ${r.from?.picture ? `<img class="bc-fbc-avatar" src="${escapeHtml(r.from.picture)}" alt="">` : '<span class="bc-fbc-avatar"></span>'}
      <div><div class="bc-fbc-meta"><b>${escapeHtml(r.from?.name || 'Contacto')}</b><small>${fbcFecha(r.createdTime)}</small>${r.from?.isOwner ? '<span class="bc-fbc-badge">Tú</span>' : ''}</div>
      <p>${escapeHtml(r.message || '')}</p></div>
    </div>`;
  }

  function fbcCommentHTML(c){
    const replies = (c.replies || []).map(fbcReplyHTML).join('');
    const masReplies = c.repliesHasMore ? `<div class="bc-fbc-more-replies">Hay más respuestas de las mostradas (${fbcRedLabel()} solo entrega las primeras 10 aquí).</div>` : '';
    return `<div class="bc-fbc-comment" data-fbc-top="${escapeHtml(c.id)}">
      ${c.from?.picture ? `<img class="bc-fbc-avatar" src="${escapeHtml(c.from.picture)}" alt="">` : '<span class="bc-fbc-avatar"></span>'}
      <div class="bc-fbc-body-col">
        <div class="bc-fbc-meta"><b>${escapeHtml(c.from?.name || `Contacto de ${fbcRedLabel()}`)}</b><small>${fbcFecha(c.createdTime)}</small>${c.from?.isOwner ? '<span class="bc-fbc-badge">Tú</span>' : ''}</div>
        <p>${escapeHtml(c.message || '')}</p>
        ${c.from?.isOwner ? '' : fbcCommentActionsHTML(c)}
        <div class="bc-fbc-replybox" id="bcFbcBox-${escapeHtml(c.id)}" hidden></div>
        ${replies ? `<div class="bc-fbc-replies">${replies}${masReplies}</div>` : masReplies}
      </div>
    </div>`;
  }

  function fbcRenderComments(){
    const pane = $('#bcFbcCommentsPane');
    if (!pane) return;
    const post = fbc.posts.find(p => p.id === fbc.postId);
    const head = post ? `<div class="bc-fbc-comments-head">
        ${post.picture ? `<img class="bc-fbc-post-pic" src="${escapeHtml(post.picture)}" alt="">` : ''}
        <div><p>${escapeHtml(fbcTruncate(post.content, 160))}</p><a href="${escapeHtml(post.permalink || '#')}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Ver publicación en ${fbcRedLabel()}</a></div>
      </div>` : '';
    let body;
    if (fbc.commentsLoading && !fbc.comments.length) body = '<div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando comentarios…</div>';
    else if (fbc.commentsError) body = `<div class="bc-social-error"><i class="ti ti-alert-triangle"></i><b>No se pudieron cargar los comentarios</b><span>${escapeHtml(fbc.commentsError)}</span><button type="button" id="bcFbcRetryComments">Reintentar</button></div>`;
    else if (!fbc.comments.length) body = '<div class="bc-social-empty-state"><i class="ti ti-message-circle"></i><b>Sin comentarios todavía</b><span>Esta publicación no tiene comentarios.</span></div>';
    else body = fbc.comments.map(fbcCommentHTML).join('') + (fbc.commentsHasMore ? '<button type="button" class="bc-fbc-loadmore" id="bcFbcMoreComments">Cargar más comentarios</button>' : '');
    pane.innerHTML = `${head}<div class="bc-fbc-comments-body">${body}</div>`;
  }

  async function loadFbcComments(postId, more){
    if (!more) { fbc.postId = postId; fbc.comments = []; fbc.commentsCursor = null; }
    // Si el agente hace clic en otra publicación antes de que esta respuesta
    // llegue, una respuesta tardía no debe pisar los comentarios del post
    // que quedó seleccionado despues (se compara contra el postId vigente).
    const idPedido = fbc.postId;
    fbc.commentsError = null; fbc.commentsLoading = true;
    fbcRenderPosts();
    fbcRenderComments();
    try {
      const data = await fbcInvoke('comments', { postId: idPedido, limit: 50, cursor: fbc.commentsCursor || undefined });
      if (fbc.postId !== idPedido) return;
      const nuevos = data.comments || [];
      fbc.comments = more ? fbc.comments.concat(nuevos) : nuevos;
      fbc.commentsHasMore = !!data.pagination?.hasMore;
      fbc.commentsCursor = data.pagination?.cursor || null;
    } catch (e) {
      if (fbc.postId !== idPedido) return;
      fbc.commentsError = e?.message || `Error de conexión con ${fbcRedLabel()}.`;
    } finally {
      if (fbc.postId !== idPedido) return;
      fbc.commentsLoading = false;
      fbcRenderComments();
    }
  }

  function fbcOpenBox(commentId, mode){
    if (fbc.openBox) { const prev = $(`#bcFbcBox-${CSS.escape(fbc.openBox.commentId)}`); if (prev) { prev.hidden = true; prev.innerHTML = ''; } }
    fbc.openBox = { commentId, mode };
    const box = $(`#bcFbcBox-${CSS.escape(commentId)}`);
    if (!box) return;
    box.hidden = false;
    box.className = 'bc-fbc-replybox' + (mode === 'private' ? ' private' : '');
    box.innerHTML = `<textarea id="bcFbcText-${escapeHtml(commentId)}" rows="2" placeholder="${mode === 'private' ? 'Mensaje privado (Private Reply)…' : 'Escribe la respuesta pública…'}"></textarea>
      <div class="bc-fbc-box-btns"><button type="button" class="send" data-fbc-send="${escapeHtml(commentId)}">Enviar</button><button type="button" class="cancel" data-fbc-cancel="${escapeHtml(commentId)}">Cancelar</button></div>`;
    // 15 sept 2026 (pedido de Sterling): antes había que bajar a mano hasta
    // el comentario para ver la caja de responder que se acababa de abrir,
    // sobre todo con muchos comentarios cargados. Ahora se desliza sola a
    // la vista -- suave, sin saltar de golpe -- y el foco al texto llega
    // después de que termina el scroll, no antes (si el navegador enfoca
    // primero, salta al textarea de golpe y pisa el scroll suave).
    try { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) { box.scrollIntoView(); }
    setTimeout(() => $(`#bcFbcText-${CSS.escape(commentId)}`)?.focus(), 260);
  }

  function fbcCloseBox(commentId){
    const box = $(`#bcFbcBox-${CSS.escape(commentId)}`);
    if (box) { box.hidden = true; box.innerHTML = ''; }
    if (fbc.openBox?.commentId === commentId) fbc.openBox = null;
  }

  async function fbcSend(commentId, btn){
    const mode = fbc.openBox?.mode || 'reply';
    const ta = $(`#bcFbcText-${CSS.escape(commentId)}`);
    const text = String(ta?.value || '').trim();
    if (!text || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      if (mode === 'private') {
        await fbcInvoke('private_reply', { postId: fbc.postId, commentId, message: text });
        fbcToast('Private Reply enviado.');
      } else {
        await fbcInvoke('reply', { postId: fbc.postId, commentId, message: text });
        fbcToast('Respuesta publicada.');
      }
      fbcCloseBox(commentId);
      await loadFbcComments(fbc.postId);
    } catch (e) {
      fbcToast(e?.message || 'No se pudo enviar. Es posible que ya se haya usado el único Private Reply de este comentario, o que el comentario tenga más de 7 días.', true);
      btn.disabled = false; btn.textContent = 'Enviar';
    }
  }

  async function fbcConvertirLead(commentId, btn){
    const client = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
    const comment = fbc.comments.find(c => c.id === commentId);
    if (!client?.from || !comment) return;
    btn.disabled = true;
    try {
      const actor = typeof sessionUser !== 'undefined' ? sessionUser : window.sessionUser;
      const sucursalId = await resolveSocialSucursalId(client, actor);
      if (!sucursalId) throw new Error('No se pudo determinar la sucursal para el lead.');
      const post = fbc.posts.find(p => p.id === fbc.postId);
      const red = fbcRedLabel();
      const { error } = await client.from('leads').insert({
        sucursal_id: sucursalId,
        canal: fbc.platform === 'instagram' ? 'instagram' : 'facebook',
        nombre: comment.from?.name || `Contacto de ${red}`,
        interes: comment.message || null,
        notas: `Comentario en ${red}${post ? ' (' + fbcTruncate(post.content, 60) + ')' : ''}: "${comment.message || ''}"\n${comment.url || ''}`.trim(),
        asignado_tipo: actor?._tipo === 'tecnico' ? 'tecnico' : 'usuario',
        asignado_id: actor?.id || null,
        etapa: 'nuevo'
      });
      if (error) throw error;
      comment._leadDone = true;
      fbcToast('Lead creado desde el comentario.');
      fbcRenderComments();
    } catch (e) {
      fbcToast(e?.message || 'No se pudo crear el lead.', true);
      btn.disabled = false;
    }
  }

  function bindFbcPanel(){
    const panel = $('#bcSocialContextPanel');
    if (!panel || panel.dataset.fbcBound === '1') return;
    panel.dataset.fbcBound = '1';
    panel.addEventListener('click', e => {
      const postBtn = e.target.closest('[data-fbc-post]');
      if (postBtn) { loadFbcComments(postBtn.dataset.fbcPost); return; }
      if (e.target.closest('#bcFbcRefreshPosts') || e.target.closest('#bcFbcRetryPosts')) { loadFbcPosts(true); return; }
      if (e.target.closest('#bcFbcMorePosts')) { loadFbcPosts(); return; }
      if (e.target.closest('#bcFbcRetryComments')) { loadFbcComments(fbc.postId); return; }
      if (e.target.closest('#bcFbcMoreComments')) { loadFbcComments(fbc.postId, true); return; }
      const act = e.target.closest('[data-fbc-act]');
      if (act) {
        const commentId = act.dataset.fbcComment;
        if (act.dataset.fbcAct === 'reply') fbcOpenBox(commentId, 'reply');
        else if (act.dataset.fbcAct === 'private') fbcOpenBox(commentId, 'private');
        else if (act.dataset.fbcAct === 'like') fbcToggleLike(commentId, act);
        else if (act.dataset.fbcAct === 'lead') fbcConvertirLead(commentId, act);
        return;
      }
      const sendBtn = e.target.closest('[data-fbc-send]');
      if (sendBtn) { fbcSend(sendBtn.dataset.fbcSend, sendBtn); return; }
      const cancelBtn = e.target.closest('[data-fbc-cancel]');
      if (cancelBtn) { fbcCloseBox(cancelBtn.dataset.fbcCancel); return; }
    });
  }

  function ensureHeader(){
    const head=$('#bcSocialHubHead');
    if(!head) return false;
    ensureTikTokPanel();
    ensureFacebookPanel();
    ensureContextPanel();

    $('#v-crmLinea')?.classList.add('bc-unified-nav');
    $('#bcSocialBackRow')?.remove();
    head.innerHTML=`
      <div class="bc-smart-platforms" id="bcSmartPlatforms" role="tablist" aria-label="Red social">
        ${Object.entries(CHANNELS).map(([key,c])=>`
          <button type="button" class="bc-smart-platform" data-smart-channel="${key}" role="tab" aria-selected="false">
            <span class="bc-smart-platform-icon"><i class="ti ${c.icon}"></i></span>
            <span class="bc-smart-platform-copy">
              <b>${c.label}</b>
              <small id="bcSmartAccount-${key}">${key==='instagram'?'Cargando cuenta…':'Pendiente de integración'}</small>
            </span>
            <span class="bc-smart-count" id="bcSmartCount-${key}" hidden>—</span>
          </button>`).join('')}
      </div>
      <div class="bc-smart-interactions">
        <div class="bc-smart-interaction-track" id="bcSmartInteractionNav" role="tablist" aria-label="Tipo de interacción"></div>
        <span class="bc-smart-divider" aria-hidden="true"></span>
        <button type="button" class="bc-smart-filter" id="bcSmartFilterBtn" aria-expanded="false">
          <i class="ti ti-filter"></i><span>Filtros</span><i class="ti ti-chevron-down"></i>
        </button>
        <div class="bc-smart-filter-pop" id="bcSmartFilterPop" hidden>
          <label><input type="checkbox" id="bcSmartUnreadOnly"> <span>Solo sin leer</span></label>
          <button type="button" id="bcSmartClearFilters">Limpiar filtros</button>
          <small>Los filtros se aplican a los datos reales disponibles del canal.</small>
        </div>
      </div>`;

    head.classList.add('bc-smart-ready');
    head.setAttribute('aria-label','Redes sociales: WhatsApp, Instagram, Facebook y TikTok');
    bindHeader();
    renderInteractionNav();
    syncHeaderState();
    return true;
  }

  function interactionItems(channel){
    const base = [
      {key:'all', label:'Todos', sub:'Todas las interacciones', icon:'ti-layout-grid'},
      {key:'messages', label:'Mensajes', sub: channel==='facebook' ? 'Messenger' : 'DM y respuestas', icon:'ti-send'},
      {key:'comments', label:'Comentarios', sub:'Publicaciones y Reels', icon:'ti-message-circle'}
    ];
    if(channel==='instagram') base.push({key:'mentions', label:'Menciones', sub:'Historias y etiquetas', icon:'ti-at'});
    return base;
  }

  function knownCount(channel, view){
    if(channel==='instagram'){
      if(view==='all' || view==='messages') return state.meta.instagram.count;
      return null;
    }
    return null;
  }

  function renderInteractionNav(){
    const host=$('#bcSmartInteractionNav');
    if(!host) return;
    const allowed=interactionItems(state.channel);
    if(!allowed.some(x=>x.key===state.view)) state.view='all';
    host.innerHTML=allowed.map(item=>{
      const count=knownCount(state.channel,item.key);
      // 15 sept 2026: Comentarios de Instagram se confirmó que SÍ funciona
      // (mismo endpoint de Zernio que ya usaba Facebook, probado en vivo con
      // publicaciones y comentarios reales de @bayolcell) -- deja de estar
      // marcado como pendiente.
      const yaFunciona=item.key==='comments' && (state.channel==='facebook' || state.channel==='instagram');
      const pending=!yaFunciona && ((state.channel!=='instagram') || (state.channel==='instagram' && ['comments','mentions'].includes(item.key)));
      return `
        <button type="button" class="bc-smart-interaction${state.view===item.key?' on':''}" data-smart-view="${item.key}" role="tab" aria-selected="${state.view===item.key}">
          <span class="bc-smart-interaction-icon"><i class="ti ${item.icon}"></i></span>
          <span class="bc-smart-interaction-copy"><b>${item.label}</b><small>${item.sub}</small></span>
          ${count!=null ? `<span class="bc-smart-mini-count">${count}</span>` : (pending ? '<span class="bc-smart-pending-dot" title="Integración pendiente"></span>' : '')}
        </button>`;
    }).join('');
  }

  function syncHeaderState(){
    $$('.bc-smart-platform').forEach(btn=>{
      const on=btn.dataset.smartChannel===state.channel;
      btn.classList.toggle('on',on);
      btn.setAttribute('aria-selected',String(on));
    });
    Object.keys(CHANNELS).forEach(ch=>{
      const meta=state.meta[ch];
      const account=$(`#bcSmartAccount-${ch}`);
      const count=$(`#bcSmartCount-${ch}`);
      if(account) account.textContent=meta.account || (meta.ready?'Conectado':'Pendiente de integración');
      if(count){
        if(meta.count==null){
          count.hidden=true;
        }else{
          count.hidden=false;
          count.textContent=String(meta.count);
        }
      }
    });
  }

  function bindHeader(){
    const head=$('#bcSocialHubHead');
    if(!head || head.dataset.smartBound==='1') return;
    head.dataset.smartBound='1';

    head.addEventListener('click',e=>{
      const channelBtn=e.target.closest('[data-smart-channel]');
      if(channelBtn){
        selectChannel(channelBtn.dataset.smartChannel);
        return;
      }
      const viewBtn=e.target.closest('[data-smart-view]');
      if(viewBtn){
        selectView(viewBtn.dataset.smartView);
        return;
      }
      if(e.target.closest('#bcSmartFilterBtn')){
        toggleFilters();
        return;
      }
      if(e.target.closest('#bcSmartClearFilters')){
        state.unreadOnly=false;
        const input=$('#bcSmartUnreadOnly');
        if(input) input.checked=false;
        applyFilters();
      }
    });

    head.addEventListener('change',e=>{
      if(e.target?.id==='bcSmartUnreadOnly'){
        state.unreadOnly=!!e.target.checked;
        applyFilters();
      }
    });

    document.addEventListener('click',e=>{
      const pop=$('#bcSmartFilterPop');
      const btn=$('#bcSmartFilterBtn');
      if(!pop || pop.hidden) return;
      if(!e.target.closest('#bcSmartFilterPop') && !e.target.closest('#bcSmartFilterBtn')){
        pop.hidden=true;
        btn?.setAttribute('aria-expanded','false');
      }
    },true);
  }

  function toggleFilters(){
    const pop=$('#bcSmartFilterPop');
    const btn=$('#bcSmartFilterBtn');
    if(!pop || !btn) return;
    pop.hidden=!pop.hidden;
    btn.setAttribute('aria-expanded',String(!pop.hidden));
  }

  function selectChannel(channel){
    if(!CHANNELS[channel]) return;
    if(channel==='whatsapp'){ window.crmLineaTab('mensajes'); return; }
    if(!state.visible){showSocial(channel);return;}
    state.channel=channel;
    state.view='all';
    renderInteractionNav();
    syncHeaderState();
    showCurrentContent();
    if(channel==='facebook') loadFacebookThreads();
    scheduleRefresh();
  }

  function selectView(view){
    if(!interactionItems(state.channel).some(x=>x.key===view)) return;
    state.view=view;
    renderInteractionNav();
    showCurrentContent();
    if(state.channel==='facebook' && ['all','messages'].includes(view)) loadFacebookThreads();
  }

  function contextInfo(){
    const ch=CHANNELS[state.channel]?.label || state.channel;
    const configs={
      instagram:{
        // 'comments' ya no usa este placeholder: renderFacebookCommentsPanel()
        // (mas abajo) construye la vista real con datos de Zernio, igual que
        // Facebook.
        mentions:{
          icon:'ti-at',
          title:'Menciones de Instagram',
          text:'Aquí se mostrarán menciones, historias y etiquetas cuando el webhook y permisos correspondientes estén conectados.',
          chips:['Historia / mención','Responder','Asignar agente','Convertir en lead']
        }
      },
      facebook:{
        all:{
          icon:'ti-brand-facebook',
          title:'Actividad de Facebook',
          text:'Esta vista reunirá Messenger y comentarios de Facebook sin mezclar ni duplicar interacciones.',
          chips:['Messenger','Comentarios','Private Reply','Leads']
        },
        messages:{
          icon:'ti-brand-messenger',
          title:'Facebook Messenger',
          text:'Bandeja privada preparada para conversaciones de Messenger. Se habilitará cuando la página, webhooks y envío estén conectados.',
          chips:['Conversaciones','No leídos','Asignación','Notas']
        }
        // 'comments' ya no usa este placeholder: renderFacebookCommentsPanel()
        // (mas abajo) construye la vista real con datos de Zernio.
      },
      tiktok:{
        all:{
          icon:'ti-brand-tiktok',
          title:'Actividad de TikTok',
          text:'La vista está preparada para integrar únicamente las capacidades oficiales y autorizadas disponibles para BAYOL CELL.',
          chips:['Comentarios','Inbox cuando aplique','Asignación','Leads']
        },
        messages:{
          icon:'ti-send',
          title:'TikTok Inbox',
          text:'Reservado para mensajes privados si la integración oficial aprobada para la cuenta permite recibirlos y responderlos.',
          chips:['Inbox','No leídos','Asignación']
        },
        comments:{
          icon:'ti-message-circle',
          title:'Comentarios de TikTok',
          text:'Reservado para comentarios y respuestas cuando la API autorizada permita administrar esas interacciones.',
          chips:['Video de origen','Comentario','Respuesta','Lead']
        }
      }
    };
    return configs[state.channel]?.[state.view] || {
      icon: CHANNELS[state.channel]?.icon || 'ti-message-circle',
      title:`${ch} · ${state.view}`,
      text:'Esta sección se habilitará con datos reales del canal.',
      chips:[]
    };
  }

  function renderContext(){
    const panel=$('#bcSocialContextPanel');
    if(!panel) return;
    // renderFacebookCommentsPanel() reemplaza panel.innerHTML por completo;
    // si se viene de ahi hay que reconstruir la tarjeta placeholder antes de
    // usarla para cualquier otra vista pendiente (menciones IG, TikTok, etc.).
    panel.classList.remove('bc-fbc-active');
    let card=$('.bc-social-context-card',panel);
    if(!card){ panel.innerHTML='<div class="bc-social-context-card"></div>'; card=$('.bc-social-context-card',panel); delete panel.dataset.fbcBuilt; }
    if(!card) return;
    const info=contextInfo();
    const meta=state.meta[state.channel];
    card.innerHTML=`
      <div class="bc-context-icon"><i class="ti ${info.icon}"></i></div>
      <div class="bc-context-copy">
        <div class="bc-context-kicker">${CHANNELS[state.channel]?.label || ''}</div>
        <h3>${info.title}</h3>
        <p>${info.text}</p>
        <div class="bc-context-chips">${(info.chips||[]).map(x=>`<span>${x}</span>`).join('')}</div>
        <div class="bc-context-status ${meta?.ready && state.channel==='instagram' ? 'partial' : 'pending'}">
          <i class="ti ${meta?.ready && state.channel==='instagram' ? 'ti-progress-check' : 'ti-clock'}"></i>
          ${meta?.ready && state.channel==='instagram' ? 'Canal conectado · módulo específico pendiente' : 'Integración backend pendiente'}
        </div>
      </div>`;
  }

  function showCurrentContent(){
    const view=$('#v-crmLinea');
    const ig=$('#bcSocialInstagramPanel');
    const fb=$('#bcSocialFacebookPanel');
    const tt=$('#bcSocialTikTokPanel');
    const ctx=$('#bcSocialContextPanel');
    if(!view || !ig || !fb || !tt || !ctx) return;

    ig.style.display='none';
    fb.style.display='none';
    tt.style.display='none';
    ctx.style.display='none';

    if(state.channel==='instagram' && (state.view==='all' || state.view==='messages')){
      ig.style.display='';
      view.dataset.socialChannel='instagram';
      window.BayolSocialHub?.switchChannel?.('instagram');
      setTimeout(applyFilters,60);
    }else if(state.channel==='facebook' && ['all','messages'].includes(state.view)){
      // Both inbox tabs share the real Messenger panel.
      fb.style.display='flex';
      view.dataset.socialChannel='facebook';
    }else if(state.channel==='tiktok' && state.view==='all'){
      tt.style.display='flex';
      view.dataset.socialChannel='tiktok';
    }else if((state.channel==='facebook' || state.channel==='instagram') && state.view==='comments'){
      // Mismo panel para los dos canales -- ver fbc.platform en
      // renderFacebookCommentsPanel() (bota el cache si cambió el canal).
      ctx.style.display='flex';
      view.dataset.socialChannel=state.channel;
      renderFacebookCommentsPanel();
    }else{
      ctx.style.display='flex';
      renderContext();
      view.dataset.socialChannel=state.channel;
    }
    view.classList.remove('bc-ig-chat-open');
  }

  function applyFilters(){
    // 15 sept 2026: el checkbox "Solo sin leer" es UNO SOLO en la barra
    // compartida (aplica a cualquier canal que esté activo), pero antes esta
    // función salía de inmediato si el canal no era Instagram -- en
    // Facebook, marcar el checkbox no hacía absolutamente nada (ni ocultaba
    // ni daba error, simplemente no pasaba nada). Facebook ya trae la marca
    // ".unread" en cada fila (ver renderThreads de loadFacebookThreads), así
    // que reusa la misma idea en vez de dejarlo sin implementar.
    if(state.channel==='instagram' && ['all','messages'].includes(state.view)){
      $$('.bc-ig-thread').forEach(row=>{
        const hasUnread=!!row.querySelector('.bc-ig-unread');
        row.hidden=state.unreadOnly && !hasUnread;
      });
    } else if(state.channel==='facebook'){
      $$('.bc-social-generic-thread').forEach(row=>{
        row.hidden=state.unreadOnly && !row.classList.contains('unread');
      });
    }
  }

  function ensureRedesTab(){
    const track=$('#v-crmLinea .crm-tabs-track');
    if(!track) return false;
    let btn=$('#crmLineaTabSocial');
    if(!btn){
      btn=document.createElement('button');
      btn.id='crmLineaTabSocial';
      btn.className='crm-tab-seg';
      btn.type='button';
      btn.innerHTML='<i class="ti ti-brand-meta"></i> Redes';
      btn.addEventListener('click',()=>showSocial(state.channel==='whatsapp'?'instagram':state.channel));
      track.appendChild(btn);
    }
    return true;
  }

  function setTabs(social){
    const wa=$('#crmLineaTabWa'), leads=$('#crmLineaTabLeads'), socialBtn=$('#crmLineaTabSocial');
    if(social){
      if(wa) wa.className='crm-tab-seg';
      if(leads) leads.className='crm-tab-seg';
      if(socialBtn) socialBtn.className='crm-tab-seg on pill-hundido';
    }else if(socialBtn){
      socialBtn.className='crm-tab-seg';
    }
  }

  function showSocial(channel='instagram'){
    const view=$('#v-crmLinea');
    const head=$('#bcSocialHubHead');
    if(!view || !head) return;
    state.visible=true;
    if(channel==='whatsapp'){ window.crmLineaTab('mensajes'); return; }
    if(CHANNELS[channel]) state.channel=channel;
    const nativeRedes=$('#crmLinea-redes'); if(nativeRedes) nativeRedes.style.display='none';
    view.classList.add('bc-social-mode');
    const wa=$('#crmLinea-mensajes'), leads=$('#crmLinea-leads');
    if(wa) wa.style.display='none';
    if(leads) leads.style.display='none';
    head.style.display='';
    syncConnectedAccounts();
    setTabs(true);
    renderInteractionNav();
    syncHeaderState();
    showCurrentContent();
    if(state.channel==='facebook' && ['all','messages'].includes(state.view)) loadFacebookThreads();
    scheduleRefresh();
  }

  // The account list can briefly lag behind a page that was just connected.
  // If the list endpoint is unavailable, use the already registered account
  // in Supabase so Facebook history can still be imported without exposing
  // the Zernio key in the browser.
  async function importFacebookHistory(client, sucursalId, accountId){
    if(!client?.from || !client?.functions?.invoke || !sucursalId) return null;
    let id=accountId||null;
    if(!id){
      try{
        const {data}=await withTimeout(client.from('social_cuentas').select('zernio_account_id').eq('sucursal_id',sucursalId).eq('plataforma','facebook').eq('activo',true).order('actualizado_en',{ascending:false}).limit(1).maybeSingle(),10000);
        id=data?.zernio_account_id||null;
      }catch(e){ console.warn('[social] no se pudo resolver la cuenta Facebook registrada',e); }
    }
    if(!id) return null;
    try{
      const result=await withTimeout(client.functions.invoke('social-importar-historial',{body:{accountId:id,sucursalId}}),25000);
      if(result?.error) throw result.error;
      return result?.data||null;
    }catch(e){ console.warn('[social] importación de historial Facebook no disponible',e); return null; }
    finally{ if(state.visible && state.channel==='facebook') loadFacebookThreads(); }
  }

  async function resolveSocialSucursalId(client, actor){
    const direct=actor?.sucursal_id||actor?.sucursalId;
    if(direct) return direct;
    // Owner/admin users may not carry a branch on their CRM profile. Resolve
    // it from the already registered Facebook account so the protected import
    // function still receives the correct tenant scope.
    try{
      const {data}=await withTimeout(client.from('social_cuentas').select('sucursal_id').eq('plataforma','facebook').eq('activo',true).order('actualizado_en',{ascending:false}).limit(1).maybeSingle(),8000);
      return data?.sucursal_id||null;
    }catch(e){ console.warn('[social] no se pudo resolver la sucursal de redes',e); return null; }
  }

  // Consulta los IDs reales de Zernio desde una Edge Function protegida.
  // Nunca se expone la API key en el navegador; la función solo devuelve
  // metadatos públicos de las cuentas y las registra en social_cuentas.
  let accountSyncStarted = false;
  async function syncConnectedAccounts(){
    if(accountSyncStarted) return;
    const client = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
    const actor = typeof sessionUser !== 'undefined' ? sessionUser : window.sessionUser;
    const sucursalId = await resolveSocialSucursalId(client,actor);
    if(!client?.functions?.invoke || !sucursalId) return;
    accountSyncStarted = true;
    try{
      const {data,error}=await withTimeout(client.functions.invoke('social-sincronizar-cuentas',{body:{sync:true,sucursalId}}),18000);
      if(error || !data?.ok){
        console.warn('[social] Zernio rechazó la sincronización',error || data);
        state.meta.facebook.account='Permiso pendiente';
        state.meta.tiktok.account='Permiso pendiente';
        state.meta.facebook.ready=false;
        state.meta.tiktok.ready=false;
        syncHeaderState();
        await importFacebookHistory(client,sucursalId);
        if(state.channel==='facebook') loadFacebookThreads();
        return;
      }
      (data.accounts||[]).forEach(a=>{
        const ch=a.platform;
        if(!state.meta[ch]) return;
        state.meta[ch].ready=!!a.isActive;
        state.meta[ch].account=a.username || a.displayName || 'Conectado';
      });
      syncHeaderState();
      if(state.visible) showCurrentContent();
      const fb=data.accounts?.find(a=>a.platform==='facebook');
      const imported=await importFacebookHistory(client,sucursalId,fb?._id);
      // Meta replay is asynchronous. A second sweep catches conversations
      // that were not visible during the first listing call.
      if(imported && Number(imported.threads||0)===0){
        setTimeout(()=>{ if(state.visible && state.channel==='facebook') importFacebookHistory(client,sucursalId,fb?._id); },10000);
      }
    }catch(e){
      accountSyncStarted=false;
      console.warn('[social] sync de cuentas no disponible',e);
      state.meta.facebook.ready=false;
      state.meta.tiktok.ready=false;
      syncHeaderState();
      await importFacebookHistory(client,sucursalId);
      if(state.channel==='facebook') loadFacebookThreads();
    }
  }

  function hideSocial(){
    state.visible=false;
    state.channel='whatsapp';
    if(window.BayolSocialHub) window.BayolSocialHub.state.channel='whatsapp';
    const view=$('#v-crmLinea');
    if(view){
      view.classList.remove('bc-social-mode','bc-ig-chat-open');
      view.dataset.socialChannel='whatsapp';
    }
    const head=$('#bcSocialHubHead');
    if(head) head.style.display='';
    ['#bcSocialInstagramPanel','#bcSocialFacebookPanel','#bcSocialTikTokPanel','#bcSocialContextPanel'].forEach(id=>{
      const el=$(id); if(el) el.style.display='none';
    });
    setTabs(false);
    syncHeaderState();
  }

  function patchTabs(){
    if(window.__bcSocialTabsPatched || typeof window.crmLineaTab!=='function') return;
    state.originalCrmLineaTab=window.crmLineaTab;
    window.crmLineaTab=async function(){
      const args=arguments;
      if(args[0]==='redes'){
        try{ showSocial('instagram'); }
        catch(e){ console.error('CRM Redes: fallo al abrir Redes',e); }
        return;
      }
      // Si hideSocial() falla por lo que sea, el cambio de pestaña nativo
      // (Mensajes/Leads) tiene que pasar igual — si no, la pestaña se queda
      // pegada y solo se arregla recargando la página (bug reportado 13 sept).
      try{ hideSocial(); }
      catch(e){ console.error('CRM Redes: fallo saliendo de Redes, se continúa igual con el cambio de pestaña',e); }
      return state.originalCrmLineaTab.apply(this,args);
    };
    window.__bcSocialTabsPatched=true;
  }

  async function refreshSmartData(){
    const client=typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
    if(!state.visible || !client) return;
    if(state.channel==='facebook' && ['all','messages'].includes(state.view)) await loadFacebookThreads();
    try{
      const {data:accounts,error:aErr}=await client.from('instagram_cuentas').select('id,instagram_username,nombre').eq('activo',true).limit(10);
      if(!aErr && accounts?.length){
        const account=accounts[0];
        state.meta.instagram.account=account.instagram_username ? `@${account.instagram_username}` : (account.nombre || 'Conectado');
        const {data:threads,error:tErr}=await client.from('instagram_hilos').select('id,no_leidos_count').eq('cuenta_id',account.id).eq('estado','abierto').limit(5000);
        if(!tErr) state.meta.instagram.count=(threads||[]).reduce((sum,h)=>sum+Number(h.no_leidos_count||0),0);
      }else if(!aErr){
        state.meta.instagram.account='Sin cuenta disponible';
        state.meta.instagram.count=0;
      }
    }catch{}

    syncHeaderState();
    renderInteractionNav();
    applyFilters();
  }

  function scheduleRefresh(){
    clearTimeout(state.refreshTimer);
    state.refreshTimer=setTimeout(refreshSmartData,120);
  }

  function observeInbox(){
    const host=$('#bcIgThreads');
    if(!host || host.dataset.smartObserved==='1') return;
    host.dataset.smartObserved='1';
    new MutationObserver(()=>applyFilters()).observe(host,{childList:true,subtree:true});
  }

  function finalize(){
    if(!ensureHeader() || !ensureRedesTab()) return false;
    patchTabs();
    hideSocial();
    observeInbox();

    const view=$('#v-crmLinea');
    if(view && !view.dataset.socialScopeObserved){
      view.dataset.socialScopeObserved='1';
      new MutationObserver(()=>{
        if(view.classList.contains('active') && state.visible) scheduleRefresh();
      }).observe(view,{attributes:true,attributeFilter:['class']});
    }

    window.BayolSocialNetworks={
      show:showSocial,
      hide:hideSocial,
      selectChannel,
      selectView,
      get channel(){return state.channel;},
      get view(){return state.view;},
      refresh:refreshSmartData,
      version:'20260912d'
    };
    return true;
  }

  function start(){
    if(finalize()) return;
    const mo=new MutationObserver(()=>{
      if(finalize()) mo.disconnect();
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),30000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
