import {defaultProfile,localDate,validDate,addDays,type Profile,type Plan,type Day,type DailyLog} from './planner';
export const workspaceKey='xianxue-workspace-v2';
export type Review={learned:string;stuck:string;nextFocus:string;createdAt:string};
export type WeekRecord={id:string;plan:Plan;profile:Profile;review?:Review;updatedAt:string};
export type Journey={id:string;title:string;profile:Profile;weeks:WeekRecord[];activeWeekId:string;createdAt:string};
export type Workspace={version:2;draft:Profile;journeys:Journey[];activeJourneyId:string|null};
const text=(v:unknown,max=2000)=>typeof v==='string'?v.slice(0,max):'';
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
function check(ok:unknown):asserts ok{if(!ok)throw Error('备份格式无效或数据不完整，当前记录没有被覆盖。')}
export function cleanProfile(input:unknown):Profile{
 const v=obj(input),choice=<const T extends readonly string[]>(x:unknown,allowed:T,fallback:T[number]):T[number]=>allowed.includes(x as string)?x as T[number]:fallback;
 const start=validDate(text(v.startDate,10))?text(v.startDate,10):localDate();
 return {...defaultProfile,route:choice(v.route,['clear','explore'],'clear'),subject:choice(v.subject,['english','math','python','other'],'english'),goal:text(v.goal,300),level:choice(v.level,['start','some','practice'],'some'),motivation:text(v.motivation,80)||'steady',minutes:typeof v.minutes==='number'&&Number.isFinite(v.minutes)?Math.max(5,Math.min(90,Math.round(v.minutes))):25,blocked:Array.isArray(v.blocked)?[...new Set(v.blocked.filter((n):n is number=>Number.isInteger(n)&&n>=0&&n<=6))].slice(0,6):[],obstacle:text(v.obstacle,80)||'start',notes:text(v.notes,1500),startDate:start,mathBook:text(v.mathBook,160),mathUnit:choice(v.mathUnit,['unknown','limits','derivative','integral','custom'],'unknown'),chapter:text(v.chapter,180),englishSkill:choice(v.englishSkill,['reading','listening','speaking'],'reading'),material:text(v.material,180),pythonDevice:choice(v.pythonDevice,['computer','browser'],'computer'),durationWeeks:typeof v.durationWeeks==='number'&&Number.isInteger(v.durationWeeks)?Math.max(1,Math.min(52,v.durationWeeks)):1,targetDate:validDate(text(v.targetDate,10))?text(v.targetDate,10):'',programStart:validDate(text(v.programStart,10))?text(v.programStart,10):'',weekIndex:typeof v.weekIndex==='number'&&Number.isInteger(v.weekIndex)?Math.max(0,Math.min(51,v.weekIndex)):0,weeklyFocus:text(v.weeklyFocus,180),lastReview:text(v.lastReview,1500)};
}
const hosts=new Set(['learnenglish.britishcouncil.org','dictionary.cambridge.org','www.icourse163.org','gaoshutongbu.tongji.edu.cn','thonny.org','pythontutor.com','docs.python.org']);
function cleanDay(input:unknown,i:number):Day{
 const d=obj(input);check(d.id===i&&validDate(text(d.date,10))&&typeof d.rest==='boolean'&&typeof d.done==='boolean'&&Array.isArray(d.tasks)&&typeof d.minutes==='number'&&Number.isInteger(d.minutes)&&d.minutes>=0&&d.minutes<=90);
 const tasks=d.tasks.map(x=>{const t=obj(x);check(typeof t.text==='string'&&typeof t.minutes==='number'&&Number.isInteger(t.minutes)&&t.minutes>0);return {text:text(t.text,500),minutes:t.minutes}});
 check(d.rest?d.minutes===0&&tasks.length===0:d.minutes>=5&&tasks.length===3&&tasks.reduce((n,t)=>n+t.minutes,0)===d.minutes);
 let completedSteps:number[]|undefined;
 if(d.completedSteps!==undefined){check(Array.isArray(d.completedSteps)&&d.completedSteps.length<=3&&d.completedSteps.every(n=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<3));completedSteps=[...new Set(d.completedSteps as number[])].sort();check(!d.rest||completedSteps.length===0)}
 return {id:i,date:text(d.date,10),weekday:text(d.weekday,10),minutes:d.minutes,focus:text(d.focus,300),tasks,done:d.done,rest:d.rest,...(completedSteps?{completedSteps}:{})};
}
export function cleanPlan(input:unknown):Plan{
 const v=obj(input);check(typeof v.title==='string'&&Array.isArray(v.days)&&v.days.length===7);
 const days=v.days.map(cleanDay);
 check(days.every((d,i)=>d.date===addDays(days[0].date,i)));
 const strings=(x:unknown)=>Array.isArray(x)?x.slice(0,15).map(s=>text(s,2000)):undefined;
 const resources=Array.isArray(v.resources)?v.resources.slice(0,8).map(x=>{const r=obj(x);let url:string|undefined;if(r.url){const u=new URL(text(r.url,1000));check(u.protocol==='https:'&&hosts.has(u.hostname)&&!u.username&&!u.password);url=u.href}return {title:text(r.title,250),role:text(r.role,250),how:text(r.how,2000),access:text(r.access,1000),...(url?{url}:{}),...(r.checkedAt?{checkedAt:text(r.checkedAt,10)}:{})}}):undefined;
 let dailyLogs:DailyLog[]|undefined;
 if(v.dailyLogs!==undefined){check(Array.isArray(v.dailyLogs)&&v.dailyLogs.length<=7);const seen=new Set<string>();dailyLogs=v.dailyLogs.map(x=>{const r=obj(x),date=text(r.date,10);check(days.some(d=>d.date===date)&&!seen.has(date));seen.add(date);check(['done','partial','missed','rest'].includes(String(r.status))&&['unknown','easy','okay','hard'].includes(String(r.difficulty)));check(Array.isArray(r.completedSteps)&&r.completedSteps.length<=3&&r.completedSteps.every(n=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<3));check(r.actualMinutes===null||(typeof r.actualMinutes==='number'&&Number.isInteger(r.actualMinutes)&&r.actualMinutes>=0&&r.actualMinutes<=360));check(typeof r.affirmation==='string'&&typeof r.insight==='string'&&typeof r.nextStep==='string');let nextDay:Day|undefined,previousNextDay:Day|undefined;if(r.nextDay){const n=obj(r.nextDay);check(Number.isInteger(n.id)&&Number(n.id)>=0&&Number(n.id)<7&&r.previousNextDay);nextDay=cleanDay(n,Number(n.id));previousNextDay=cleanDay(r.previousNextDay,Number(n.id));check(nextDay.date===days[nextDay.id].date&&nextDay.date>date&&!nextDay.rest&&!nextDay.done&&previousNextDay.date===nextDay.date&&!previousNextDay.rest)}return {date,status:r.status as DailyLog['status'],difficulty:r.difficulty as DailyLog['difficulty'],completedSteps:[...new Set(r.completedSteps as number[])].sort(),actualMinutes:r.actualMinutes as number|null,blocker:text(r.blocker,500),note:text(r.note,1000),affirmation:text(r.affirmation,2000),insight:text(r.insight,2000),nextStep:text(r.nextStep,2000),recordedAt:text(r.recordedAt,40),...(nextDay&&previousNextDay?{nextDay,previousNextDay}:{}),...(r.appliedAt?{appliedAt:text(r.appliedAt,40)}:{})}})}
 return {title:text(v.title,400),summary:text(v.summary,5000),why:text(v.why,5000),tradeoff:text(v.tradeoff,5000),source:v.source==='deepseek'?'deepseek':'demo',createdAt:text(v.createdAt,40),days,...(resources?{resources}:{}),...(v.preparation?{preparation:strings(v.preparation)}:{}),...(v.checkpoints?{checkpoints:strings(v.checkpoints)}:{}),...(v.materialSummary?{materialSummary:text(v.materialSummary,2000)}:{}),...(dailyLogs?{dailyLogs}:{})};
}
export function emptyWorkspace():Workspace{return {version:2,draft:cleanProfile({}),journeys:[],activeJourneyId:null}}
export function cleanWorkspace(input:unknown):Workspace{
 const v=obj(input);check(v.version===2&&Array.isArray(v.journeys)&&v.journeys.length<=50&&v.draft&&typeof v.draft==='object');
 const ids=new Set<string>();
 const journeys=v.journeys.map(x=>{const j=obj(x);check(typeof j.id==='string'&&j.id.length>0&&!ids.has(j.id)&&Array.isArray(j.weeks)&&j.weeks.length>0&&j.weeks.length<=200);ids.add(j.id);
  const weekIds=new Set<string>();const weeks=j.weeks.map(x=>{const w=obj(x);check(typeof w.id==='string'&&w.id.length>0&&!weekIds.has(w.id));weekIds.add(w.id);const r=obj(w.review);return {id:w.id,plan:cleanPlan(w.plan),profile:cleanProfile(w.profile),updatedAt:text(w.updatedAt,40),...(w.review?{review:{learned:text(r.learned,800),stuck:text(r.stuck,800),nextFocus:text(r.nextFocus,180),createdAt:text(r.createdAt,40)}}:{})}});
  check(typeof j.activeWeekId==='string'&&weekIds.has(j.activeWeekId));return {id:j.id,title:text(j.title,400),profile:cleanProfile(j.profile),weeks,activeWeekId:j.activeWeekId,createdAt:text(j.createdAt,40)};
 });
 const activeJourneyId=typeof v.activeJourneyId==='string'&&ids.has(v.activeJourneyId)?v.activeJourneyId:null;
 return {version:2,draft:cleanProfile(v.draft),journeys,activeJourneyId};
}
export function loadWorkspace(storage:Pick<Storage,'getItem'>):Workspace{
 const current=storage.getItem(workspaceKey);if(current)return cleanWorkspace(JSON.parse(current));
 const legacy=storage.getItem('xianxue-v1');if(!legacy)return emptyWorkspace();
 const old=obj(JSON.parse(legacy));if(!old.plan||!old.profile)return emptyWorkspace();
 const profile=cleanProfile(old.profile),plan=cleanPlan(old.plan),id='migrated-goal',weekId='migrated-week';
 return {version:2,draft:profile,activeJourneyId:id,journeys:[{id,title:plan.title,profile,createdAt:plan.createdAt,activeWeekId:weekId,weeks:[{id:weekId,plan,profile,updatedAt:plan.createdAt}]}]};
}
export function saveWeek(ws:Workspace,plan:Plan,profile:Profile,journeyId:string|null,weekId:string|null):Workspace{
 const pr=cleanProfile(profile),p=cleanPlan(plan),now=new Date().toISOString();const existing=ws.journeys.find(j=>j.id===journeyId);
 const record:WeekRecord={id:weekId||crypto.randomUUID(),plan:p,profile:pr,updatedAt:now};
 if(!existing){const id=crypto.randomUUID();return {...ws,draft:pr,activeJourneyId:id,journeys:[...ws.journeys,{id,title:p.title,profile:pr,weeks:[record],activeWeekId:record.id,createdAt:now}]}}
 const old=existing.weeks.find(w=>w.id===record.id);if(old?.review)record.review=old.review;
 return {...ws,draft:pr,activeJourneyId:existing.id,journeys:ws.journeys.map(j=>j.id!==existing.id?j:{...j,profile:pr,weeks:old?j.weeks.map(w=>w.id===record.id?record:w):[...j.weeks,record],activeWeekId:record.id})};
}
export function exportWorkspace(ws:Workspace){return JSON.stringify({app:'xianxue-yidian',exportedAt:new Date().toISOString(),workspace:cleanWorkspace(ws)},null,2)}
export function importWorkspace(raw:string):Workspace{check(raw.length<=10_000_000);const v=obj(JSON.parse(raw));check(v.app==='xianxue-yidian');return cleanWorkspace(v.workspace)}
