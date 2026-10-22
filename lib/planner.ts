export type Subject = 'english' | 'math' | 'other';
export type Profile = { route: 'clear' | 'explore'; subject: Subject; goal: string; level: 'start' | 'some' | 'practice'; motivation: string; minutes: number; blocked: number[]; obstacle: string; notes: string; startDate: string };
export type Day = { id: number; date: string; weekday: string; minutes: number; focus: string; tasks: { text: string; minutes: number }[]; done: boolean; rest: boolean };
export type Plan = { title: string; summary: string; why: string; days: Day[]; tradeoff: string; source: 'demo' | 'deepseek'; createdAt: string };
export const subjectNames: Record<Subject, string> = { english: '英语', math: '高等数学', other: '我的学习目标' };
export const defaultProfile: Profile = { route: 'clear', subject: 'english', goal: '', level: 'some', motivation: 'steady', minutes: 25, blocked: [], obstacle: 'start', notes: '', startDate: '' };
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
const topics = {
 english: [ ['先知道从哪开始','从现有教材或常用文章选一小段，标记不认识的词','查懂最影响理解的3个词，回到原句读一遍','用自己的话说出这段主要讲什么'], ['让词汇有上下文','回看昨天的3个词，不看释义尝试回忆','读一小段同难度材料，选3个常见表达造句','留下最想再次使用的一句'], ['听懂一小段就好','选有原文的短音频，先完整听一次','对照文本听最难的一两句，再不看文本听','记录听不懂的原因：词、连读还是语速'], ['把学过的用出来','回忆前三天一个有用表达','用3—5句话描述今天，允许查词','选一句录音或写下，检查是否表达清楚'], ['练习真正需要的内容','选一段与自己目标有关的课文或资料','尝试独立理解，再查证关键表达','记下一个已经能独立完成的动作'], ['解决一处卡点','回看前几天的记录，选最常遇到的一个问题','用一个更简单的例子针对练习','比较练习前后的区别，不追求一次全会'], ['看看这一周留下了什么','不看笔记复述本周学到的表达','重做第一天的一小段任务，比较变化','保留有效做法，删掉一项不适合自己的安排'] ],
 math: [ ['先找到一个具体卡点','打开自己的教材或作业，选一道最近不会的题','标出题目已知量、要求和不懂的概念','只补一个相关定义，尝试说出第一步'], ['看懂一道，再独立做一道','回看昨天卡住的概念和一道例题','合上例题，独立写出同类题的关键步骤','对照答案，记录第一个不同的步骤'], ['把公式和条件连起来','选本周课程的一个公式，写出适用条件','做一道基础题，逐步说明为什么能用它','检查是否遗漏定义域、条件或运算步骤'], ['把错误缩小到一步','挑一道做错的题，先不看完整解答','定位是概念、方法选择还是计算错误','只改这一处，再重做关键步骤'], ['开始一点迁移','选一道与例题略有不同的题','先列可能方法，再选一种尝试','卡住时只看一条提示，再自己往下做'], ['留出补漏空间','回看本周仍不清楚的一个问题','用教材、课程资料或老师的解答核对','独立写一份能看懂的简短解题过程'], ['用一次小检查结束这周','选两道本周接触过的基础题独立尝试','对照自己的记录，找出能独立完成的部分','确定下一周优先补的一个概念'] ],
 other: [ ['把目标缩成一件能做的事','选一份已经有的材料，明确这周想完成什么','找一个最简单的例子，跟着做一次','保存结果，写下一个具体疑问'], ['沿着昨天的入口继续','回看上次结果和疑问','用一个小练习验证一个概念','记录自己完成了什么'], ['自己试一次','选一个类似的小任务','先独立尝试，再查资料核对','记下需要帮助的一步'], ['处理一处卡点','从前面的记录选一个反复遇到的问题','只补与这个问题直接相关的基础','用例子确认自己能解释'], ['做出一个小成果','明确今天要留下的一个结果','集中完成核心部分，其他想法暂记下来','保存能回看的版本'], ['留时间补漏','检查这一周尚未做完的一件小事','缩小范围后完成，或明确暂缓','写下这项取舍的原因'], ['决定下一小步','回看本周留下的材料和成果','选一个能独立完成的动作再试一次','保留有效做法，调整不现实的安排'] ]
};
export function makePlan(p: Profile): Plan {
 const start = /^\d{4}-\d{2}-\d{2}$/.test(p.startDate) ? new Date(p.startDate+'T12:00:00') : new Date();
 const budget = Math.max(5, Math.min(90, Math.round(p.minutes)));
 let session = 0;
 const days: Day[] = Array.from({length:7},(_,id)=>{
  const date=new Date(start); date.setDate(start.getDate()+id);
  const rest=p.blocked.includes(date.getDay());
  const topic=topics[p.subject][Math.min(session,6)];
  if(!rest)session++;
  const a=Math.max(1,Math.round(budget*.2)), b=Math.max(1,Math.round(budget*.6));
  return {id,date:localDate(date),weekday:['周日','周一','周二','周三','周四','周五','周六'][date.getDay()], minutes:rest?0:budget,focus:rest?'留白日 · 不安排任务':topic[0],tasks:rest?[]:[{text:topic[1],minutes:a},{text:topic[2],minutes:b},{text:topic[3],minutes:budget-a-b}],done:false,rest};
 });
 return { title:p.goal.trim()||`${subjectNames[p.subject]}，先开始一周`, summary:`这周安排 ${session} 次学习，每次 ${budget} 分钟。先找到适合自己的节奏，再决定是否加量。`, why:`按你给出的时间上限安排，保留 ${7-session} 天空白。${p.level==='start'?'从现有材料和最简单的例子开始，不预设你已经掌握基础。':'用小练习找到卡点，避免花整周只看资料。'}${p.obstacle==='feedback'?'每次都留下一个能回看的小结果。':''}`, days, tradeoff:session<5?'本周可用次数较少，先完成一个小循环；不承诺覆盖整章或显著提分。':'这是一周试行安排；能否达到考试或长期目标，还需要课程范围和实际完成情况来判断。',source:'demo',createdAt:new Date().toISOString() };
}
export function planMarkdown(plan:Plan,p:Profile){return `# ${plan.title}\n\n${plan.summary}\n\n生成方式：${plan.source==='deepseek'?'DeepSeek':'规则体验版（非AI生成）'}\n\n## 为什么这样安排\n${plan.why}\n\n${plan.days.map(d=>`## ${d.date} ${d.weekday} · ${d.minutes}分钟\n${d.focus}\n${d.tasks.map(t=>`- ${t.text}（${t.minutes}分钟）`).join('\n')}`).join('\n\n')}\n\n## 取舍与边界\n${plan.tradeoff}\n\n个人补充：${p.notes||'无'}\n`}
