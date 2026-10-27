import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64');
const {learningApps,softwareFor,softwareMarkdown}=await import(url(readFileSync('lib/learning-apps.ts','utf8')));
assert.equal(new Set(learningApps.map(a=>a.packageId)).size,3);
for(const subject of ['english','math','python']){
 const apps=softwareFor(subject);assert.equal(apps.length,1);
 const a=apps[0];assert.match(a.free,/免费/);assert.ok(a.steps.length>=3);assert.ok(a.result.length>10);assert.equal(new URL(a.download).protocol,'https:');assert.ok(softwareMarkdown(subject).includes(a.download));
}
const {makePlan,defaultProfile}=await import(url(readFileSync('lib/planner.ts','utf8')));
const phone={...defaultProfile,subject:'python',pythonDevice:'phone',startDate:'2026-10-27'};
const plan=makePlan(phone);assert.ok(plan.materialSummary.includes('Termux'));assert.ok(plan.preparation.some(s=>s.includes('pkg install python')));assert.ok(plan.resources.some(r=>r.title==='Termux + Python'));
assert.ok(!JSON.stringify(plan.resources).includes('thonny.org'));
const {cleanPlan,cleanProfile,emptyWorkspace,saveWeek,exportWorkspace,importWorkspace}=await import(url(readFileSync('lib/history.ts','utf8').replace("'./planner'",JSON.stringify(url(readFileSync('lib/planner.ts','utf8'))))));
assert.equal(cleanProfile(phone).pythonDevice,'phone');assert.deepEqual(cleanPlan(plan),plan);
const saved=saveWeek(emptyWorkspace(),plan,phone,null,null);assert.equal(importWorkspace(exportWorkspace(saved)).journeys[0].profile.pythonDevice,'phone');
assert.ok(readFileSync('android/app/src/main/AndroidManifest.xml','utf8').includes('com.termux'));
console.log('Phone software checks passed: free scoped tools, concrete steps, official entries, mobile Python plan and backup roundtrip.');
