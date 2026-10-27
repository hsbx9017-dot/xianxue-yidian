import {localDate,type DailyLog,type Day,type Plan,type Profile} from './planner';

export type DailyInput={completedSteps:number[];actualMinutes:number|null;difficulty:DailyLog['difficulty'];blocker:string;note:string};
export const stepNames=['准备','动手','检查'];
export function checkedSteps(day:Day){return day.completedSteps??(day.done?[0,1,2]:[])}
export function executionGuide(day:Day,p:Profile){
 const subject=p.subject;
 const starter=subject==='python'?`打开上次的运行工具，只输入或修改今天任务要求的第一行：${day.tasks[1]?.text.slice(0,75)||day.focus}`:
 subject==='math'&&(!p.mathUnit||p.mathUnit==='unknown')?'先拿出教材，抄下封面的书名和版次；这一步做完就算已经开始。':
 subject==='math'?'先拿一张纸，把今天这道题的已知和所求写出来；只试第一步，不要求现在做完。':
 subject==='english'?(p.englishSkill==='reading'||!p.englishSkill?'打开选好的文章或课文，只读第一句；先圈一个影响理解的词。':'打开选好的音频，只听一句；听不清就看这一句原文，再听一次。'):
 '打开今天要用的材料，把动手任务缩成一个能保存的小结果；先做第一笔，不先整理整套工具。';
 const prepare=subject==='python'?[p.pythonDevice==='phone'?'打开已安装的Termux，输入python进入 >>>。尚未装Python才执行一次 pkg install python，不重复安装。':'从本页“运行工具”进入；已有工具可以继续用，不重新安装。','打开上次代码或新建一个练习，按日期保存/复制到笔记；只准备今天要用的内容。']:
 subject==='math'?['按材料清单核对教材版次、册别和当天范围；没确认就先确认，不猜页码题号。','在纸上写日期和题号。只展开今天任务涉及的定义或例题，准备时间也计入当天上限。']:
 subject==='english'?['已有教材优先；否则点本页主材料，选一课并记住标题，下次可以接着用。','阅读先看正文；听力先找到播放按钮和 Transcript。今天只处理任务要求的一小段，不先刷完整课程。']:
 ['打开已选材料，定位今天要做的那个例子或小节。','新建一条带日期的笔记，写下今天最后要留下什么。'];
 const work=subject==='python'?[p.pythonDevice==='phone'?'在 >>> 后输入上方代码并回车，多行代码注意缩进，最后按空行执行；先运行原例再只改一个数值。':'逐行输入上方“动手”里的代码，保持英文标点和缩进；先运行原例，再只改一个数值或一行。','用工具的运行按钮查看输出；Python Tutor 可用 Visualize Execution → Next 观察每一步。不需要一次看完整节视频。']:
 subject==='math'?['先写已知、所求和适用条件，再按上方具体题目独立做；每行只写一个变换。','卡住先看相关定义或例题第一步，盖住答案后自己继续；不要整段抄完当作完成。']:
 subject==='english'?(p.englishSkill==='reading'||!p.englishSkill?['按上方任务读指定小段，先写一句中文主旨，再查最影响理解的1—3个词。','把词放回原句核对，完成要求的少量理解题或自己的例句；词典只是辅助。']:['先不看原文听一遍，写下听到的关键词；再展开 Transcript 核对最难的一句。','将这一句慢速读/听后再正常跟读，按当天任务留一句录音或一句自己的表达。']):
 ['先做上方任务中最小的一部分，边做边保存。','只核对当前卡点需要的一段材料；其他想法暂记下来，不临时扩充任务。'];
 const check=subject==='python'?['把实际输出与上方“检查”要求逐项对照；没有提供预期输出时，写下实际输出和你的解释，不自称通过。','保存代码和输出；报错抄下第一条错误及行号。先检查括号、引号、冒号和缩进，仍不会就记录卡点。']:
 subject==='math'?['对照本题可靠解答，检查条件、定义域和计算；没有答案就注明“尚待核对”。','圈出第一个不同的步骤，保存解题过程，写“我独立做到哪一步”，而不是只写看懂了。']:
 subject==='english'?['回到原文或题目解析核对；记录实际做了几题、哪些还不确定，不虚报正确率。','不看笔记试着说出一句主旨/表达，保存自己的句子或录音；只记真实完成的部分。']:
 ['保存能够回看的结果，再按任务中的标准核对一次。','写下已完成的一部分与仍卡住的一步；没有可靠标准就注明未核对。'];
 return {starter,steps:[prepare,work,check],deliverable:subject==='python'?'一份代码或代码笔记＋实际输出/错误记录':subject==='math'?'题号/自拟题目＋自己写的步骤＋第一处疑问':subject==='english'?'材料标题＋一条自己的表达/录音＋真实核对结果':'一份保存的结果＋一个具体卡点',rescue:'还是不想开始：今天只做上面的两分钟启动动作，然后如实记录“只完成一部分”。材料打不开就沿用已有同类材料；排错也算学习，不把欠下的任务翻倍。'};
}

function steps(values:number[]){return [...new Set(values.filter(n=>Number.isInteger(n)&&n>=0&&n<3))].sort()}
export function recordDay(plan:Plan,p:Profile,id:number,input:DailyInput,today=localDate()):Plan{
 const day=plan.days.find(d=>d.id===id);
 if(!day||day.date>today)throw Error('只能记录今天或过去的日子，不提前打卡。');
 const completed=day.rest?[]:steps(input.completedSteps);
 if(input.actualMinutes!==null&&(!Number.isInteger(input.actualMinutes)||input.actualMinutes<0||input.actualMinutes>360))throw Error('实际学习时长请填0至360的整数，或留空。');
 if(!['unknown','easy','okay','hard'].includes(input.difficulty))throw Error('请选择有效的难度感受。');
 const status:DailyLog['status']=day.rest?'rest':completed.length===3?'done':completed.length>0||(input.actualMinutes??0)>0?'partial':'missed';
 const actual=day.rest?0:input.actualMinutes;
 const affirmation=status==='done'?`你确认完成了今天的3个步骤，已经给这一天留下了实际行动。${actual!==null?`你记录的实际用时是${actual}分钟。`:''}`:
 status==='partial'?`你已经完成了${completed.length}个步骤${actual!==null?`，并记录投入${actual}分钟`:''}。如实留下做到哪里，比补一个“全完成”标记更有用。`:
 status==='rest'?'今天本来就是留白日。按计划休息，不需要额外补任务。':'你愿意把没有开始这件事记录下来，就有机会调整入口；今天不会变成明天的双倍欠账。';
 const insight=status==='rest'?'这一天不计为未完成，也不因此增加明天任务。':input.blocker.trim()?`你提到的具体阻力是：${input.blocker.trim().slice(0,500)}。先处理这一处，不把它概括成“我不行”。`:
 input.difficulty==='hard'?'你反馈任务偏难。下一次先重复最不稳的一步，而不是加一个新知识点。':
 status!=='done'?'这次尚未完成整个学习循环。先缩小任务范围和进入门槛，不自动判断为能力不足。':
 actual!==null&&actual>day.minutes?'实际用时超过了计划。找材料、安装和排错也计入时间；下一次缩小范围更现实。':
 '完成标记只能说明你执行过这些步骤，不能据此断定已经掌握。下一次用自己的结果再核对一次。';
 const next=plan.days.find(d=>d.date>today&&d.date>day.date&&!d.rest&&!d.done&&!(plan.dailyLogs||[]).some(log=>log.date===d.date));
 const light=status!=='rest'&&(status!=='done'||input.difficulty==='hard'||(actual!==null&&actual>day.minutes*1.4));
 let nextDay:Day|undefined;
 if(next){
  const minutes=light?Math.max(5,Math.min(next.minutes,Math.round(day.minutes*.6))):next.minutes;
  const a=Math.max(1,Math.round(minutes*.2)),b=Math.max(1,Math.round(minutes*.6));
  const source=light?day:next;
  nextDay={...next,minutes,focus:light?`先巩固：${day.focus}`:next.focus,done:false,completedSteps:[],tasks:source.tasks.map((task,i)=>({...task,minutes:[a,b,minutes-a-b][i],text:light?`${i===1?'只完成最小的一部分，':i===0?'只准备这一项，':'只核对刚做的部分，'}${task.text}`.slice(0,500):task.text}))};
 }
 const nextStep=nextDay?`${nextDay.date} 的下一个学习日：${light?`先用${nextDay.minutes}分钟巩固今天的内容，暂缓新任务；`:'维持原来的任务量，不因为打卡而自动加量；'}先做两分钟启动动作。采用前可查看具体安排。`:'本周没有尚未安排的后续学习日。到“复盘并安排下一周”中带着这条卡点继续，不自动塞进休息日。';
 const log:DailyLog={date:day.date,status,completedSteps:completed,actualMinutes:actual,difficulty:input.difficulty,blocker:input.blocker.trim().slice(0,500),note:input.note.trim().slice(0,1000),affirmation,insight,nextStep,recordedAt:new Date().toISOString(),...(nextDay&&next?{nextDay,previousNextDay:{...next,tasks:next.tasks.map(t=>({...t}))}}:{})};
 return {...plan,days:plan.days.map(d=>d.id===id?{...d,done:status==='done',completedSteps:completed}:d),dailyLogs:[...(plan.dailyLogs||[]).filter(r=>r.date!==day.date),log].sort((a,b)=>a.date.localeCompare(b.date))};
}

export function applyNextDay(plan:Plan,date:string,today=localDate()):Plan{
 const log=plan.dailyLogs?.find(r=>r.date===date),target=log?.nextDay;
 if(!log||!target||!log.previousNextDay)throw Error('这条反馈没有可采用的下一天安排。');
 const current=plan.days.find(d=>d.date===target.date);
 if(!current||current.rest||current.done||current.date<=today)throw Error('这一天已过去、已完成或是休息日，不能覆盖。');
 const signature=(d:Day)=>JSON.stringify([d.id,d.date,d.minutes,d.focus,d.tasks.map(t=>[t.text,t.minutes]),d.done,d.rest,checkedSteps(d)]);
 if(signature(current)!==signature(log.previousNextDay))throw Error('这一天的计划已被修改。请重新记录反馈后再采用，避免覆盖你的新安排。');
 return {...plan,days:plan.days.map(d=>d.date===target.date?target:d),dailyLogs:plan.dailyLogs!.map(r=>r.date===date?{...r,appliedAt:new Date().toISOString()}:r)};
}

export function retainDailyEvidence(next:Plan,previous:Plan):Plan{
 const dates=new Set(next.days.map(d=>d.date));
 const logs=previous.dailyLogs?.filter(r=>dates.has(r.date));
 const recorded=new Set(logs?.map(r=>r.date));
 return {...next,days:next.days.map(d=>{const old=previous.days.find(p=>p.date===d.date);return old&&(old.done||recorded.has(old.date))?old:d}),...(logs?.length?{dailyLogs:logs}:{})};
}

export function dailyMarkdown(plan:Plan){return (plan.dailyLogs||[]).map(r=>`### ${r.date} · ${r.status==='done'?'已完成':r.status==='partial'?'完成一部分':r.status==='rest'?'按计划休息':'未开始'}\n实际用时：${r.actualMinutes===null?'未填写':r.actualMinutes+'分钟'}\n完成步骤：${r.completedSteps.map(i=>stepNames[i]).join('、')||'无'}\n肯定：${r.affirmation}\n观察：${r.insight}\n下一步：${r.nextStep}\n自己的记录：${r.note||'未填写'}\n下一天建议：${r.appliedAt?'已采用':'尚未采用/无需调整'}`).join('\n\n')}
