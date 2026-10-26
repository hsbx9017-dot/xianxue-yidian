import {useState} from 'react';
import {localDate,type Plan,type Profile,type Day,type DailyLog} from '../lib/planner';
import {applyNextDay,checkedSteps,executionGuide,recordDay,stepNames} from '../lib/daily';

export function DailyCards({plan,profile,onChange,onEdit}:{plan:Plan;profile:Profile;onChange:(p:Plan)=>void;onEdit:(d:Day)=>void}){
 return <div className="day-list">{plan.days.map(d=><DailyCard key={d.date} day={d} plan={plan} profile={profile} onChange={onChange} onEdit={()=>onEdit(d)}/>)}</div>;
}

function DailyCard({day:d,plan,profile,onChange,onEdit}:{day:Day;plan:Plan;profile:Profile;onChange:(p:Plan)=>void;onEdit:()=>void}){
 const [reviewing,setReviewing]=useState(false),[starter,setStarter]=useState(false),[error,setError]=useState('');
 const [completed,setCompleted]=useState<number[]>([]),[actual,setActual]=useState(''),[difficulty,setDifficulty]=useState<DailyLog['difficulty']>('unknown'),[blocker,setBlocker]=useState(''),[note,setNote]=useState('');
 const today=localDate(),future=d.date>today,guide=executionGuide(d,profile),log=plan.dailyLogs?.find(r=>r.date===d.date);
 const progress=checkedSteps(d),proposalChanges=!!log?.nextDay&&!!log.previousNextDay&&JSON.stringify([log.nextDay.focus,log.nextDay.minutes,log.nextDay.tasks])!==JSON.stringify([log.previousNextDay.focus,log.previousNextDay.minutes,log.previousNextDay.tasks]);
 function startReview(){setCompleted(checkedSteps(d));setActual(log?.actualMinutes==null?'':String(log.actualMinutes));setDifficulty(log?.difficulty||'unknown');setBlocker(log?.blocker||'');setNote(log?.note||'');setError('');setReviewing(true)}
 function toggleTask(i:number){const next=progress.includes(i)?progress.filter(n=>n!==i):[...progress,i].sort();onChange({...plan,days:plan.days.map(day=>day.id===d.id?{...day,completedSteps:next,done:false}:day)})}
 function submit(e:React.FormEvent){e.preventDefault();try{onChange(recordDay(plan,profile,d.id,{completedSteps:completed,actualMinutes:actual.trim()===''?null:Number(actual),difficulty,blocker,note}));setReviewing(false);setError('')}catch(e){setError(e instanceof Error?e.message:'记录失败，请重试。')}}
 return <article className={`day-card coach-day ${d.rest?'rest-day':''} ${d.done?'day-done':''}`} id={`study-day-${d.date}`}>
  <div className="day-date"><span>DAY {String(d.id+1).padStart(2,'0')}</span><strong>{d.weekday}</strong><small>{d.date.slice(5).replace('-',' / ')}</small>{d.date===today&&<b className="today-badge">今天</b>}</div>
  <div className="day-content"><div className="day-title"><h3>{d.focus}</h3><span className="minutes">{d.rest?'留白':`${d.minutes} 分钟`}</span></div>
   {d.rest?<p>今天不安排学习，不补交任务，也不因为休息扣分。愿意的话可以留一句状态。</p>:<>
    <button className="button starter-button" onClick={()=>setStarter(!starter)} aria-expanded={starter}>{starter?'收起启动动作':'先做两分钟，帮我开始 →'}</button>
    {starter&&<div className="starter-cue"><strong>现在只做这一件事</strong><p>{guide.starter}</p><small>这是启动入口，不另外增加当天任务和时间。</small></div>}
    <div className="day-resource-links">{plan.resources?.filter(r=>r.url).slice(0,3).map(r=><a key={r.title} href={r.url} target="_blank" rel="noreferrer">{r.role.includes('运行')?'运行工具':r.role.includes('主')?'主材料':'辅助材料'}：{r.title} ↗</a>)}</div>
    <div className="execution-stages">{d.tasks.map((t,i)=><section className="execution-stage" key={i}><div className="stage-heading"><label><input type="checkbox" checked={progress.includes(i)} disabled={future} onChange={()=>toggleTask(i)}/><strong>第 {i+1} 步 · {stepNames[i]}</strong></label><span>{t.minutes} 分钟</span></div><p className="stage-task">{t.text}</p><details><summary>具体怎么操作</summary><ol>{guide.steps[i].map(s=><li key={s}>{s}</li>)}</ol></details></section>)}</div>
    <p className="day-deliverable"><b>今天留下：</b>{guide.deliverable}</p>
    <details className="rescue-guide"><summary>卡住或不想做了，怎么办？</summary><p>{guide.rescue}</p><p>步骤还不清楚：在“调整这天”里写清你的材料和范围，或用自己的 DeepSeek 密钥协商细化；不需要为了打卡强行完成。</p></details>
   </>}
   <div className="day-controls"><button className="button primary" disabled={future} onClick={startReview}>{future?'到这一天再记录':log?'补充/修改这一天的反馈':d.rest?'记录休息日状态':'今天结束，给我反馈'}</button><button className="edit-link" onClick={onEdit}>调整这天</button></div>
   {reviewing&&<form className="daily-review-form" onSubmit={submit}><h4>用几十秒，把真实情况留下</h4>{!d.rest&&<><fieldset><legend>只勾实际完成的步骤</legend><div className="review-step-checks">{stepNames.map((name,i)=><label key={name}><input type="checkbox" checked={completed.includes(i)} onChange={()=>setCompleted(v=>v.includes(i)?v.filter(n=>n!==i):[...v,i].sort())}/>{name}</label>)}</div><div className="review-shortcuts"><button type="button" onClick={()=>setCompleted([0,1,2])}>三个步骤都做完了</button><button type="button" onClick={()=>{setCompleted([]);setActual('0')}}>今天没开始</button></div></fieldset><div className="review-fields"><label>实际投入多少分钟？<input type="number" min="0" max="360" step="1" value={actual} onChange={e=>setActual(e.target.value)} placeholder="选填，不填就不推断用时"/></label><label>难度感觉<select value={difficulty} onChange={e=>setDifficulty(e.target.value as DailyLog['difficulty'])}><option value="unknown">暂不评价</option><option value="easy">比较轻松</option><option value="okay">刚好合适</option><option value="hard">有些吃力</option></select></label></div><label>哪一步让你停下来？<input value={blocker} maxLength={500} onChange={e=>setBlocker(e.target.value)} placeholder="选填，例如：没找到材料、第一行报错、今天很累"/></label></>}
    <label>{d.rest?'今天的状态':'留下今天的结果或一句话'}<textarea value={note} rows={2} maxLength={1000} onChange={e=>setNote(e.target.value)} placeholder={d.rest?'选填，休息也可以没有记录':'选填，例如做过的题号、代码输出、自己写的英语句子'}/></label><div className="daily-form-actions"><button className="button primary" type="submit">保存并查看反馈</button><button type="button" className="button secondary" onClick={()=>setReviewing(false)}>暂不记录</button></div>
   </form>}
   {log&&!reviewing&&<section className="daily-feedback" aria-label={`${d.date} 的每日反馈`} aria-live="polite"><span className="eyebrow small">{log.status==='done'?'已完成':log.status==='partial'?'完成一部分':log.status==='rest'?'按计划休息':'今天没开始'} · 已保存在本机</span><h4>先看到你已经做到的</h4><p>{log.affirmation}</p><h4>再处理一个具体问题</h4><p>{log.insight}</p><h4>下一次，怎样更容易执行</h4><p>{log.nextStep}</p>{log.note&&<blockquote>你的记录：{log.note}</blockquote>}{log.nextDay&&<details><summary>查看 {log.nextDay.date} 的建议安排 · {log.nextDay.minutes} 分钟</summary><h5>{log.nextDay.focus}</h5><ol>{log.nextDay.tasks.map((t,i)=><li key={i}>{stepNames[i]}：{t.text}（{t.minutes}分钟）</li>)}</ol></details>}{proposalChanges&&!log.appliedAt&&<button className="button secondary" onClick={()=>{try{onChange(applyNextDay(plan,log.date));setError('')}catch(e){setError(e instanceof Error?e.message:'未能采用建议')}}}>采用这个更轻量的安排</button>}{log.appliedAt&&<p className="adopted-note">已按你的选择调整下一学习日，其他日期保留。</p>}<small>反馈基于你填写的记录，不是能力测评；不调用模型、不产生 API 费用。建议只有点击采用才会修改下一天。</small></section>}
   {error&&<p className="error" role="alert">{error}</p>}
  </div>
 </article>;
}
