/* Facebook: compact CRM chat. All provider actions use an authorized server endpoint. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const drafts=new Map();
  let selected=null,callbacks={},messages=[],busy=false,attachment=null;
  function composerUnlock(){
    const ta=$('#bcFbText');
    if(!ta)return ta;
    ta.disabled=false;
    ta.readOnly=false;
    ta.removeAttribute('disabled');
    ta.removeAttribute('readonly');
    ta.setAttribute('tabindex','0');
    ta.style.pointerEvents='auto';
    ta.style.userSelect='text';
    ta.style.webkitUserSelect='text';
    return ta;
  }
  const client=()=>typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient;
  const icon=(id,title,symbol)=>`<button type="button" id="${id}" class="bc-fb-icon" title="${title}" aria-label="${title}"><i class="ti ti-${symbol}"></i></button>`;
  const safeUrl=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:'';}catch{return '';}};
  function notice(text){const box=$('#bcFbNotice');if(box){box.textContent=text;box.hidden=!text;}}
  async function action(action,extra={},hiloId=selected){
    let timer,result;
    try{result=await Promise.race([client().functions.invoke('social-facebook-action',{body:{hiloId,action,...extra}}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('No se confirmó la acción a tiempo. Comprueba la conversación antes de reintentar.')),35000);})]);}finally{clearTimeout(timer);}
    const {data,error}=result;
    if(error){let detail;try{detail=await error.context?.json();}catch{}throw new Error(detail?.error||'No se confirmó la acción. Comprueba la conversación antes de reintentar.');}
    if(!data?.ok)throw new Error(data?.error||'No se confirmó la acción.');
    return data;
  }
  function close(){
    const ta=$('#bcFbText');if(selected&&ta)drafts.set(selected,ta.value);
    $('#bcSocialFacebookPanel')?.classList.remove('bc-fb-open');
    const panel=$('#bcSocialFacebookPanel');
    panel?.style.removeProperty('--fb-chat-height');
    panel?.style.removeProperty('--fb-chat-top');
    document.documentElement.classList.remove('bc-fb-lock-scroll');
  }
  function media(m){
    if(!m.media_url)return '';
    const url=safeUrl(m.media_url);if(!url)return '';
    const type=String(m.tipo_contenido||'');
    if(/image|imagen/.test(type))return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${esc(url)}" alt="Imagen adjunta"></a>`;
    if(/audio/.test(type))return `<audio controls preload="none" src="${esc(url)}"></audio>`;
    if(/video/.test(type))return `<video controls preload="none" src="${esc(url)}"></video>`;
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir adjunto</a>`;
  }
  function render(thread,rows,cb){
    const host=$('#bcFbChat');if(!host)return;
    const same=selected===thread.id;
    const ta=$('#bcFbText');if(ta&&selected)drafts.set(selected,ta.value);
    const previousMessages=$('#bcFbMessages');
    const previousTop=same&&previousMessages?previousMessages.scrollTop:null;
    const previousAtBottom=!same||!previousMessages||previousMessages.scrollHeight-previousMessages.clientHeight-previousMessages.scrollTop<80;
    selected=thread.id;callbacks=cb;messages=rows;
    if(!same)attachment=null;
    $('#bcSocialFacebookPanel')?.classList.add('bc-fb-open');
    document.documentElement.classList.add('bc-fb-lock-scroll');
    const name=thread.participant_name||thread.participant_username||'Contacto de Facebook';
    host.innerHTML=`<header class="bc-fb-head">${icon('bcFbBack','Volver a conversaciones','arrow-left')}<span class="bc-fb-avatar">${esc(name.slice(0,2).toUpperCase())}</span><div class="bc-fb-name"><b>${esc(name)}</b><small>Facebook · Messenger</small></div>${icon('bcFbFind','Buscar en este chat','search')}${icon('bcFbMore','Acciones de conversación','dots-vertical')}</header>
      <div id="bcFbActions" class="bc-fb-pop" hidden><button data-chat-action="read">Marcar leído</button><button data-chat-action="archive">Archivar</button><button data-chat-action="unarchive">Desarchivar</button><button data-chat-action="refresh">Actualizar</button></div>
      <div id="bcFbFindBox" class="bc-fb-find" hidden><input id="bcFbFindText" type="search" placeholder="Buscar en los mensajes cargados" aria-label="Buscar en mensajes"><button type="button" id="bcFbFindClose">Cerrar</button></div>
      <div id="bcFbNotice" class="bc-fb-notice" role="status" hidden></div>
      <div class="bc-fb-messages" id="bcFbMessages" style="position:relative;">${rows.map(m=>`<article class="bc-fb-row ${m.direccion==='out'?'out':'in'}" data-message="${esc(m.id)}"><div class="bc-fb-bubble">${media(m)}<div class="bc-fb-body">${esc(m.cuerpo||'')}</div><small>${esc(new Date(m.creado_en).toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'}))}${m.direccion==='out'?' · '+esc(m.estado||'enviado'):''}</small><button type="button" class="bc-fb-message-menu" data-menu="${esc(m.id)}" aria-label="Acciones del mensaje"><i class="ti ti-chevron-down"></i></button></div></article>`).join('')||'<p class="bc-fb-empty">Sin mensajes guardados</p>'}</div>
      <button type="button" class="bc-social-jump" id="bcFbJump" aria-label="Ir al último mensaje"><i class="ti ti-arrow-down"></i><span>Últimos mensajes</span></button>
      <div id="bcFbMessageActions" class="bc-fb-pop bc-fb-message-actions" hidden></div>
      <div id="bcFbAttachment" class="bc-fb-attachment" hidden></div>
      <div id="bcFbEmojiPanel" class="bc-fb-emojis" hidden>${['😀','👍','❤️','🙏','😊','✅'].map(e=>`<button type="button" data-emoji="${e}" aria-label="Insertar ${e}">${e}</button>`).join('')}</div>
      <form id="bcFbComposer" class="bc-fb-composer">${icon('bcFbEmoji','Emojis','mood-smile')}${icon('bcFbAttach','Adjuntar foto, video, audio o PDF','paperclip')}<input type="file" id="bcFbFile" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,audio/*,application/pdf" hidden><textarea id="bcFbText" maxlength="2000" rows="1" placeholder="Escribe un mensaje…" aria-label="Mensaje"></textarea><button id="bcFbSend" type="submit" aria-label="Enviar mensaje"><i class="ti ti-arrow-up"></i></button></form>`;
    $('#bcFbText').value=drafts.get(selected)||'';
    $('#bcFbBack').onclick=close;
    $('#bcFbMore').onclick=()=>{$('#bcFbActions').hidden=!$('#bcFbActions').hidden;};
    $('#bcFbFind').onclick=()=>{$('#bcFbFindBox').hidden=false;$('#bcFbFindText').focus();};
    $('#bcFbFindClose').onclick=()=>{$('#bcFbFindBox').hidden=true;host.querySelectorAll('[data-message]').forEach(el=>el.hidden=false);};
    $('#bcFbFindText').oninput=e=>{const q=e.target.value.toLocaleLowerCase();host.querySelectorAll('[data-message]').forEach(el=>{el.hidden=!el.textContent.toLocaleLowerCase().includes(q);});};
    $('#bcFbActions').onclick=async e=>{const a=e.target.dataset.chatAction;if(!a||busy)return;$('#bcFbActions').hidden=true;const id=selected;
      try{if(a==='refresh'){await callbacks.reload();return;}await action(a);if(selected===id)notice('Acción confirmada.');await callbacks.refreshList();}catch(err){notice(err.message);}};
    $('#bcFbEmoji').onclick=()=>{$('#bcFbEmojiPanel').hidden=!$('#bcFbEmojiPanel').hidden;};
    $('#bcFbEmojiPanel').onclick=e=>{const emoji=e.target.dataset.emoji;if(!emoji)return;const t=$('#bcFbText');t.setRangeText(emoji,t.selectionStart,t.selectionEnd,'end');drafts.set(selected,t.value);t.focus();};
    $('#bcFbAttach').onclick=()=>{if(!busy)$('#bcFbFile').click();};
    $('#bcFbFile').onchange=e=>{const f=e.target.files[0];if(!f)return;if(f.size>8*1024*1024){notice('El archivo debe pesar menos de 8 MB.');return;}attachment=f;paintAttachment();};
    $('#bcFbText').oninput=e=>{drafts.set(selected,e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,112)+'px';};
    $('#bcFbText').onfocus=()=>{if(!busy)composerUnlock();resize();};
    $('#bcFbText').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&matchMedia('(pointer:fine)').matches){e.preventDefault();send(e);}};
    $('#bcFbComposer').onsubmit=send;
    host.querySelectorAll('[data-menu]').forEach(btn=>btn.onclick=()=>messageMenu(btn.dataset.menu));
    host.querySelectorAll('.bc-fb-bubble img,.bc-fb-bubble video,.bc-fb-bubble audio').forEach(el=>el.addEventListener('error',async()=>{
      if(el.dataset.refreshed)return;el.dataset.refreshed='1';
      const id=el.closest('[data-message]')?.dataset.message,threadId=selected;
      try{const result=await action('media',{messageId:id},threadId);const url=safeUrl(result.url);if(url&&selected===threadId){el.src=url;if(el.parentElement.tagName==='A')el.parentElement.href=url;}}catch{notice('No se pudo recuperar un adjunto.');}
    }));
    paintAttachment();setBusy(busy);
    const scroll=$('#bcFbMessages'), jump=$('#bcFbJump');
    const cercaDelFondo=()=>!scroll||scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop<80;
    const actualizarJump=()=>{if(jump)jump.classList.toggle('mostrar',!cercaDelFondo());};
    if(scroll){
      const restore=()=>{scroll.scrollTop=previousAtBottom?scroll.scrollHeight:(previousTop??scroll.scrollHeight);actualizarJump();};
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore,120);
      scroll.addEventListener('scroll',actualizarJump);
    }
    jump?.addEventListener('click',()=>{if(scroll)scroll.scrollTop=scroll.scrollHeight;actualizarJump();});
    resize();
  }
  function paintAttachment(){const box=$('#bcFbAttachment');if(!box)return;box.hidden=!attachment;box.innerHTML=attachment?`<span>${esc(attachment.name)}</span><button type="button" id="bcFbRemoveFile" aria-label="Quitar adjunto">×</button>`:'';if(attachment)$('#bcFbRemoveFile').onclick=()=>{if(!busy){attachment=null;paintAttachment();}};}
  function setBusy(value){
    busy=!!value;
    ['#bcFbSend','#bcFbAttach'].forEach(s=>{if($(s))$(s).disabled=busy;});
    composerUnlock();
  }
  async function send(e){
    e.preventDefault();if(busy)return;
    const id=selected,t=$('#bcFbText'),text=t.value.trim(),file=attachment,cb=callbacks;
    if(!text&&!file)return;
    setBusy(true);notice('Enviando…');
    try{
      let attachmentId;
      if(file){const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});attachmentId=(await action('upload',{file:{base64,name:file.name,type:file.type}},id)).attachmentId;}
      const result=await action('send',{text,attachmentId,requestId:crypto.randomUUID()},id);
      if(selected===id){
        if(t.value.trim()===text){t.value='';drafts.delete(id);}else{drafts.set(id,t.value);}
        attachment=null;const sendBtn=$('#bcFbSend');if(sendBtn){sendBtn.classList.add('bc-sent-ok');setTimeout(()=>sendBtn.classList.remove('bc-sent-ok'),350);}await cb.reload();notice(result.partialFailure?'El adjunto salió, pero el texto no se confirmó.':result.localSaved===false?'Enviado a Facebook; pendiente de registro en el CRM.':'Mensaje enviado.');
      }else{drafts.delete(id);}
      await cb.refreshList();
    }catch(err){if(selected===id)notice(err.message);}
    finally{setBusy(false);if(selected===id)$('#bcFbText')?.focus({preventScroll:true});}
  }
  function messageMenu(id){
    const m=messages.find(x=>x.id===id);if(!m)return;
    const box=$('#bcFbMessageActions');box.hidden=false;
    box.innerHTML=`<button type="button" data-copy>Copiar texto</button>${['👍','❤️','😂','😮','😢','🙏'].map(e=>`<button type="button" data-react="${e}" aria-label="Reaccionar ${e}">${e}</button>`).join('')}<button type="button" data-unreact>Quitar mi reacción</button><button type="button" data-close>Cerrar</button>`;
    box.onclick=async e=>{const btn=e.target.closest('button');if(!btn)return;if(btn.hasAttribute('data-close')){box.hidden=true;return;}try{
      if(btn.hasAttribute('data-copy')){await navigator.clipboard.writeText(m.cuerpo||'');notice('Texto copiado.');}
      else{await action(btn.hasAttribute('data-unreact')?'unreact':'react',{messageId:id,emoji:btn.dataset.react});notice('Reacción actualizada en Facebook.');}
      box.hidden=true;
    }catch(err){notice(err.message);}};
  }
  function resize(){
    const p=$('#bcSocialFacebookPanel');
    if(!p||!p.classList.contains('bc-fb-open'))return;
    const v=window.visualViewport;
    const layoutHeight=Math.round(window.innerHeight||document.documentElement.clientHeight||0);
    const visualHeight=Math.round(v?.height||layoutHeight);
    const keyboardOpen=!!v&&layoutHeight-visualHeight>120;
    const height=keyboardOpen?visualHeight:Math.max(layoutHeight,visualHeight);
    p.style.setProperty('--fb-chat-height',Math.max(200,height)+'px');
    // A fixed element already follows Safari's visual viewport. Applying
    // offsetTop again moves the panel twice and leaves the white keyboard gap.
    p.style.setProperty('--fb-chat-top','0px');
  }
  window.visualViewport?.addEventListener('resize',resize);
  window.visualViewport?.addEventListener('scroll',resize);
  window.addEventListener('resize',resize);
  document.addEventListener('focusin',e=>{if(e.target?.id==='bcFbText'){resize();requestAnimationFrame(resize);setTimeout(resize,180);setTimeout(resize,420);}});
  window.BayolFacebookChat={render,close};
})();
