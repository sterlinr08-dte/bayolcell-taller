const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../diagnostico-photo-tiles.js'),'utf8'),context);const {validate,viewport}=context.window.BayolPhotoTiles;
const m={schema:'bayol-photo-pyramid/1',model:'iPhone X',revision:'QA-NOT-A-REAL-BOARD',width:8192,height:4096,tileSize:256,maxLevel:13,format:'png',originalSHA256:'a'.repeat(64),source:{title:'Synthetic QA photo',license:'Test only',reference:'Internal QA'}};
test('HD image metadata cannot cross models or accept invented scale levels',()=>{
 assert.equal(validate(m,'iPhone X').maxLevel,13);
 for(const broken of [{...m,maxLevel:20},{...m,width:0},{...m,originalSHA256:'invalid'},{...m,source:null}])assert.throws(()=>validate(broken,'iPhone X'));
 assert.throws(()=>validate(m,'iPhone XR'));
});
test('visible tile count bounded; source resolution remains maximum; offscreen viewport loads no tiles',()=>{
 const near=viewport(m,900,450,1,0,0),far=viewport(m,900,450,24,0,0);assert(near.level<far.level);assert(far.level<=m.maxLevel);assert(far.list.length<=64);
 assert.equal(viewport(m,900,450,24,999999,999999).list.length,0);
 assert(near.list.every(t=>t.width>0&&t.height>0&&t.left>=0&&t.top>=0));
});
