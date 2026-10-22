import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const compile = file => 'data:text/javascript;base64,'+Buffer.from(ts.transpile(readFileSync(new URL(file,import.meta.url),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64');
const {defaultProfile,makePlan,planMarkdown} = await import(compile('../lib/planner.ts'));
let checked=0;
for(const subject of ['english','math','other'])for(const minutes of [5,10,15,25,60,90])for(let mask=0;mask<127;mask++){
 const blocked=Array.from({length:7},(_,i)=>i).filter(i=>mask&(1<<i));
 const p={...defaultProfile,subject,minutes,blocked,startDate:'2026-10-22'};
 const plan=makePlan(p);assert.equal(plan.days.length,7);assert.equal(new Set(plan.days.map(d=>d.date)).size,7);
 for(const d of plan.days){assert.equal(d.rest,blocked.includes(new Date(d.date+'T12:00:00').getDay()));assert.equal(d.minutes,d.rest?0:minutes);assert.equal(d.tasks.reduce((s,t)=>s+t.minutes,0),d.minutes);assert.ok(d.tasks.every(t=>t.minutes>0&&t.text.length>0));}
 assert.ok(planMarkdown(plan,p).includes('非AI生成'));checked++;
}
const schedule=makePlan({...defaultProfile,startDate:'2026-12-29'}).days.map(d=>d.date);
assert.deepEqual(schedule,['2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03','2027-01-04']);
console.log(`Validated ${checked} subject/budget/calendar combinations and year boundary.`);
