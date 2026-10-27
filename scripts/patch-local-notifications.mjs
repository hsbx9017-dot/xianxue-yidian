import {readFileSync,writeFileSync} from 'node:fs';

// Capacitor Local Notifications 8.3.1 drops wakeup/idle flags on cron repeats.
// Keep this narrow patch version-locked; fail on unexpected upstream changes.
const root='node_modules/@capacitor/local-notifications';
if(JSON.parse(readFileSync(root+'/package.json','utf8')).version!=='8.3.1')throw Error('Review the notification repeat patch before changing plugin version.');
const file=root+'/android/src/main/kotlin/com/capacitorjs/plugins/localnotifications/TimedNotificationPublisher.kt';
let source=readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const old=`        if (wantsExact && canExact) {
            alarmManager.setExact(AlarmManager.RTC, trigger, pendingIntent)
        } else {
            if (wantsExact) {
                Logger.warn("Capacitor/LocalNotification", "Exact alarms not allowed in user settings.  Notification scheduled with non-exact alarm.")
            }
            alarmManager.set(AlarmManager.RTC, trigger, pendingIntent)
        }`;
const patched=`        // XIANXUE_REPEAT_WAKEUP: preserve the original schedule's wakeup/idle behavior.
        val allowIdle = storedNotification?.getJSONObject("schedule")?.optBoolean("allowWhileIdle", false) ?: false
        if (wantsExact && canExact) {
            if (allowIdle) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)
            else alarmManager.setExact(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)
        } else {
            if (allowIdle) alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)
            else alarmManager.set(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)
        }`;
if(!source.includes('XIANXUE_REPEAT_WAKEUP')){
 if(!source.includes(old))throw Error('Upstream notification receiver changed; repeat fix needs review.');
 source=source.replace(old,patched);
}
const publish='        notificationManager.notify(id, notification)';
const diagnostic=`        // XIANXUE_TRIGGER_LOG: local system-post evidence, not proof the person saw it.
        context.getSharedPreferences("xianxue_notification_diagnostics", Context.MODE_PRIVATE).edit()
            .putLong(if (id == 8001) "dailyPostedAt" else "testPostedAt", System.currentTimeMillis()).apply()`;
if(!source.includes('XIANXUE_TRIGGER_LOG')){
 if(!source.includes(publish))throw Error('Notification publishing hook changed.');
 source=source.replace(publish,publish+'\n'+diagnostic);
}
if(!source.includes(patched)||!source.includes(diagnostic))throw Error('Incomplete notification patch.');
writeFileSync(file,source);
console.log('Patched repeat alarms: preserve wakeup/idle flags; keep local system-post diagnostics.');
