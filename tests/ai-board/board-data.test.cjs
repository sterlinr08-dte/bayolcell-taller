const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../../diagnostico-board-data.js'),'utf8'),context);
const validate=context.window.BayolBoardData.validate;
const data=()=>({schema:'bayol-boardview/1',model:'iPhone X',revision:'QA-NOT-A-REAL-BOARD',source:{title:'Test fixture',license:'Test only',reference:'Internal QA'},width:100,height:100,components:[{ref:'QA1',side:'top',x:1,y:1,width:10,height:10,pins:[{id:'1',x:1,y:1,net:'QA_NET'}]}]});
test('model, revision and declared provenance required; geometry cannot escape board',()=>{
 const d=data();assert.equal(validate(d,'iPhone X').components[0].pins[0].net,'QA_NET');
 for(const broken of [{...d,model:'iPhone XR'},{...d,revision:''},{...d,source:null},{...d,components:[{...d.components[0],x:101}]}])assert.throws(()=>validate(broken,'iPhone X'));
});
test('duplicate designators, pins, invalid numbers and unknown SVG fields cannot enter renderer',()=>{
 const d=data();assert.throws(()=>validate({...d,components:[d.components[0],d.components[0]]},'iPhone X'));
 assert.throws(()=>validate({...d,components:[{...d.components[0],pins:[d.components[0].pins[0],d.components[0].pins[0]]}]},'iPhone X'));
 assert.throws(()=>validate({...d,width:Infinity},'iPhone X'));
 const result=validate({...d,svg:'<script>bad()</script>',components:[{...d.components[0],onclick:'bad()'}]},'iPhone X');assert.equal(result.svg,undefined);assert.equal(result.components[0].onclick,undefined);
});
