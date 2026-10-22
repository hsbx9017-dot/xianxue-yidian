import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createAdminServer} from './feedback-admin.mjs';
import {request as httpRequest} from 'node:http';
const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const source=ts.transpile(read('../lib/feedback.ts'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {makeFeedbackPayload,uploadFeedback}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const id='00000000-0000-4000-8000-000000000001',input={rating:'有帮助',stuck:'  任务可以更具体  ',wish:'少问一点'};
const payload=makeFeedbackPayload({...input,apiKey:'never-send',plan:{private:true}},'rules',id);
assert.deepEqual(Object.keys(payload),['submissionId','rating','stuck','wish','mode']);assert.equal(payload.stuck,'任务可以更具体');
assert.throws(()=>makeFeedbackPayload({rating:'',stuck:' ',wish:''},'rules',id));
assert.throws(()=>makeFeedbackPayload({...input,stuck:'x'.repeat(801)},'rules',id));
for(const secret of ['sk-'+'a'.repeat(30),'sb_secret_'+'a'.repeat(30),'github_pat_abc'])assert.throws(()=>makeFeedbackPayload({...input,wish:secret},'rules',id));
const config={url:'https://test.supabase.co',publishableKey:'sb_publishable_test'};
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async(url,options)=>{
  assert.equal(String(url),'https://test.supabase.co/rest/v1/rpc/submit_feedback');
  assert.equal(options.credentials,'omit');assert.equal(options.headers.apikey,config.publishableKey);
  const body=JSON.parse(options.body);assert.deepEqual(body,{payload});assert.ok(!options.body.includes('never-send'));
  return Response.json({ok:true,id,receivedAt:'2026-10-22T10:00:00Z'});
 };
 assert.equal((await uploadFeedback(config,{...payload,apiKey:'never-send'})).id,id);
 await assert.rejects(()=>uploadFeedback({url:'',publishableKey:''},payload),/尚未启用/);
 globalThis.fetch=async()=>Response.json({ok:true,id:'wrong',receivedAt:'2026-10-22T10:00:00Z'});
 await assert.rejects(()=>uploadFeedback(config,payload),/有效的保存回执/);
 globalThis.fetch=async()=>Response.json({ok:true,id,receivedAt:'invalid'});
 await assert.rejects(()=>uploadFeedback(config,payload),/有效的保存回执/);
 globalThis.fetch=async()=>new Response('private database failure',{status:503});
 await assert.rejects(()=>uploadFeedback(config,payload),e=>e.message.includes('未确认')&&!e.message.includes('private'));
 globalThis.fetch=async()=>{throw Error('network')};await assert.rejects(()=>uploadFeedback(config,payload),/内容仍在/);
}finally{globalThis.fetch=originalFetch}

const secretKey='sb_secret_LOCAL_ONLY_TEST',calls=[];
const server=createAdminServer({config:{url:'https://test.supabase.co',secretKey},rpc:async(name,args)=>{calls.push({name,args});if(name==='admin_feedback_list')return [{submission_id:id,rating:'有帮助',stuck:'<script>test</script>',wish:'建议',mode:'rules',created_at:'2026-10-22T10:00:00Z',processed:false}];return true}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
try{
 assert.equal((await fetch(base+'/__admin/api/feedback')).status,401);
 assert.equal((await fetch(base+'/__admin',{headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await fetch(base+'/__admin',{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
 const hostileHost=await new Promise((resolve,reject)=>{const req=httpRequest(base+'/__admin',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end()});assert.equal(hostileHost,403);
 const page=await fetch(base+'/__admin'),cookie=page.headers.get('set-cookie').split(';')[0];
 assert.ok(cookie.includes('xianxue_admin='));assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));assert.ok(!(await page.text()).includes(secretKey));
 const response=await fetch(base+'/__admin/api/feedback',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal((await response.json()).rows.length,1);
 assert.equal((await fetch(base+'/__admin/api/feedback?beforeTime=bad&beforeId=bad',{headers:{Cookie:cookie}})).status,400);
 assert.equal((await fetch(base+'/__admin/api/mark',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify({id,processed:true})})).status,403);
 assert.equal((await fetch(base+'/__admin/api/mark',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({id,processed:true})})).status,200);
 assert.deepEqual(calls.at(-1),{name:'admin_feedback_mark',args:{item_id:id,done:true}});
 assert.equal((await fetch(base+'/%2e%2e%2fpackage.json')).status,403);
 const app=read('../feedback-admin/app.js');assert.ok(!app.includes('innerHTML'));assert.ok(app.includes('while(hasMore)'));assert.ok(!app.includes(secretKey));
}finally{await new Promise(resolve=>server.close(resolve))}
const app=read('../app/learning-app.tsx');assert.ok(!app.includes('复制反馈，发给创建者'));assert.ok(app.includes('setFeedbackReceipt(receipt)'));assert.ok(app.includes('feedbackAttempt.current'));assert.ok(app.includes('feedbackSending'));assert.ok(app.includes('/__admin/status'));
console.log('Feedback checks passed: field whitelist, secret rejection, real acknowledgement requirement, failure retention, local-only admin, session/CSRF boundaries, export pagination. No cloud data written.');
