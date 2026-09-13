import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const url=Deno.env.get('SUPABASE_URL')!;
const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const apiKey=Deno.env.get('ZERNIO_API_KEY');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handler(req:Request){
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'Método no permitido'},405);
  const authorization=req.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer '))return json({ok:false,error:'Inicia sesión de nuevo'},401);
  const {data:auth,error:authError}=await db.auth.getUser(authorization.slice(7));
  if(authError||!auth.user)return json({ok:false,error:'Sesión inválida'},401);
  let b:any;try{b=await req.json()}catch{return json({ok:false,error:'Solicitud inválida'},400)}
  if(!uuid.test(b.hiloId||''))return json({ok:false,error:'Conversación inválida'},400);
  const actions=['send','upload','react','unreact','read','archive','unarchive','media'];
  if(!actions.includes(b.action))return json({ok:false,error:'Acción no disponible'},400);
  // The actor comes from the server-owned binding, never user_metadata.
  const {data:binding,error:bindingError}=await db.from('auth_actor_bindings').select('actor_type,actor_ref_id').eq('auth_user_id',auth.user.id).eq('activo',true).maybeSingle();
  if(bindingError||!binding)return json({ok:false,error:'Operador sin acceso'},403);
  const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:hilo,error:hErr}=await caller.from('social_hilos').select('id,cuenta_id,sucursal_id,zernio_conversation_id').eq('id',b.hiloId).maybeSingle();
  if(hErr||!hilo)return json({ok:false,error:'No tienes acceso a esta conversación'},403);
  const {data:cuenta,error:cErr}=await caller.from('social_cuentas').select('zernio_account_id,plataforma,activo').eq('id',hilo.cuenta_id).maybeSingle();
  if(cErr||!cuenta?.activo||cuenta.plataforma!=='facebook')return json({ok:false,error:'Cuenta no disponible'},403);
  if(b.action!=='media'){
    const {data:isAdmin,error:adminError}=await caller.rpc('app_is_admin');
    let canAct=!adminError&&isAdmin===true;
    if(!canAct&&binding.actor_type==='tecnico'){
      const {data:tech}=await db.from('tecnicos').select('activo,rol_id').eq('id',binding.actor_ref_id).maybeSingle();
      if(tech?.activo&&tech.rol_id){
        const {data:role}=await db.from('roles_taller').select('permisos').eq('id',tech.rol_id).maybeSingle();
        canAct=role?.permisos?.whatsapp_responder===true;
      }
    }
    if(!canAct)return json({ok:false,error:'Tu rol no permite gestionar mensajes'},403);
  }
  if(!apiKey)return json({ok:false,error:'Integración no configurada'},503);
  const accountId=cuenta.zernio_account_id;
  const base='/inbox/conversations/'+encodeURIComponent(hilo.zernio_conversation_id);
  let accepted=false;
  async function zernio(path:string,method:string,payload?:unknown,idempotency?:string){
    const form=payload instanceof FormData;
    const response=await fetch('https://zernio.com/api/v1'+path,{method,headers:{Authorization:'Bearer '+apiKey,...(!form?{'Content-Type':'application/json'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},body:payload===undefined?undefined:form?payload as FormData:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data||data.success===false)throw new Error('Facebook no aceptó la acción. Comprueba la ventana de atención y los permisos de la página.');
    return data;
  }
  try{
    if(b.action==='upload'){
      const file=b.file;
      if(!file||typeof file.base64!=='string'||file.base64.length>11200000)return json({ok:false,error:'Máximo 8 MB por archivo'},400);
      const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));
      if(bytes.length>8*1024*1024)return json({ok:false,error:'Máximo 8 MB por archivo'},400);
      const allowed=/^(image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime|webm)|audio\/[a-z0-9.+-]+|application\/pdf)$/i;
      if(!allowed.test(file.type||''))return json({ok:false,error:'Usa imagen, video, audio o PDF'},400);
      const form=new FormData();form.append('file',new Blob([bytes],{type:file.type}),String(file.name||'archivo').slice(0,150));
      const data=await zernio('/media/upload-direct','POST',form);
      if(!data.url?.startsWith('https://'))throw new Error('No se pudo preparar el archivo');
      // Keep the uploaded URL server-side; the send action accepts its message UUID only.
      const {data:draft,error}=await db.from('social_mensajes').insert({hilo_id:hilo.id,direccion:'out',tipo_contenido:file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'audio':'file',media_url:data.url,estado:'pendiente',metadata:{upload_only:true,uploaded_by:auth.user.id,filename:file.name}}).select('id').single();
      if(error)throw error;
      return json({ok:true,attachmentId:draft.id});
    }
    if(b.action==='media'||b.action==='react'||b.action==='unreact'){
      const {data:m,error}=await caller.from('social_mensajes').select('zernio_message_id,media_url').eq('hilo_id',hilo.id).eq('id',b.messageId).maybeSingle();
      if(error||!m?.zernio_message_id)return json({ok:false,error:'Mensaje no disponible para esta acción'},400);
      const msg=base+'/messages/'+encodeURIComponent(m.zernio_message_id);
      if(b.action==='media'){
        const data=await zernio(msg+'/attachments/0?'+new URLSearchParams({accountId,format:'json'}),'GET');
        return json({ok:true,url:data.url});
      }
      if(b.action==='react'&&!['👍','❤️','😂','😮','😢','🙏'].includes(b.emoji))return json({ok:false,error:'Reacción inválida'},400);
      await zernio(msg+'/reactions',b.action==='react'?'POST':'DELETE',{accountId,...(b.action==='react'?{emoji:b.emoji}:{})});
      return json({ok:true});
    }
    if(['read','archive','unarchive'].includes(b.action)){
      await zernio(base+(b.action==='read'?'/read':''),b.action==='read'?'POST':'PUT',{accountId,...(b.action==='read'?{}:{status:b.action==='archive'?'archived':'active'})});accepted=true;
      const {error}=await db.from('social_hilos').update(b.action==='read'?{no_leidos_count:0}:{estado:b.action==='archive'?'archivado':'abierto'}).eq('id',hilo.id);
      return json({ok:true,localSaved:!error});
    }
    const text=String(b.text||'').trim();
    if(text.length>2000||(!text&&!b.attachmentId)||!uuid.test(b.requestId||''))return json({ok:false,error:'Mensaje inválido (máximo 2000 caracteres)'},400);
    let attachment:any=null;
    if(b.attachmentId){
      const {data:m}=await db.from('social_mensajes').select('*').eq('id',b.attachmentId).eq('hilo_id',hilo.id).maybeSingle();
      if(!m?.metadata?.upload_only||m.metadata.uploaded_by!==auth.user.id||m.zernio_message_id)return json({ok:false,error:'Adjunto no disponible'},400);
      attachment=m;
    }
    const data=await zernio(base+'/messages','POST',{accountId,...(text?{message:text}:{}),...(attachment?{attachmentUrl:attachment.media_url,attachmentType:attachment.tipo_contenido}:{})},auth.user.id+':'+b.requestId);
    accepted=true;
    const messageId=data.data?.messageId;
    const row={hilo_id:hilo.id,direccion:'out',tipo_contenido:attachment?.tipo_contenido||'text',cuerpo:text||null,media_url:attachment?.media_url||null,zernio_message_id:messageId||null,estado:'enviado',metadata:{requestId:b.requestId,partialFailure:data.data?.partialFailure||null},creado_en:new Date().toISOString()};
    const saved=attachment?await db.from('social_mensajes').update(row).eq('id',attachment.id):await db.from('social_mensajes').upsert(row,{onConflict:'zernio_message_id'});
    const updated=await db.from('social_hilos').update({ultimo_mensaje_preview:text||'Adjunto',ultimo_mensaje_at:row.creado_en,actualizado_en:row.creado_en}).eq('id',hilo.id);
    return json({ok:true,localSaved:!saved.error&&!updated.error,partialFailure:!!data.data?.partialFailure,messageId});
  }catch(error){return json({ok:false,uncertain:accepted||b.action==='send',error:error instanceof Error?error.message:'No se pudo completar la acción'},502);}
}
Deno.serve(handler);
