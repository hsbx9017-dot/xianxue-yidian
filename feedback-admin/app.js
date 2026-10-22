const $=s=>document.querySelector(s);let rows=[],hasMore=false,busy=false;
function error(s=''){$('#error').textContent=s;$('#error').hidden=!s}
function lock(v){busy=v;$('#refresh').disabled=v;$('#export').disabled=v;$('#more').disabled=v}
async function request(path,options){const r=await fetch('/__admin/api/'+path,{credentials:'same-origin',...options});let data;try{data=await r.json()}catch{throw Error('无法读取反馈，请重新打开本地管理页面。')}if(!r.ok)throw Error(data.error||'操作失败，请稍后重试。');return data}
function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function render(){
 const visible=$('#unprocessed').checked?rows.filter(r=>!r.processed):rows;
 $('#count').textContent=`已加载 ${rows.length} 条 · 未处理 ${rows.filter(r=>!r.processed).length} 条`;
 $('#more').hidden=!hasMore;const list=$('#list');list.replaceChildren();
 if(!visible.length)list.append(element('p',rows.length?'当前没有未处理反馈。':'暂时还没有反馈。','empty'));
 for(const row of visible){
  const card=element('article','','card');const head=element('div','','card-head');
  const time=new Date(row.created_at);head.append(element('strong',row.rating||'未选择评价'),element('span',(Number.isNaN(time.valueOf())?'未知时间':time.toLocaleString('zh-CN'))+' · '+({not_used:'未生成计划',rules:'规则体验',deepseek:'DeepSeek'}[row.mode]||row.mode)));
  card.append(head,element('h3','哪里不顺手'),element('p',row.stuck||'未填写'),element('h3','最希望改什么'),element('p',row.wish||'未填写'));
  const bottom=element('div','','card-bottom');bottom.append(element('small','编号：'+row.submission_id));
  const mark=element('button',row.processed?'恢复为未处理':'标记已处理','secondary');mark.addEventListener('click',async()=>{if(busy)return;lock(true);error();mark.disabled=true;try{await request('mark',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:row.submission_id,processed:!row.processed})});row.processed=!row.processed;render()}catch(e){error(e.message);mark.disabled=false}finally{lock(false)}});bottom.append(mark);card.append(bottom);list.append(card);
 }
}
async function page(reset=false){
 const last=reset?null:rows.at(-1),query=last?'?'+new URLSearchParams({beforeTime:last.created_at,beforeId:last.submission_id}):'';
 const data=await request('feedback'+query);if(!Array.isArray(data.rows))throw Error('反馈格式无效。');
 if(reset)rows=[];const ids=new Set(rows.map(r=>r.submission_id));
 const fresh=data.rows.filter(r=>!ids.has(r.submission_id));if(data.rows.length&&!fresh.length)throw Error('分页未能继续，请刷新后再试。');
 rows.push(...fresh);hasMore=data.rows.length===100;render();
}
async function load(reset){if(busy)return;lock(true);error();try{await page(reset)}catch(e){error(e.message)}finally{lock(false)}}
$('#refresh').addEventListener('click',()=>load(true));$('#more').addEventListener('click',()=>load(false));$('#unprocessed').addEventListener('change',render);
$('#export').addEventListener('click',async()=>{if(busy)return;lock(true);error();try{
 await page(true);while(hasMore)await page();
 const text='# 先学一点 · 体验反馈\n\n导出时间：'+new Date().toLocaleString('zh-CN')+'\n\n'+rows.map(r=>`## ${r.created_at} · ${r.rating||'未选择评价'}\n\n编号：${r.submission_id}\n\n模式：${r.mode} · ${r.processed?'已处理':'未处理'}\n\n哪里不顺手：\n\n${r.stuck||'未填写'}\n\n最希望改什么：\n\n${r.wish||'未填写'}\n\n---\n`).join('\n');
 const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='先学一点_全部反馈.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){error(e.message)}finally{lock(false)}});load(true);
