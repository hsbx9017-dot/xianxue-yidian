package com.xianxue.yidian;

import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import com.capacitorjs.plugins.localnotifications.LocalNotification;
import com.capacitorjs.plugins.localnotifications.LocalNotificationManager;
import com.capacitorjs.plugins.localnotifications.NotificationStorage;
import com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher;
import com.getcapacitor.JSObject;
import java.util.Collections;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowAlarmManager;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class ReminderRepeatTest {
    @Test public void exactDailyRepeatWakesSleepingPhone() throws Exception { verifyRepeat(true, true); }
    @Test public void approximateDailyRepeatAlsoWakesPhone() throws Exception { verifyRepeat(false, true); }
    @Test public void exactNonIdleRepeatRetainsWakeup() throws Exception { verifyRepeat(true, false); }
    @Test public void approximateNonIdleRepeatRetainsWakeup() throws Exception { verifyRepeat(false, false); }

    private void verifyRepeat(boolean exact, boolean idle) throws Exception {
        Context context = RuntimeEnvironment.getApplication();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.createNotificationChannel(new NotificationChannel("daily-study", "Learning", NotificationManager.IMPORTANCE_DEFAULT));
        JSObject json = new JSObject("{\"id\":8001,\"title\":\"Learning\",\"body\":\"Begin\",\"schedule\":{\"on\":{\"hour\":8,\"minute\":0,\"second\":0},\"repeats\":true,\"allowWhileIdle\":"+idle+"},\"isExactNotification\":"+exact+"}");
        LocalNotification stored = LocalNotification.Companion.buildNotificationFromJSObject(json);
        new NotificationStorage(context).appendNotifications(Collections.singletonList(stored));
        Notification notification = new Notification.Builder(context, "daily-study")
            .setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("Learning").build();
        Intent intent = new Intent(context, TimedNotificationPublisher.class)
            .putExtra(LocalNotificationManager.NOTIFICATION_INTENT_KEY, 8001)
            .putExtra(TimedNotificationPublisher.NOTIFICATION_KEY, notification)
            .putExtra(TimedNotificationPublisher.CRON_KEY, "* * * * 8 0 0 11");
        new TimedNotificationPublisher().onReceive(context, intent);
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        ShadowAlarmManager.ScheduledAlarm next = shadowOf(alarms).getNextScheduledAlarm();
        assertNotNull("A daily reminder must re-arm after firing", next);
        assertEquals("Repeat alarms must wake the CPU, not wait for someone to unlock", AlarmManager.RTC_WAKEUP, next.type);
        assertTrue("The next trigger must be in the future", next.triggerAtTime > System.currentTimeMillis());
        assertTrue("Record system-post evidence separately from user confirmation", context.getSharedPreferences("xianxue_notification_diagnostics", Context.MODE_PRIVATE).getLong("dailyPostedAt", 0) > 0);
    }
}
