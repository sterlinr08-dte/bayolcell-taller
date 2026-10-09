/* Data-only boardview ingestion. No arbitrary SVG/HTML or invented electrical data. */
(()=>{'use strict';
function validate(raw,model){
 const fail=()=>{throw Error('Boardview inválido: comprueba modelo, revisión, fuente y geometría.');};
 if(!raw||raw.schema!=='bayol-boardview/1'||raw.model!==model||typeof raw.revision!=='string'||!raw.revision.trim()||raw.revision.length>80)fail();
 const source=raw.source;
 if(!source||['title','license','reference'].some(k=>typeof source[k]!=='string'||!source[k].trim()||source[k].length>500))fail();
 if(!Number.isFinite(raw.width)||!Number.isFinite(raw.height)||raw.width<=0||raw.height<=0||raw.width>100000||raw.height>100000)fail();
 if(!Array.isArray(raw.components)||!raw.components.length||raw.components.length>10000)fail();
 const ids=new Set(),components=[];
 for(const c of raw.components){
  if(!c||typeof c.ref!=='string'||!/^[A-Za-z0-9_.-]{1,40}$/.test(c.ref)||ids.has(c.ref)||!['top','bottom'].includes(c.side))fail();
  for(const k of ['x','y','width','height'])if(!Number.isFinite(c[k]))fail();
  if(c.x<0||c.y<0||c.width<=0||c.height<=0||c.x+c.width>raw.width||c.y+c.height>raw.height)fail();
  if(c.pins!==undefined&&(!Array.isArray(c.pins)||c.pins.length>500))fail();
  const pinIDs=new Set();const pins=(c.pins||[]).map(p=>{
   if(!p||typeof p.id!=='string'||p.id.length>40||!p.id||pinIDs.has(p.id)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>c.width||p.y>c.height||typeof p.net!=='string'||p.net.length>120)fail();
   pinIDs.add(p.id);return {id:p.id,x:p.x,y:p.y,net:p.net};
  });
  ids.add(c.ref);components.push({ref:c.ref,side:c.side,x:c.x,y:c.y,width:c.width,height:c.height,pins});
 }
 if(components.reduce((sum,c)=>sum+c.pins.length,0)>50000)fail();
 return {schema:raw.schema,model,revision:raw.revision,width:raw.width,height:raw.height,source:{title:source.title,license:source.license,reference:source.reference},components};
}
window.BayolBoardData={validate};
})();
