/* Local-only deep zoom. Source files remain on the device; bounded visible tile cache. */
(()=>{'use strict';
const size=(m,level)=>({w:Math.ceil(m.width/2**(m.maxLevel-level)),h:Math.ceil(m.height/2**(m.maxLevel-level))});
function validate(m,model){
 if(!m||m.schema!=='bayol-photo-pyramid/1'||m.model!==model||typeof m.revision!=='string'||!m.revision.trim()||m.revision.length>80)throw Error('Modelo o revisión de foto HD inválidos.');
 if(!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<1||m.height<1||m.width*m.height>80000000||![256,512].includes(m.tileSize)||m.format!=='png'||m.maxLevel!==Math.ceil(Math.log2(Math.max(m.width,m.height))))throw Error('Dimensiones o niveles de foto HD inválidos.');
 if(!m.source||['title','license','reference'].some(k=>typeof m.source[k]!=='string'||!m.source[k].trim()||m.source[k].length>500)||!/^\w{64}$/.test(m.originalSHA256)||!/^[0-9a-f]{64}$/i.test(m.originalSHA256))throw Error('Falta procedencia de la fotografía original.');
 return {schema:m.schema,model:m.model,revision:m.revision,width:m.width,height:m.height,tileSize:m.tileSize,maxLevel:m.maxLevel,format:'png',originalSHA256:m.originalSHA256,source:{title:m.source.title,license:m.source.license,reference:m.source.reference}};
}
function viewport(m,stageWidth,stageHeight,scale,x,y){
 const fit=Math.min(stageWidth/m.width,stageHeight/m.height),w=m.width*fit,h=m.height*fit;
 const level=Math.max(0,Math.min(m.maxLevel,Math.ceil(Math.log2(Math.max(m.width,m.height)*fit*scale))));
 const dimensions=size(m,level),tile=m.tileSize;
 const left=Math.max(0,(-stageWidth/2-x)/scale+w/2)/w*dimensions.w;
 const right=Math.min(w,(stageWidth/2-x)/scale+w/2)/w*dimensions.w;
 const top=Math.max(0,(-stageHeight/2-y)/scale+h/2)/h*dimensions.h;
 const bottom=Math.min(h,(stageHeight/2-y)/scale+h/2)/h*dimensions.h;
 const list=[];
 if(right>left&&bottom>top)for(let row=Math.max(0,Math.floor(top/tile)-1);row<=Math.min(Math.ceil(dimensions.h/tile)-1,Math.floor(bottom/tile)+1);row++)
 for(let column=Math.max(0,Math.floor(left/tile)-1);column<=Math.min(Math.ceil(dimensions.w/tile)-1,Math.floor(right/tile)+1);column++)list.push({key:`tiles/${level}/${column}_${row}.png`,left:column*tile/dimensions.w*100,top:row*tile/dimensions.h*100,width:Math.min(tile,dimensions.w-column*tile)/dimensions.w*100,height:Math.min(tile,dimensions.h-row*tile)/dimensions.h*100});
 return {w,h,level,list:list.slice(0,64)};
}
async function open(files,model){
 if(!files.length||files.length>30000||files.reduce((n,f)=>n+f.size,0)>800*1024*1024)throw Error('La carpeta HD supera 30,000 archivos u 800 MB.');
 const entries=new Map();
 for(const f of files){const path=f.webkitRelativePath||f.name;const relative=path.includes('/')?path.slice(path.indexOf('/')+1):path;if(entries.has(relative))throw Error('Archivos duplicados en la carpeta HD.');entries.set(relative,f);}
 const manifest=entries.get('manifest.json');if(!manifest||manifest.size>4096)throw Error('Falta manifest.json válido en la raíz de la carpeta.');
 const m=validate(JSON.parse(await manifest.text()),model);
 let expected=0;
 for(let l=0;l<=m.maxLevel;l++){const d=size(m,l);for(let r=0;r<Math.ceil(d.h/m.tileSize);r++)for(let c=0;c<Math.ceil(d.w/m.tileSize);c++){
   const f=entries.get(`tiles/${l}/${c}_${r}.png`);if(!f||f.size>5*1024*1024||!['image/png',''].includes(f.type))throw Error('Faltan tiles o hay archivos inválidos en la foto HD.');expected++;
 }}
 if(expected>30000)throw Error('La pirámide contiene demasiados tiles.');
 const root=document.createElement('div');root.className='ab-photo-grid';const cache=new Map();let destroyed=false;
 const url=key=>{if(!cache.has(key))cache.set(key,URL.createObjectURL(entries.get(key)));return cache.get(key);};
 const previewLevel=Math.min(8,m.maxLevel),previewKey=`tiles/${previewLevel}/0_0.png`;
 const preview=document.createElement('img');preview.className='ab-photo-preview';preview.alt='Fotografía original por niveles, sin validación eléctrica';preview.src=url(previewKey);preview.draggable=false;root.append(preview);
 try{await preview.decode();}catch{for(const value of cache.values())URL.revokeObjectURL(value);throw Error('La vista previa de la foto HD está dañada.');}
 const active=document.createElement('div');active.className='ab-photo-active';root.append(active);
 return {manifest:m,root,render(stageWidth,stageHeight,scale,x,y){
   if(destroyed||!stageWidth||!stageHeight)return;
   const v=viewport(m,stageWidth,stageHeight,scale,x,y);root.style.width=v.w+'px';root.style.height=v.h+'px';
   const keys=new Set([previewKey,...v.list.map(t=>t.key)]);
   for(const image of [...active.children])if(!keys.has(image.dataset.key))image.remove();
   for(const t of v.list){let image=[...active.children].find(n=>n.dataset.key===t.key);if(!image){image=document.createElement('img');image.dataset.key=t.key;image.alt='';image.draggable=false;image.src=url(t.key);image.addEventListener('error',()=>{image.remove();},{once:true});active.append(image);}Object.assign(image.style,{left:t.left+'%',top:t.top+'%',width:t.width+'%',height:t.height+'%'});}
   for(const [key,value] of cache)if(!keys.has(key)){URL.revokeObjectURL(value);cache.delete(key);}
 },destroy(){destroyed=true;for(const value of cache.values())URL.revokeObjectURL(value);cache.clear();root.replaceChildren();entries.clear();}};
}
window.BayolPhotoTiles={validate,viewport,open};
})();
