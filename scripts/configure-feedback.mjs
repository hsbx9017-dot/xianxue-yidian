import {readFileSync,writeFileSync} from 'node:fs';
const keys=JSON.parse(readFileSync('outputs/supabase-keys.local.json','utf8').replace(/^\uFEFF/,''));
const pub=keys.find(k=>k.type==='publishable')?.api_key,secret=keys.find(k=>k.type==='secret')?.api_key;
if(!pub?.startsWith('sb_publishable_')||!secret?.startsWith('sb_secret_'))throw Error('Expected separate public and private project keys.');
const url='https://mkptzcsmemrhzqvrysbi.supabase.co';
writeFileSync('feedback-admin.local.json',JSON.stringify({url,secretKey:secret},null,2)+'\n',{mode:0o600});
writeFileSync('lib/feedback-config.ts','// Public submission credentials only. Administrator credentials stay in feedback-admin.local.json.\nexport const feedbackConfig:{url:string;publishableKey:string}='+JSON.stringify({url,publishableKey:pub})+';\n');
console.log('Configured public submission endpoint and separate local-only administrator credentials. No secrets printed.');
