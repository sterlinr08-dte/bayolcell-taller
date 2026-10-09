import test from 'node:test';
import assert from 'node:assert/strict';
import {target,smoke} from '../../tools/ai-board/staging_smoke.mjs';
test('staging smoke refuses production, alternate paths and embedded credentials before any HTTP request',async()=>{
 for(const url of ['https://vkhwdvjtowrhkhqavnvk.supabase.co','https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1','https://a:b@abcdefghijklmnopqrst.supabase.co','http://abcdefghijklmnopqrst.supabase.co','https://example.com']){
  let calls=0;await assert.rejects(smoke({AI_BOARD_STAGING_URL:url},async()=>{calls++;}));assert.equal(calls,0);
 }
 assert.equal(target('https://abcdefghijklmnopqrst.supabase.co'),'https://abcdefghijklmnopqrst.supabase.co');
});
