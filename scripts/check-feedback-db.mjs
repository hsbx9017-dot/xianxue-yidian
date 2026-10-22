import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Isolated test runtime: npm install --prefix outputs/feedback-tests --ignore-scripts @electric-sql/pglite
const {PGlite}=await import('../outputs/feedback-tests/node_modules/@electric-sql/pglite/dist/index.js');
const db=new PGlite();
try{
 await db.exec('create role anon; create role authenticated; create role service_role;');
 await db.exec(readFileSync(new URL('../feedback-service/schema.sql',import.meta.url),'utf8'));
 const payload={submissionId:'00000000-0000-4000-8000-000000000001',rating:'有帮助',stuck:'太笼统',wish:'更具体',mode:'rules'};
 await db.exec('set role anon;');
 const submit=async p=>(await db.query('select public.submit_feedback($1::jsonb) as result',[JSON.stringify(p)])).rows[0].result;
 const receipt=await submit(payload);assert.equal(receipt.ok,true);assert.equal(receipt.id,payload.submissionId);assert.ok(!Number.isNaN(Date.parse(receipt.receivedAt)));
 assert.deepEqual(await submit(payload),receipt);
 await assert.rejects(()=>submit({...payload,wish:'changed'}),/submission conflict/);
 await assert.rejects(()=>submit({...payload,apiKey:'private'}),/invalid feedback/);
 await assert.rejects(()=>submit({...payload,mode:'invented'}),/invalid content/);
 await assert.rejects(()=>submit({...payload,stuck:'',wish:'',rating:''}),/invalid content/);
 await assert.rejects(()=>submit({...payload,wish:'sk-'+'x'.repeat(30)}),/invalid content/);
 await assert.rejects(()=>db.query('select * from feedback_private.feedback'),/permission denied/);
 await assert.rejects(()=>db.query('select public.admin_feedback_list()'),/permission denied/);
 await assert.rejects(()=>db.query('select public.admin_feedback_mark($1,true)',[payload.submissionId]),/permission denied/);
 await db.exec('reset role; set role authenticated;');
 await assert.rejects(()=>db.query('select public.admin_feedback_list()'),/permission denied/);
 await db.exec('reset role; set role service_role;');
 const list=(await db.query('select public.admin_feedback_list() as items')).rows[0].items;
 assert.equal(list.length,1);assert.equal(list[0].wish,payload.wish);
 assert.equal((await db.query('select public.admin_feedback_mark($1,true) as ok',[payload.submissionId])).rows[0].ok,true);
 assert.equal((await db.query('select public.admin_feedback_list() as items')).rows[0].items[0].processed,true);
 const cursor=(await db.query('select public.admin_feedback_list($1,$2) as items',[list[0].created_at,list[0].submission_id])).rows[0].items;
 assert.deepEqual(cursor,[]);
 await db.exec('reset role;');assert.equal((await db.query('select count(*) as n from feedback_private.feedback')).rows[0].n,1);
 console.log('PostgreSQL permission checks passed: anon submit/retry, invalid and secret data rejected, anon/authenticated read denied, service-role list/mark, stable pagination. Isolated database only.');
}finally{await db.close()}
