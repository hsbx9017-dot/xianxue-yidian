import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('lib/planner.ts','utf8');
const {defaultProfile,makePlan,planMarkdown}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const p={...defaultProfile,startDate:'2026-10-22'};
const unknown=makePlan({...p,subject:'math'});assert.ok(unknown.materialSummary.includes('尚未确认'));assert.ok(unknown.days[0].focus.includes('确认'));assert.ok(!unknown.materialSummary.includes('第八版，上册'));
const derivative=makePlan({...p,subject:'math',mathBook:'同济《高等数学》第七版，上册',mathUnit:'derivative',chapter:'导数的运算法则'});
assert.ok(derivative.materialSummary.includes('第七版'));assert.ok(derivative.days[0].tasks.some(t=>t.text.includes('3x²−2')));assert.ok(!derivative.materialSummary.includes('第八版'));
const integral=makePlan({...p,subject:'math',mathUnit:'integral'});assert.ok(integral.days[0].tasks.some(t=>t.text.includes('x²+C')));assert.ok(!integral.resources.some(r=>r.url?.includes('TONGJI-53004')));
const python=makePlan({...p,subject:'python',pythonDevice:'browser'});assert.ok(python.resources.some(r=>r.url==='https://pythontutor.com/visualize.html'));assert.ok(python.resources.some(r=>r.url?.includes('BIT-268001')));assert.ok(python.days[0].tasks.some(t=>t.text.includes('print(')));
const tiny=makePlan({...p,subject:'python',minutes:5});assert.ok(!JSON.stringify(tiny.days).includes('循环'));assert.ok(tiny.days.every(d=>d.tasks.reduce((n,t)=>n+t.minutes,0)===5));
const own=makePlan({...p,subject:'english',material:'我的大学英语Unit 2'});assert.ok(own.resources[0].title.includes('Unit 2'));assert.equal(own.resources[0].url,undefined);assert.ok(own.days[0].tasks[0].text.includes('Unit 2'));
const listening=makePlan({...p,subject:'english',englishSkill:'listening',level:'start'});assert.ok(listening.resources[0].url.endsWith('/listening/a1'));assert.ok(listening.days[0].tasks.some(t=>t.text.includes('Transcript')));
const allowed=new Set(['learnenglish.britishcouncil.org','dictionary.cambridge.org','www.icourse163.org','gaoshutongbu.tongji.edu.cn','thonny.org','pythontutor.com','docs.python.org']);
for(const subject of ['english','math','python','other'])for(const minutes of [5,25]){
 const plan=makePlan({...p,subject,minutes});
 assert.ok(plan.preparation.length);assert.ok(plan.checkpoints.length);
 for(const r of plan.resources){if(r.url){assert.ok(allowed.has(new URL(r.url).hostname));assert.equal(new URL(r.url).protocol,'https:');assert.equal(r.checkedAt,'2026-10-22')}}
 const markdown=planMarkdown(plan,{...p,subject});assert.ok(markdown.includes('怎样算有进展'));assert.ok(markdown.includes('准备：'));for(const r of plan.resources)if(r.url)assert.ok(markdown.includes(r.url));
}
const app=readFileSync('app/learning-app.tsx','utf8');assert.ok(app.includes('<MaterialQuestions'));assert.ok(app.includes('<LearningKit'));assert.ok(app.includes('task-stage'));
console.log('Material checks passed: editions preserved, unknown scope honest, calculus topic selection, Python course/tools, small budgets, existing materials respected, vetted URLs and complete Markdown export.');
