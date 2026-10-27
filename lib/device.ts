import {Capacitor,registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
import {LocalNotifications,type LocalNotificationSchema} from '@capacitor/local-notifications';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';

export const isAndroidApp=()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='android';
export const apkUrl='https://hsbx9017-dot.github.io/xianxue-yidian/downloads/xianxue-yidian-1.1.1.apk';
export type DeviceDiagnostics={brand:string;androidVersion:string;notificationsEnabled:boolean;channelEnabled:boolean;batteryExempt:boolean;powerSave:boolean;dailyPostedAt:number;testPostedAt:number};
const DeviceTools=registerPlugin<{diagnostics:()=>Promise<DeviceDiagnostics>;openSettings:(options:{page:string})=>Promise<void>;openClock:(options:{time:string})=>Promise<void>;openLearningApp:(options:{packageId:string})=>Promise<void>}>('DeviceTools');
export const openDeviceSettings=(page:'app'|'notifications'|'battery'|'autostart')=>DeviceTools.openSettings({page});
export const openSystemClock=(time:string)=>DeviceTools.openClock({time});
export async function openLearningApp(packageId:string){if(!isAndroidApp())throw Error('请从手机桌面打开这个软件。');return DeviceTools.openLearningApp({packageId})}
type ScheduleEvidence={enabledAt:number;scheduledAt:number;nextAt:number;missedAt:number;testAt:number;testConfirmedAt:number};
const evidenceKey='xianxue-reminder-evidence-v1';
function evidence():ScheduleEvidence{try{return {enabledAt:0,scheduledAt:0,nextAt:0,missedAt:0,testAt:0,testConfirmedAt:0,...JSON.parse(localStorage.getItem(evidenceKey)||'{}')}}catch{return {enabledAt:0,scheduledAt:0,nextAt:0,missedAt:0,testAt:0,testConfirmedAt:0}}}
export function nextReminderAt(time:string,now=new Date()){const [hour,minute]=time.split(':').map(Number),next=new Date(now);next.setHours(hour,minute,0,0);if(next<=now)next.setDate(next.getDate()+1);return next.getTime()}
export function missedReminderAt(time:string,enabledAt:number,postedAt:number,now=new Date()){const expected=new Date(now),[hour,minute]=time.split(':').map(Number);expected.setHours(hour,minute,0,0);if(expected>now)expected.setDate(expected.getDate()-1);return enabledAt>0&&enabledAt<expected.getTime()&&now.getTime()-expected.getTime()>=15*60000&&postedAt<expected.getTime()?expected.getTime():0}
export function confirmTestSeen(){const next={...evidence(),testConfirmedAt:Date.now()};localStorage.setItem(evidenceKey,JSON.stringify(next))}
export const reminderKey='xianxue-reminder-v1';
export const DAILY_ID=8001,TEST_ID=8099;
export type ReminderSettings={enabled:boolean;time:string};
export function cleanReminder(input:unknown):ReminderSettings{const v=(input&&typeof input==='object'?input:{}) as Record<string,unknown>;return {enabled:v.enabled===true,time:typeof v.time==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.time)?v.time:'08:00'}}
export function loadReminder():ReminderSettings{try{return cleanReminder(JSON.parse(localStorage.getItem(reminderKey)||'{}'))}catch{return {enabled:false,time:'08:00'}}}
export function reminderNotification(time:string,exact:boolean):LocalNotificationSchema{
 if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('请选择有效的提醒时间。');
 const [hour,minute]=time.split(':').map(Number);
 return {id:DAILY_ID,title:'先学一点 · 今天先开始两分钟',body:'打开今天的第一步。做完或没做完，都可以留下记录，再调整下一天。',channelId:'daily-study',smallIcon:'ic_stat_leaf',iconColor:'#3d6952',schedule:{on:{hour,minute,second:0},repeats:true,allowWhileIdle:true},isExactNotification:exact,extra:{open:'today'}};
}
export async function reminderState(){
 const settings=loadReminder();
 if(!isAndroidApp())return {...settings,native:false,permission:'unsupported',exact:false,pending:false,device:null as DeviceDiagnostics|null,evidence:evidence()};
 const [permission,exact,pending,device]=await Promise.all([LocalNotifications.checkPermissions(),LocalNotifications.checkExactNotificationSetting(),LocalNotifications.getPending(),DeviceTools.diagnostics().catch(()=>null)]);
 const record=evidence(),missedAt=settings.enabled&&device?missedReminderAt(settings.time,record.enabledAt,device.dailyPostedAt):0;
 return {...settings,native:true,permission:permission.display,exact:exact.exact_alarm==='granted',pending:pending.notifications.some(n=>n.id===DAILY_ID),device,evidence:{...record,missedAt}};
}
async function permissionAndChannel(){
 if(!isAndroidApp())throw Error('关闭网页后的定时通知请在安卓 App 中开启。');
 let result=await LocalNotifications.checkPermissions();
 if(result.display!=='granted')result=await LocalNotifications.requestPermissions();
 if(result.display!=='granted')throw Error('通知权限没有开启。请到手机设置 → 应用 → 先学一点 → 通知中允许，再回来重试。');
 await LocalNotifications.createChannel({id:'daily-study',name:'每日学习提醒',description:'你自己开启的固定时间学习提醒与测试',importance:4,visibility:0,vibration:true});
 return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm==='granted';
}
export async function enableReminder(time:string){
 if(repair)await repair.catch(()=>{});
 const exact=await permissionAndChannel(),notification=reminderNotification(time,exact);
 await LocalNotifications.cancel({notifications:[{id:DAILY_ID}]});
 await LocalNotifications.schedule({notifications:[notification]});
 try{localStorage.setItem(reminderKey,JSON.stringify({enabled:true,time}));localStorage.setItem(evidenceKey,JSON.stringify({...evidence(),enabledAt:Date.now(),scheduledAt:Date.now(),nextAt:nextReminderAt(time),missedAt:0}))}catch{await LocalNotifications.cancel({notifications:[{id:DAILY_ID}]});localStorage.removeItem(reminderKey);throw Error('无法保存本机提醒设置，未保留定时通知。请检查存储后重试。')}
 const state=await reminderState();
 if(!state.pending)throw Error('手机没有返回已排入日程的通知，请重试并使用测试提醒。');
 return state;
}
export async function disableReminder(){if(repair)await repair.catch(()=>{});const next={enabled:false,time:loadReminder().time};localStorage.setItem(reminderKey,JSON.stringify(next));if(isAndroidApp())await LocalNotifications.cancel({notifications:[{id:DAILY_ID},{id:TEST_ID}]});return reminderState()}
export async function testReminder(){const exact=await permissionAndChannel();await LocalNotifications.cancel({notifications:[{id:TEST_ID}]});await LocalNotifications.schedule({notifications:[{id:TEST_ID,title:'先学一点 · 测试提醒',body:'能看到这条消息，就完成了本次短时通知测试。隔夜提醒还需检查系统设置。',channelId:'daily-study',smallIcon:'ic_stat_leaf',schedule:{at:new Date(Date.now()+30000),allowWhileIdle:true},isExactNotification:exact,extra:{open:'today'}}]});localStorage.setItem(evidenceKey,JSON.stringify({...evidence(),testAt:Date.now()+30000,testConfirmedAt:0}))}
let repair:Promise<void>|null=null;
export function repairReminder(){if(repair)return repair;repair=(async()=>{if(!isAndroidApp())return;const state=await reminderState();if(!state.enabled||state.permission!=='granted'||state.device?.channelEnabled===false)return;await LocalNotifications.cancel({notifications:[{id:DAILY_ID}]});await LocalNotifications.schedule({notifications:[reminderNotification(state.time,state.exact)]});localStorage.setItem(evidenceKey,JSON.stringify({...evidence(),enabledAt:evidence().enabledAt||Date.now(),scheduledAt:Date.now(),nextAt:nextReminderAt(state.time)}))})().finally(()=>{repair=null});return repair}
export async function allowExactReminder(){if(!isAndroidApp())return;await LocalNotifications.changeExactNotificationSetting()}
export async function exportDeviceFile(text:string,name:string){
 if(!isAndroidApp())return false;
 const safe=name.replace(/[\\/:*?"<>|]/g,'_');
 const file=await Filesystem.writeFile({path:'exports/'+safe,data:text,directory:Directory.Cache,encoding:Encoding.UTF8,recursive:true});
 await Share.share({title:'先学一点 · 保存学习记录',files:[file.uri],dialogTitle:'选择保存到文件或分享给自己'});
 return true;
}
export async function initialiseNative(){
 if(!isAndroidApp())return ()=>{};
 const notify=()=>{sessionStorage.setItem('xianxue-open-today','1');window.dispatchEvent(new Event('xianxue-open-today'))};
 const tap=await LocalNotifications.addListener('localNotificationActionPerformed',notify);
 const refresh=()=>{void repairReminder().catch(()=>{}).finally(()=>window.dispatchEvent(new Event('xianxue-device-resume')))};
 refresh();
 const resume=await App.addListener('appStateChange',state=>{if(state.isActive)refresh()});
 const back=await App.addListener('backButton',()=>{const handled=!window.dispatchEvent(new Event('xianxue-back',{cancelable:true}));if(!handled)void App.exitApp()});
 return ()=>{void tap.remove();void resume.remove();void back.remove()};
}
