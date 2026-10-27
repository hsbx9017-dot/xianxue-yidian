export type Subject = 'english' | 'math' | 'python' | 'other';
export type Profile = { route: 'clear' | 'explore'; subject: Subject; goal: string; level: 'start' | 'some' | 'practice'; motivation: string; minutes: number; blocked: number[]; obstacle: string; notes: string; startDate: string; mathBook?:string; mathUnit?:'unknown'|'limits'|'derivative'|'integral'|'custom'; chapter?:string; englishSkill?:'reading'|'listening'|'speaking'; material?:string; pythonDevice?:'computer'|'browser'|'phone'; durationWeeks?:number; targetDate?:string; programStart?:string; weekIndex?:number; weeklyFocus?:string; lastReview?:string };
export type Day = { id: number; date: string; weekday: string; minutes: number; focus: string; tasks: { text: string; minutes: number }[]; done: boolean; rest: boolean; completedSteps?:number[] };
export type DailyLog={date:string;status:'done'|'partial'|'missed'|'rest';completedSteps:number[];actualMinutes:number|null;difficulty:'unknown'|'easy'|'okay'|'hard';blocker:string;note:string;affirmation:string;insight:string;nextStep:string;recordedAt:string;nextDay?:Day;previousNextDay?:Day;appliedAt?:string};
export type Resource={title:string;url?:string;role:string;how:string;access:string;checkedAt?:string};
export type Plan = { title: string; summary: string; why: string; days: Day[]; tradeoff: string; source: 'demo' | 'deepseek'; createdAt: string; resources?:Resource[]; preparation?:string[]; materialSummary?:string; checkpoints?:string[];dailyLogs?:DailyLog[] };
export const subjectNames: Record<Subject, string> = { english: '英语', math: '高等数学', python:'Python', other: '我的学习目标' };
export const mathUnits={unknown:'还没确定范围',limits:'极限与连续',derivative:'导数与微分',integral:'一元积分',custom:'其他章节（自己填写）'};
export const defaultProfile: Profile = { route: 'clear', subject: 'english', goal: '', level: 'some', motivation: 'steady', minutes: 25, blocked: [], obstacle: 'start', notes: '', startDate: '',mathBook:'',mathUnit:'unknown',chapter:'',englishSkill:'reading',material:'',pythonDevice:'computer' };
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !Number.isNaN(d.valueOf())&&localDate(d)===s}
export function addDays(s:string,n:number){const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d)}
export function periodEnd(p:Profile){return p.targetDate||addDays(p.programStart||p.startDate,(p.durationWeeks||1)*7-1)}
export function programWeeks(p:Profile){return Math.max(1,Math.ceil(((Date.parse(periodEnd(p)+'T12:00:00Z')-Date.parse((p.programStart||p.startDate)+'T12:00:00Z'))/86400000+1)/7))}
export function roadmap(p:Profile){
 const weeks=programWeeks(p),focus=p.weeklyFocus?.trim()||p.chapter?.trim()||p.goal.trim()||subjectNames[p.subject];
 return Array.from({length:weeks},(_,i)=>{const ratio=(i+1)/weeks;return {week:i+1,start:addDays(p.programStart||p.startDate,i*7),end:[addDays(p.programStart||p.startDate,i*7+6),periodEnd(p)].sort()[0],title:i===0?'确认起点，跑通一个学习循环':i===weeks-1?'独立检查，整理成果和下一步':ratio<=.45?'巩固基础，处理反复出现的卡点':ratio<=.8?'迁移应用，做小成果':'复习和独立检验',result:i===0?`围绕“${focus}”留下第一份练习记录`:i===weeks-1?'用独立完成的题目、表达或程序对照目标，不只看打卡数':'本周复盘后确定具体范围和一份可检查的成果'};});
}
const topics = {
 english: [ ['先知道从哪开始','从现有教材或常用文章选一小段，标记不认识的词','查懂最影响理解的3个词，回到原句读一遍','用自己的话说出这段主要讲什么'], ['让词汇有上下文','回看昨天的3个词，不看释义尝试回忆','读一小段同难度材料，选3个常见表达造句','留下最想再次使用的一句'], ['听懂一小段就好','选有原文的短音频，先完整听一次','对照文本听最难的一两句，再不看文本听','记录听不懂的原因：词、连读还是语速'], ['把学过的用出来','回忆前三天一个有用表达','用3—5句话描述今天，允许查词','选一句录音或写下，检查是否表达清楚'], ['练习真正需要的内容','选一段与自己目标有关的课文或资料','尝试独立理解，再查证关键表达','记下一个已经能独立完成的动作'], ['解决一处卡点','回看前几天的记录，选最常遇到的一个问题','用一个更简单的例子针对练习','比较练习前后的区别，不追求一次全会'], ['看看这一周留下了什么','不看笔记复述本周学到的表达','重做第一天的一小段任务，比较变化','保留有效做法，删掉一项不适合自己的安排'] ],
 math: [ ['先找到一个具体卡点','打开自己的教材或作业，选一道最近不会的题','标出题目已知量、要求和不懂的概念','只补一个相关定义，尝试说出第一步'], ['看懂一道，再独立做一道','回看昨天卡住的概念和一道例题','合上例题，独立写出同类题的关键步骤','对照答案，记录第一个不同的步骤'], ['把公式和条件连起来','选本周课程的一个公式，写出适用条件','做一道基础题，逐步说明为什么能用它','检查是否遗漏定义域、条件或运算步骤'], ['把错误缩小到一步','挑一道做错的题，先不看完整解答','定位是概念、方法选择还是计算错误','只改这一处，再重做关键步骤'], ['开始一点迁移','选一道与例题略有不同的题','先列可能方法，再选一种尝试','卡住时只看一条提示，再自己往下做'], ['留出补漏空间','回看本周仍不清楚的一个问题','用教材、课程资料或老师的解答核对','独立写一份能看懂的简短解题过程'], ['用一次小检查结束这周','选两道本周接触过的基础题独立尝试','对照自己的记录，找出能独立完成的部分','确定下一周优先补的一个概念'] ],
 other: [ ['把目标缩成一件能做的事','选一份已经有的材料，明确这周想完成什么','找一个最简单的例子，跟着做一次','保存结果，写下一个具体疑问'], ['沿着昨天的入口继续','回看上次结果和疑问','用一个小练习验证一个概念','记录自己完成了什么'], ['自己试一次','选一个类似的小任务','先独立尝试，再查资料核对','记下需要帮助的一步'], ['处理一处卡点','从前面的记录选一个反复遇到的问题','只补与这个问题直接相关的基础','用例子确认自己能解释'], ['做出一个小成果','明确今天要留下的一个结果','集中完成核心部分，其他想法暂记下来','保存能回看的版本'], ['留时间补漏','检查这一周尚未做完的一件小事','缩小范围后完成，或明确暂缓','写下这项取舍的原因'], ['决定下一小步','回看本周留下的材料和成果','选一个能独立完成的动作再试一次','保留有效做法，调整不现实的安排'] ]
};
export function makePlan(p: Profile): Plan {
 const start = /^\d{4}-\d{2}-\d{2}$/.test(p.startDate) ? new Date(p.startDate+'T12:00:00') : new Date();
 const budget = Math.max(5, Math.min(90, Math.round(p.minutes)));
 const selectedTopics=detailedTopics(p);
 let session = 0;
 const days: Day[] = Array.from({length:7},(_,id)=>{
  const date=new Date(start); date.setDate(start.getDate()+id);
  const outside=!!p.targetDate&&localDate(date)>p.targetDate;
  const rest=outside||p.blocked.includes(date.getDay());
  const topic=selectedTopics[Math.min(session,6)];
  if(!rest)session++;
  const a=Math.max(1,Math.round(budget*.2)), b=Math.max(1,Math.round(budget*.6));
  return {id,date:localDate(date),weekday:['周日','周一','周二','周三','周四','周五','周六'][date.getDay()], minutes:rest?0:budget,focus:outside?'目标周期之外 · 不安排任务':rest?'留白日 · 不安排任务':topic[0],tasks:rest?[]:[{text:topic[1],minutes:a},{text:topic[2],minutes:b},{text:topic[3],minutes:budget-a-b}],done:false,rest};
 });
 return { title:(p.goal.trim()||`${subjectNames[p.subject]}，先开始一周`)+((p.weekIndex||0)>0?` · 第${(p.weekIndex||0)+1}周`:``), summary:`这周安排 ${session} 次学习，每次最多 ${budget} 分钟。${p.subject==='python'?'先做出能运行的小程序，不要求一周学完整门课。':'每次留下可核对的结果，做不完就缩小范围。'}`, why:`按你给出的时间上限安排，保留 ${7-session} 天空白。${p.level==='start'?'从简单例子开始。':'先独立尝试，再查资料。'}${p.subject==='math'?'规则版按你选择的知识范围安排；自填章节不会被自动理解，教材题号由你核对。':p.subject==='python'?'规则版是 Python 入门起步路径；已有基础者可使用 AI 按具体目标重排。':p.subject==='english'?'A1/A2 只是试学起点，不是对你水平的评定；过易或过难可调整。':''}`, days, tradeoff:`${session<5?'可用次数较少，先完成一个小循环。':((p.weekIndex||0)>0?'本周根据复盘继续推进，不自动加量。':'这是第一周试行安排。')}准备材料、安装和排错也占当天时间；到点就停，把卡点记下来，下一次接着做。规则版不保证完成整章、整门课程或考试目标。`,...learningMaterials(p),source:'demo',createdAt:new Date().toISOString() };
}
export function planMarkdown(plan:Plan,p:Profile){return `# ${plan.title}\n\n${plan.summary}\n\n生成方式：${plan.source==='deepseek'?'DeepSeek':'规则体验版（非AI生成）'}\n\n## 目标周期与进度\n${p.programStart||p.startDate} → ${periodEnd(p)}；当前第${(p.weekIndex||0)+1}周。\n${p.weeklyFocus?`本周重点：${p.weeklyFocus}\n`:''}${p.lastReview?`上周复盘：${p.lastReview}\n`:''}\n${roadmap(p).map(w=>`- 第${w.week}周（${w.start}—${w.end}）：${w.title}；${w.result}`).join('\n')}\n\n## 材料与起点\n${plan.materialSummary||'原计划未记录材料，可修改情况后重新生成。'}\n\n${(plan.preparation||[]).map(s=>'- '+s).join('\n')}\n\n${(plan.resources||[]).map(r=>`### ${r.title}\n${r.role}\n${r.url?`入口：${r.url}\n`:''}用法：${r.how}\n访问说明：${r.access}${r.checkedAt?`\n来源核对：${r.checkedAt}`:''}`).join('\n\n')}\n\n## 为什么这样安排\n${plan.why}\n\n${plan.days.map(d=>`## ${d.date} ${d.weekday} · ${d.minutes}分钟\n${d.focus}\n${d.tasks.map((t,i)=>`- ${['准备','动手','检查'][i]}：${t.text}（${t.minutes}分钟）`).join('\n')}`).join('\n\n')}\n\n## 本周怎样算有进展\n${(plan.checkpoints||[]).map(s=>'- '+s).join('\n')}\n\n## 取舍与边界\n${plan.tradeoff}\n\n个人补充：${p.notes||'无'}\n`}

const checkedAt='2026-10-22';
export function learningMaterials(p:Profile):Pick<Plan,'resources'|'preparation'|'materialSummary'|'checkpoints'>{
 const chosen=(p.material||'').trim();
 const base=['先收藏本页的主材料，准备一个笔记文件。第一次找材料、安装、登录和排错都算在当天时间内。','网页打不开时，用自己已有的同类教材或音频继续；不要把本次学习时间都花在换工具上。'];
 if(p.subject==='math')return {
  materialSummary:`教材：${p.mathBook?.trim()||'尚未确认，请查看封面和版权页'}；范围：${mathUnits[p.mathUnit||'unknown']}${p.chapter?.trim()?` · ${p.chapter.trim()}`:''}。${!p.mathBook?'网站不会替你默认成同济某一版。':''}`,
  preparation:[...base,'确认书名、作者、版次、上/下册和老师进度。目录相似也不代表页码、例题或题号相同。',...(p.mathUnit==='unknown'||!p.mathUnit?['范围尚未确认：先按定位步骤找出一节；本周不自动替你选成“极限”。']:[]),...(p.mathUnit==='custom'?['自填章节以你的教材为准；规则版只给解题流程，AI 模式才能进一步理解具体章节。']:[])],
  resources:[{title:p.mathBook?.trim()||'你当前使用的高数教材',role:'主材料 · 跟随本校教学',how:`找到${p.chapter?.trim()||mathUnits[p.mathUnit||'unknown']}对应小节，抄下1道例题和1道同类题的题号；没有可靠题号时不编造页码。`,access:'优先用已有教材或图书馆，不要求买新书。'},...(p.mathUnit==='limits'||p.mathUnit==='derivative'?[{title:'同济大学 · 高等数学（一）',url:'https://www.icourse163.org/course/TONGJI-53004',role:'辅助课程 · 极限、连续、导数与微分',how:'在课程目录中找本次卡点对应的小节，只看相关片段后回到题目。不能把课程进度当作你的教材页码。',access:'平台可能需要登录；当期开课、可看内容与证书费用以课程页为准。',checkedAt}]:[{title:'同济大学 · 高等数学同步课堂',url:'https://gaoshutongbu.tongji.edu.cn/xtxj/2.htm',role:'辅助核对 · 按知识点找习题选解',how:'按标题寻找所学知识点，优先核对同类题的第一处差异，不一次抄完解答。',access:'学校公开网页；题目与本校教材是否对应，需自行核对。',checkedAt}])],
  checkpoints:['留下教材版本、小节名称和实际做过的题号。','至少一次合上解答，独立写出解题的第一步；检查条件和计算。','仍做不出时，记录卡在定义、方法选择还是计算，作为下一周的起点。']};
 if(p.subject==='python')return {
  materialSummary:`Python 3 入门；${p.pythonDevice==='phone'?'安卓手机使用免费开源 Termux + Python':p.pythonDevice==='browser'?'先用浏览器运行小例子':'电脑优先使用 Thonny'}。${chosen?`已有课程：${chosen}，优先沿用；下方课程仅作备选。`:'中文主课选北京理工大学《Python语言程序设计》，本周只学与练习有关的小节。'}`,
  preparation:[...base,p.pythonDevice==='phone'?'安装本页Termux，在终端输入 pkg install python，确认安装后输入 python，看到 >>> 再输入 print(2+3)。看到5就跑通了；首次安装算进当天时间，后续不重复安装。':p.pythonDevice==='browser'?'打开 Python Tutor，选择 Python 3，先试运行 print(2+3)。只放练习代码，不上传密码或私人文件。':'从 Thonny 官网选择与你的系统匹配的安装包；打开后在 Shell 输入 print(2+3)，看到5再继续。安装受阻时改用 Python Tutor；不要求同时装多套软件。','课程只用来补当天卡点，不要求一周刷完9周课程；完成代码比看完视频更重要。'],
  resources:[{title:chosen||'北京理工大学 · Python语言程序设计',...(chosen?{}:{url:'https://www.icourse163.org/course/BIT-268001'}),role:chosen?'已有主材料 · 不强迫换课':'主课程 · 中文零基础入门',how:'按当天主题找“基本语法、变量、分支、循环”相关内容，看一个小片段就暂停，自己敲代码验证。',access:chosen?'沿用已有材料；网站不验证自填课程内容。':'平台可能需要登录；开课、可看内容与证书费用以页面为准。',...(chosen?{}:{checkedAt})},{title:p.pythonDevice==='phone'?'Termux + Python':p.pythonDevice==='browser'?'Python Tutor':'Thonny',url:p.pythonDevice==='phone'?'https://f-droid.org/en/packages/com.termux/':p.pythonDevice==='browser'?'https://pythontutor.com/visualize.html':'https://thonny.org/',role:'运行工具 · 二选一即可',how:p.pythonDevice==='phone'?'打开Termux，输入python进入 >>>；输入当天短代码。多行循环最后按空行执行；输入exit()退出。下次沿用已装好的环境，代码与输出复制到笔记。':p.pythonDevice==='browser'?'选择 Python 3，输入短代码，点击 Visualize Execution，再点 Next 观察变量变化；本周代码不依赖 input()。':'新建文件，保存为 week1.py；在编辑区输入代码，点 Run 运行，在 Shell 核对输出。',access:p.pythonDevice==='phone'?'免费开源安卓软件；首次安装Python需要网络，基础代码之后可离线运行。':p.pythonDevice==='browser'?'网页可视化有广告，功能和限制以页面为准。':'免费开源桌面软件，按官网说明选择系统安装包。',checkedAt},{title:'Python 官方中文教程',url:'https://docs.python.org/zh-cn/3/tutorial/introduction.html',role:'辅助查阅 · 不是零基础主课',how:'已学过某个概念但忘记写法时，查找“数字、字符串、列表”的例子，只验证一个例子。',access:'公开文档；零基础先配合入门课程，不要求通读。',checkedAt}],
  checkpoints:['保存能运行的 week1.py，或把浏览器里的练习代码复制到本地笔记。','修改输入数据后仍能解释输出；不是只照抄一次代码。','本周小成果：用固定分钟数计算一周学习时长；5分钟档只要求完成其中一个小动作。']};
 if(p.subject==='english'){
  const listening=p.englishSkill==='listening'||p.englishSkill==='speaking',level=p.level==='start'?'a1':'a2';
  return {materialSummary:`优先练${p.englishSkill==='speaking'?'跟读与表达':listening?'听力':'阅读'}；${chosen?`主材料：${chosen}，沿用你已有的材料。`:`试学从 LearnEnglish ${level.toUpperCase()} ${listening?'listening':'reading'} 开始；这不是水平测评。`}`,
   preparation:[...base,'先试一小段：几乎每句都不懂就降到A1；基本无需查词就换更高一级或自己的目标材料。一次只换一个难度。',listening?'准备耳机或扬声器，手机自带录音可用于回听；不要求购买背词或口语软件。':'浏览器加词典即可，准备“原句—词义—自己造句”三栏笔记，不要求另买背词软件。'],
   resources:[{title:chosen||`British Council LearnEnglish · ${level.toUpperCase()} ${listening?'听力':'阅读'}`,...(chosen?{}:{url:`https://learnenglish.britishcouncil.org/free-resources/${listening?'listening':'reading'}/${level}`}),role:chosen?'已有主材料 · 优先沿用':'主练习 · 从一篇或一段开始',how:listening?'选一课，先听一遍抓主题，再展开 Transcript 核对；按时间只做Task 1中的一部分。':'选一课，先读正文抓主题，再做Task 1中的几题；查词后回原句核对，不先逐句翻译全文。',access:chosen?'自填材料的访问条件由你核对。':'公开练习页面；评论需账号，付费课程不属于本计划要求。',...(chosen?{}:{checkedAt})},{title:'Cambridge 英汉双解词典',url:'https://dictionary.cambridge.org/dictionary/english-chinese-simplified/',role:'辅助工具 · 查义、例句和发音',how:'只查影响理解的1—3个词，结合当前原句选词义；听发音后回读原句，再写自己的例句。',access:'网页词典；不要求购买应用或订阅。',checkedAt}],
   checkpoints:['留下材料标题、完成的题数和答对题数，作为自己的对照。','不看笔记能复述主旨或说出一个自己造的句子。','一周末重做同一小段，比较理解和所需帮助，不据此推断考试分数。']};
 }
 return {materialSummary:chosen?`沿用材料：${chosen}`:'其他目标：材料待你确认，规则版不会随意推荐不相关课程。',preparation:[...base,'补充目标、已有材料及一个想完成的成果；AI 模式可据此继续细化。'],resources:chosen?[{title:chosen,role:'你已有的主材料',how:'定位一个例子，独立复现后保存结果；有疑问只补相关知识点。',access:'自填内容尚未由本站核实。'}]:[],checkpoints:['留下一个能展示或复现的成果，并写下仍需帮助的一步。']};
}

function detailedTopics(p:Profile):string[][]{
 if((p.weekIndex||0)>0){
  const focus=p.weeklyFocus?.trim()||p.chapter?.trim()||'上周仍未独立完成的部分';
  if(p.subject==='python'&&/for|循环/i.test(focus))return [
   ['接着卡点练循环','打开上次运行工具，先预测range(3)会产生几个数字','输入 for i in range(3):，下一行缩进写 print(i)；运行后把3改成2再试','第一次应输出0、1、2，第二次0、1；写下range末端为什么没有包含进去'],
   ['起点和终点','先预测range(1,4)会输出什么','运行 for n in range(1,4):，下一行缩进写 print(n)','核对1、2、3；改成range(2,5)再预测与核对'],
   ['循环里的计算','先手算1²、2²、3²','运行 for n in range(1,4):，下一行缩进写 print(n*n)','核对1、4、9；记录循环变量在每次执行时的值'],
   ['只改一处排错','打开上次循环，检查冒号和缩进位置','把print语句放到循环体内运行，再去掉缩进运行，比较结果','体内逐次输出，体外只在循环后执行一次；保存两个版本并注明差别'],
   ['让循环做真实小任务','准备打印第1天到第3天的学习提示','运行 for day in range(1,4):，下一行缩进写 print("学习日",day)','应出现学习日1到3；把4改成6，先预测再运行'],
   ['盖住例子独立做','遮住旧代码，目标是打印2、3、4','独立写一个for循环实现；卡住只查range起止的用法','核对恰好三次输出；记录自己是否仍需要查例子'],
   ['用新数据检查掌握程度','先不用笔记，写出打印1到4的循环','改成打印每个数的两倍，运行前先写下预计输出','核对2、4、6、8；仍不稳就继续练循环，不添加额外知识']
  ];
  const action=p.subject==='python'?`打开上周已保存的代码，另存为week${(p.weekIndex||0)+1}.py；改1个数值或字符串，先预测输出再运行核对`:p.subject==='math'?'从所选教材范围取1道基础题，记录真实题号，独立写出方法与第一步':'从已有主材料选未做过的一课；读1小段或听1小段，只查1—3个关键表达，再做1—3道理解题并核对原文';
  return [
   [`第${(p.weekIndex||0)+1}周 · 接着上次的卡点`,`回看上周复盘，打开已有材料，定位“${focus}”`,action,'保存今天的结果，注明独立完成和仍需帮助的部分；不把旧完成标记带到新周'],
   ['巩固一个动作',`回看昨天的结果，选“${focus}”中最不稳的一步`,action,'对照可信答案、原文或运行输出，只记录第一处差异'],
   ['换个例子再试',`围绕“${focus}”换一道同类题、一段材料或一组数据`,action,'写出哪些步骤可以沿用，哪些条件发生了变化'],
   ['有针对性地补漏','从前三次记录选一个反复出现的卡点','回到教材定义、课程对应小节或原文，只补这一处；时间短就只核对一句或一步','不用整段照抄解答，自己写一份能理解的修正记录'],
   ['做出本周的小成果',`把“${focus}”缩成今天能独立完成的一小块`,action,'保存题解、短文或程序；未完成也注明停在哪一步'],
   ['独立检验一次','遮住本周笔记，先写下自己的思路',action,'比较本周初次结果和现在需要的帮助，不以重复记住答案代替掌握'],
   ['复盘，决定再前进一步','打开本周留下的结果和完成记录','写下一个已会的动作、一个卡点、下周真实可用时间','在“复盘并安排下一周”中填写结果；仍不稳就继续巩固，不自动升级难度']
  ];
 }
 if(p.subject==='python'&&p.minutes<=10)return [
  ['先跑通一行','打开本页运行工具，不同时安装其他软件','输入并运行 print(2+3)；工具未就绪就先只完成打开工具','核对输出5，复制这一行到笔记；到点停止安装或排错'],
  ['让文字出现在屏幕上','打开上次工具和笔记','输入并运行 print("今天先学一点")，再换成自己的短句','核对屏幕文字和引号内相同，保存这一行'],
  ['保存一个数值','打开笔记，先口算15乘3','运行 minutes=15，再运行 print(minutes*3)','核对输出45；写下minutes此时保存的数值'],
  ['换一个值再试','重新输入 minutes=10','先猜结果，再运行 print(minutes*4)','核对40；若仍为旧值，检查是否先运行了赋值这一行'],
  ['列表放三个数','先手算10、15、20的和','运行 minutes=[10,15,20]，再运行 print(sum(minutes))','核对45，把两行代码和结果留在笔记'],
  ['改数据，观察程序','打开昨天的两行代码','把列表改成[20,20,20]，再运行相同的求和语句','核对60；说出为什么程序没改、结果会变'],
  ['不看笔记重做一次','盖住旧代码，先想好两个分钟数','独立写列表并打印总和；忘记时只查对应一行','保存自己的例子，记下仍需查的写法；下周继续，不要求学完整门课']
 ];
 if(p.subject==='python')return [
  ['运行第一行代码','打开本页推荐的运行工具，输入 print(2+3)，准备与预计结果5比较','再运行 print("今天先学一点")；改引号里的文字，重新运行一次','保存或复制代码；用一句话解释为什么文字要加引号。打不开工具就记下错误，不超时安装'],
  ['变量：让程序替你算','在上次代码后写 minutes=15 和 days=3，先口算总分钟数','运行 print(minutes*days)，再把days改为4，比较两次结果','核对结果应为45和60；记录变量名、数值和输出的对应关系'],
  ['分支：让程序作选择','先读课程中if条件的相关例子；在编辑器写 minutes=10','输入 if minutes>=15: 后缩进写 print("标准任务")；再写else:并缩进写 print("轻量任务")','分别将minutes设为10和20测试，核对两条分支；报错先检查冒号与缩进'],
  ['循环：重复一件小事','查看for和range的一个例子，先预测range(3)会产生几个值','运行 for i in range(3): 并在下一行缩进写 print(i+1)，再把3改成2','核对第一次输出1、2、3，第二次输出1、2；用一句话说明为什么加1'],
  ['列表：汇总真实数据','输入 minutes=[10,15,20]，先手算三次学习总时长','运行 print(sum(minutes))；再给列表加一个5，重新运行','核对两次为45和50；把数字换成自己的记录，保存结果'],
  ['组合成一个小成果','在已有文件整理 minutes=[10,15,20] 和 total=sum(minutes)','加 print(total)；再写if total>=60分支，分别输出“够一小时”或“还没一小时”','把列表改成[20,20,20]测试边界；程序无报错、结果合理就保存，不额外加界面'],
  ['独立重做，再决定下一步','先不看旧代码，写一个列表保存三次学习分钟数','独立打印总时长；卡住只查对应写法，再用另一组数字测试','对照旧文件，记下能独立完成和仍需查阅的部分；下周只补最常见的一处卡点']
 ];
 if(p.subject==='math'){
  const unit=p.mathUnit||'unknown';
  if(unit==='unknown'||unit==='custom')return topics.math.map((row,i)=>i===0?['先确认教材和范围',`查看教材封面与版权页，记录${p.mathBook||'书名、作者、版次与册别'}`,`打开目录和最近作业，定位${p.chapter||'老师正在讲的一小节'}；抄下1道例题和1道基础题的实际题号`,'写下具体卡住的定义或步骤；范围确认前不凭空指定页码和习题号']:row.map(s=>s.replace('本周课程',p.chapter?.trim()||'选定小节')));
  const examples=unit==='limits'?[
   ['代入与约分','求 x→1 时 (x²−1)/(x−1) 的极限','先因式分解再约去x−1；写明约分针对x≠1','结果应为2；解释“函数在1没定义”和“极限存在”为什么不矛盾'],
   ['同一方法换一道题','求 x→2 时 (x²−4)/(x−2) 的极限','合上昨天解答，独立写出因式分解、约分和代入三步','结果应为4；用一句话写出直接代入为什么会卡住'],
   ['比较左右极限','分别求 x→0+ 和 x→0− 时 |x|/x 的极限','按x的正负去掉绝对值，再比较左右两边','右极限1，左极限−1，所以双侧极限不存在；不要只代入0'],
   ['有理化的入口','求 x→0 时 (√(1+x)−1)/x 的极限','分子分母同乘√(1+x)+1，化简后再代入','结果应为1/2；检查开方范围和x≠0的条件']
  ]:unit==='derivative'?[
   ['求导先看函数结构','给 f(x)=x³−2x 求导','分别使用幂函数求导和差的求导法则，写出每一步','核对 f′(x)=3x²−2，再算f′(1)=1'],
   ['链式法则','给 f(x)=(2x+1)³ 求导','先标出外层立方和内层2x+1，再把两层导数相乘','核对 f′(x)=6(2x+1)²；检查有没有漏乘内层导数2'],
   ['乘积法则','给 f(x)=x·sin x 求导','用两项之和写出乘积求导，不把两个导数直接相乘','核对 f′(x)=sin x+x cos x；分别说明两项来自哪里'],
   ['导数与切线','求 y=x² 在x=1处的切线','先算点(1,1)和斜率2，再写点斜式方程','核对 y=2x−1；代回x=1检查切点']
  ]:[
   ['原函数和积分常数','求 ∫2x dx','找一个导数为2x的函数，再写出整个原函数族','核对 x²+C；把结果求导检查，不能漏写C'],
   ['换一个基本积分','求 ∫cos x dx','先回忆sin x的导数，写出不定积分结果','核对 sin x+C；求导后应回到cos x'],
   ['定积分要代上下限','求 ∫₀¹2x dx','先取原函数x²，再按F(1)−F(0)计算','核对结果1；区分定积分的数值和不定积分的函数族'],
   ['换元看内层导数','求 ∫2x·cos(x²) dx','令u=x²，写du=2x dx，再对cos u积分','核对 sin(x²)+C；用链式法则求导检查']
  ];
  return Array.from({length:7},(_,i)=>i<4?[examples[i][0],`打开${p.mathBook||'你的教材'}中“${p.chapter?.trim()||mathUnits[unit]}”相关定义；先尝试：${examples[i][1]}`,examples[i][2],examples[i][3]]:i===4?['迁移到自己的作业','从同一小节选一道老师布置的基础题，记录实际题号','先写已知条件和准备使用的方法，再独立尝试；时间短只做第一步','对照教材或课堂答案，只标出第一处差异并说明原因']:i===5?['只补最常错的一步','回看前几次记录，挑一处概念或计算错误','只重做对应步骤，再换一个简单数字检验；不额外刷整套题','保存一份“原错误—正确步骤—为什么”的三行记录']:['合上答案做小检查','从本周做过的题中选一道，盖住旧解答','独立重做；5分钟档只写方法和第一步，不硬凑完整套题','核对条件、步骤和结果，写下下周唯一优先补的知识点']);
 }
 if(p.subject==='english'){
  const tiny=p.minutes<=10,qty=tiny?'1':'3',part=tiny?'1句':'一小段',listen=p.englishSkill==='listening'||p.englishSkill==='speaking';
  const material=p.material?.trim()||`本页 LearnEnglish ${p.level==='start'?'A1':'A2'} ${listen?'听力':'阅读'}主材料`;
  return [
   ['定位材料并完成一次小练习',`打开${material}，选一课，记下标题；${listen?'先听一遍抓主题':'先读标题和'+part+'，猜主题'}`,`${listen?'对照Transcript回听最难的'+part:'不查词读'+part+'，圈出影响理解的词'}；用词典只查${qty}个关键表达`,`做Task 1中的${qty}题或自问${qty}个理解问题，记录答对数与一句中文主旨`],
   ['在原句里记住表达',`回到昨天的材料，遮住释义回忆${qty}个表达`,`用这些表达各写一个自己的句子；${tiny?'先写一句即可':'写完回原句核对词义和搭配'}`,'保留“原句—自己的句子—需要改的一处”；拿不准的句子标待核对，不当作已掌握'],
   ['复听或复读，观察变化',`打开同一课的${listen?'音频和Transcript':'正文'}，不先看昨天笔记`,`${listen?'先听'+part+'再核对原文':'重新读'+part+'后合上网页，用自己的话复述'}；对照上次卡点找一处变化`,'记下哪一句仍听不出或读不懂；没有改善就降低难度，不加倍任务'],
   ['把材料变成自己的表达','从同一课选一个你可能用上的句型',`替换其中的人物、时间或地点，写${tiny?'1':'2—3'}句；${p.englishSkill==='speaking'?'用手机录音读一遍':'读出声一次'}`,'回听或回读，检查是否能表达自己原本的意思，保留一个待核对问题'],
   ['换一段，检查能否迁移',`在${material}选另一篇同难度短材料，记下新标题`,`先不查词完成${tiny?'1':'2'}道理解问题，再回原文找支持答案的句子`,'记录题数、正确数和依据句；没有练习题时自己写一问一答'],
   ['解决一个反复卡点','从记录中选一个最常见问题：词义、句子结构或连读','用词典例句或音频原文只核对这一处，再用自己的句子试一次','写下“之前怎么理解—现在怎么理解”，仍不确定就标记待问'],
   ['重做第一天的小任务','打开第一天同一课，盖住笔记和旧答案',`重新完成当时那${qty}题并复述主旨；不把记住答案等同于能力提升`,'比较需要查词或看文本的次数，保留有效做法；决定下周继续还是调难度']
  ];
 }
 return topics.other;
}
