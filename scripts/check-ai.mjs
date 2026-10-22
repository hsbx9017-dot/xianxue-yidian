import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import ts from'typescript';
const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const url=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpile(s,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64');
const plannerUrl=url(read('../lib/planner.ts'));
const{makePlan,defaultProfile}=await import(plannerUrl);
const{requestDeepSeekPlan,validateAIPlan,DEEPSEEK_ENDPOINT}=await import(url(read('../lib/ai-plan.ts').replace("'./planner'",JSON.stringify(plannerUrl))));
const p={...defaultProfile,startDate:'2026-10-22',blocked:[0,6],minutes:15};
const baseline=makePlan(p),visitorKey='sk-test-not-a-real-key-123456789';
const output={summary:'每天一点',why:'根据真实时间安排',tradeoff:'先覆盖少量内容',days:baseline.days.filter(d=>!d.rest).map(d=>({id:d.id,focus:'做一道具体题',tasks:['读题','独立尝试','核对并记录']}))};
const plan=validateAIPlan(baseline,output);assert.equal(plan.source,'deepseek');
assert.deepEqual(plan.resources,baseline.resources);assert.deepEqual(plan.preparation,baseline.preparation);
assert.throws(()=>validateAIPlan(baseline,{...output,why:'请打开 https://invented.invalid/course'}),/unverified link/);
for(const d of plan.days){assert.equal(d.minutes,d.rest?0:15);assert.equal(d.tasks.reduce((s,t)=>s+t.minutes,0),d.minutes)}
assert.throws(()=>validateAIPlan(baseline,{...output,days:[]}));
assert.throws(()=>validateAIPlan(baseline,{...output,days:output.days.map(d=>({...d,id:0}))}));
const original=globalThis.fetch;let calls=0;
try{
 globalThis.fetch=async(endpoint,options)=>{calls++;assert.equal(endpoint,DEEPSEEK_ENDPOINT);assert.equal(options.headers.Authorization,`Bearer ${visitorKey}`);assert.equal(options.credentials,'omit');assert.ok(!options.body.includes(visitorKey));const payload=JSON.parse(options.body);assert.equal(payload.model,'deepseek-flash');return Response.json({choices:[{message:{content:JSON.stringify(output)}}]})};
 assert.equal((await requestDeepSeekPlan(p,visitorKey)).source,'deepseek');assert.equal(calls,1);
 await assert.rejects(()=>requestDeepSeekPlan(p,''));assert.equal(calls,1);
 globalThis.fetch=async()=>new Response('upstream private text',{status:401});await assert.rejects(()=>requestDeepSeekPlan(p,visitorKey),e=>e.message.includes('密钥无效')&&!e.message.includes('private'));
 globalThis.fetch=async()=>{throw new Error('network')};await assert.rejects(()=>requestDeepSeekPlan(p,visitorKey),e=>e.message.includes('未能连接'));
 const app=read('../app/learning-app.tsx');assert.ok(!app.includes("fetch('/api/plan'"));assert.ok(!app.includes('经本站服务器'));assert.ok(app.includes('刷新后需要重填'));assert.ok(app.includes('setApiKey(keyDraft.trim())'));
 console.log('Static AI checks passed: direct DeepSeek only, visitor-only credentials, constrained schedules, bad output and errors. No live paid calls.');
}finally{globalThis.fetch=original}
