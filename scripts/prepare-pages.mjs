import {cpSync,existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,sep} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const files=['app/learning-app.tsx','app/style.css','app/progress.tsx','app/day-coach.tsx','app/mobile.tsx','app/mobile.css','app/learning-apps.tsx','lib/learning-apps.ts','lib/daily.ts','lib/device.ts','lib/history.ts','lib/planner.ts','lib/ai-plan.ts','lib/feedback.ts','lib/feedback-config.ts','main.tsx','index.html','vite.config.ts','package.json','package-lock.json','tsconfig.json'];
if(!existsSync('dist/index.html'))throw new Error('Run the verified build before preparing Pages.');
mkdirSync('docs',{recursive:true});cpSync('dist','docs',{recursive:true});writeFileSync('docs/.nojekyll','');
// Vite uses content hashes. Retire superseded entry and Capacitor web bundles after copying the new build.
const assetsRoot=resolve('docs/assets'),docsRoot=resolve('docs');
if(!assetsRoot.startsWith(docsRoot+sep))throw new Error('Unexpected assets path.');
if(existsSync(assetsRoot))for(const file of readdirSync(assetsRoot,{withFileTypes:true})){
 if(file.isFile()&&/^(?:index|web)-[A-Za-z0-9_-]+\.(?:js|css)$/.test(file.name)&&!existsSync(join('dist/assets',file.name)))unlinkSync(join(assetsRoot,file.name));
}
const hashes=Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex')]));
writeFileSync('docs/build-manifest.json',JSON.stringify({version:1,sourceHashes:hashes},null,2)+'\n');
console.log('Prepared Pages files and source integrity manifest.');
