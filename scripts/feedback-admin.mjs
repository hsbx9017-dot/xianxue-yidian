import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,dirname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function createAdminServer({config,staticRoot=resolve(projectRoot,'docs'),rpc:injectedRpc}={}){
 const session=randomBytes(32).toString('hex');
 const configured=!!(config?.url&&config?.secretKey);
 if(configured&&(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url)||(!config.secretKey.startsWith('sb_secret_')&&!config.secretKey.startsWith('eyJ'))))throw new Error('本地管理员配置无效。');
 const rpc=injectedRpc||async function(name,args){
  if(!configured)throw new Error('not configured');
  const headers={'Content-Type':'application/json',apikey:config.secretKey};
  if(config.secretKey.startsWith('eyJ'))headers.Authorization='Bearer '+config.secretKey;
  const response=await fetch(new URL('/rest/v1/rpc/'+name,config.url),{method:'POST',headers,body:JSON.stringify(args),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('upstream failed');return response.json();
 };
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json;charset=utf-8'});res.end(JSON.stringify(value))};
 const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  const port=server.address()?.port,host=req.headers.host;
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(host))return json(res,403,{error:'本地访问地址无效。'});
  const origin='http://'+host;
  if((req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'请直接打开本地管理页面。'});
  let url;try{url=new URL(req.url,origin)}catch{return json(res,400,{error:'地址无效。'})}
  const path=url.pathname;
  const validSession=(req.headers.cookie||'').split(';').some(s=>s.trim()==='xianxue_admin='+session);
  if(path.startsWith('/__admin/api/')){
   if(!validSession)return json(res,401,{error:'请重新打开本地管理页面。'});
   if(!configured)return json(res,503,{error:'反馈服务尚未配置，本地管理凭据未就绪。'});
   try{
    if(path==='/__admin/api/feedback'&&req.method==='GET'){
     const time=url.searchParams.get('beforeTime'),id=url.searchParams.get('beforeId');
     if(!!time!==!!id||(time&&Number.isNaN(Date.parse(time)))||(id&&!/^[a-f0-9-]{36}$/.test(id)))return json(res,400,{error:'分页参数无效。'});
     const rows=await rpc('admin_feedback_list',{before_time:time,before_id:id});
     if(!Array.isArray(rows))throw new Error('invalid upstream');return json(res,200,{rows});
    }
    if(path==='/__admin/api/mark'&&req.method==='POST'){
     if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'请求格式无效。'});
     let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1024)return json(res,413,{error:'请求过大。'})}
     let body;try{body=JSON.parse(raw)}catch{return json(res,400,{error:'请求格式无效。'})}
     if(!/^[a-f0-9-]{36}$/.test(body.id)||typeof body.processed!=='boolean')return json(res,400,{error:'反馈参数无效。'});
     const ok=await rpc('admin_feedback_mark',{item_id:body.id,done:body.processed});
     return json(res,ok===true?200:404,{ok:ok===true});
    }
    return json(res,404,{error:'接口不存在。'});
   }catch{return json(res,502,{error:'无法读取或保存云端反馈，请检查服务和本地管理员配置。'})}
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'方法不支持。'});
  if(path==='/__admin/status')return json(res,200,{localAdmin:true,configured});
  let target;
  if(path==='/__admin'||path==='/__admin/'){
   res.setHeader('Set-Cookie','xianxue_admin='+session+'; HttpOnly; SameSite=Strict; Path=/');
   res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
   target=resolve(projectRoot,'feedback-admin/index.html');
  }else if(path==='/__admin/app.js'||path==='/__admin/style.css'){
   target=resolve(projectRoot,'feedback-admin',path.endsWith('.js')?'app.js':'style.css');
  }else{
   let decoded;try{decoded=decodeURIComponent(path)}catch{return json(res,400,{error:'地址无效。'})}
   target=resolve(staticRoot,'.'+(decoded==='/'?'/index.html':decoded));
   if(!target.startsWith(resolve(staticRoot)+sep))return json(res,403,{error:'访问被拒绝。'});
  }
  try{
   if(!(await stat(target)).isFile())return json(res,404,{error:'文件不存在。'});
   const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
   res.setHeader('Content-Type',mime[extname(target)]||'application/octet-stream');
   res.end(req.method==='HEAD'?undefined:await readFile(target));
  }catch{json(res,404,{error:'页面尚未构建，请先运行 npm run build 和 npm run pages:prepare。'})}
 });return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let config;try{config=JSON.parse(await readFile(resolve(projectRoot,'feedback-admin.local.json'),'utf8'))}catch{}
 const server=createAdminServer({config});
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'4318端口已被占用，请使用已打开的本地页面。':'本地管理服务启动失败。');process.exitCode=1});
 server.listen(4318,'127.0.0.1',()=>console.log('本地管理：http://127.0.0.1:4318/__admin'+(config?'':'（等待接收服务配置）')));
}
