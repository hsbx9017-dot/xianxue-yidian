import {useEffect,useState} from 'react';
import {allowExactReminder,apkUrl,disableReminder,enableReminder,isAndroidApp,loadReminder,reminderState,testReminder} from '../lib/device';

export function MobileTools(){
 const native=isAndroidApp(),[time,setTime]=useState(()=>loadReminder().time),[state,setState]=useState<Awaited<ReturnType<typeof reminderState>>|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function refresh(){try{setState(await reminderState())}catch{setError('暂时无法读取手机通知状态，请在 App 中重新打开此面板。')}}
 useEffect(()=>{void refresh();const read=()=>void refresh();window.addEventListener('xianxue-device-resume',read);return()=>window.removeEventListener('xianxue-device-resume',read)},[]);
 async function act(fn:()=>Promise<unknown>,success:string){setBusy(true);setError('');setMessage('');try{await fn();await refresh();setMessage(success)}catch(e){setError(e instanceof Error?e.message:'操作未成功，请重试。')}finally{setBusy(false)}}
 return <details className="mobile-tools wrap" id="mobile-tools"><summary>{native?'安卓 App · 每日提醒与使用说明':'下载到手机 · 安卓 App'}<span>{native&&state?.enabled&&state.pending?`每天 ${state.time}`:'点此设置'}</span></summary>
  <div className="mobile-tools-body">{native?<><h2>把每天的开始，交给一个温和提醒</h2><p>通知由手机本地安排，不上传学习记录，也不依赖网页保持打开。默认按手机时间每天 08:00，可随时修改或关闭。</p><div className="reminder-controls"><label>每天几点提醒<input type="time" value={time} disabled={busy} onChange={e=>setTime(e.target.value)}/></label><button className="button primary" disabled={busy||!time} onClick={()=>void act(()=>enableReminder(time),'已向手机保存每日提醒。请再做一次测试，确认系统没有拦截。')}>{busy?'正在处理…':state?.enabled?'保存/修复每日提醒':'开启每日提醒'}</button><button className="button secondary" disabled={busy} onClick={()=>void act(testReminder,'30秒后会出现一条测试通知。现在按手机Home键回桌面，等它出现，再点通知回来。')}>30秒后测试通知</button><button className="inline-link" disabled={busy} onClick={()=>void act(disableReminder,'每日提醒和测试提醒已取消。')}>关闭提醒</button></div>
   <p className="reminder-status">系统通知权限：{state?.permission==='granted'?'已允许':state?.permission==='denied'?'未允许':'尚未检查/未申请'} · 每日任务：{state?.pending?'已排入手机日程':'未排入日程'}</p>{state?.enabled&&!state.exact&&<div className="notification-note"><p>系统尚未允许“闹钟与提醒”，当前通知可能延迟。需要更准时的 08:00 提醒时，可手动开启此权限，再回来点“保存/修复每日提醒”。</p><button className="button secondary" disabled={busy} onClick={()=>void act(allowExactReminder,'返回后请保存/修复一次每日提醒，并运行30秒测试。')}>打开“闹钟与提醒”设置</button></div>}
   <details><summary>红米收不到通知时，按这几步检查</summary><ol><li>手机设置 → 应用 → 先学一点 → 通知，允许通知；检查“每日学习提醒”分类没有被关闭。</li><li>如果后台测试没有出现，检查系统对本应用的自启动、后台运行和省电策略。MIUI/HyperOS 的具体菜单名称可能不同，可在手机设置中搜索“自启动”或“省电策略”。</li><li>需要准时提醒时，允许本应用的“闹钟与提醒”，回到这里保存时间。</li><li>点“30秒后测试通知”，回桌面等候。强行停止应用、关机或系统拦截时，通知仍可能收不到；重新打开后检查并修复日程。</li></ol></details>
  </>:<><h2>安装后，直接从手机桌面打开</h2><p>这是安卓安装包，不是网页快捷方式。计划、执行步骤、完成记录和每日反馈都能在 App 中查看；AI生成和在线课程需要网络。</p><a className="button primary" href={apkUrl}>下载安卓 App · 1.1.0 ↓</a><ol className="install-steps"><li>在安卓手机上点下载；如果在微信内下载受限，可选择“在浏览器打开”完成这一次下载。</li><li>下载完成后，按手机安装界面提示安装“先学一点”。安装后在桌面点图标使用，无须再从浏览器进入。</li><li>App 中展开“每日提醒”，开启通知并做30秒后台测试，再保存每天08:00。</li></ol></>}
   <details><summary>已有网页计划，怎样带进 App？</summary><ol><li>在原来保存过记录的网页中，进入“学习档案”，导出全部记录（JSON）。</li><li>安装后打开 App → 学习档案 → 导入备份，选择刚才的JSON文件。</li><li>网页和 App 的本机数据分开保存，当前没有云同步。卸载 App 前先导出备份；在 App 导出时，可通过系统窗口保存文件或分享给自己。</li></ol></details>
   {message&&<p className="success-note" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
  </div>
 </details>;
}
