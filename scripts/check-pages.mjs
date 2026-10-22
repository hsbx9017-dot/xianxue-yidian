import assert from 'node:assert/strict';
import{readFileSync,existsSync}from'node:fs';
import{createHash}from'node:crypto';
const m=JSON.parse(readFileSync('docs/build-manifest.json','utf8'));
const expected=['app/learning-app.tsx','app/style.css','lib/planner.ts','lib/ai-plan.ts','lib/feedback.ts','lib/feedback-config.ts','main.tsx','index.html','vite.config.ts','package.json','package-lock.json','tsconfig.json'];
assert.deepEqual(Object.keys(m.sourceHashes).sort(),expected.sort());
for(const file of expected){const actual=createHash('sha256').update(readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');assert.equal(actual,m.sourceHashes[file],`${file} changed; test, build, then prepare Pages again.`);}
const html=readFileSync('docs/index.html','utf8');assert.ok(html.includes('先学一点'));
for(const hit of html.matchAll(/(?:src|href)="\.\/([^"?#]+)"/g))assert.ok(existsSync('docs/'+hit[1]),'Missing deployed asset: '+hit[1]);
assert.ok(existsSync('docs/.nojekyll'));
console.log('Source fingerprints and all referenced static assets verified.');
