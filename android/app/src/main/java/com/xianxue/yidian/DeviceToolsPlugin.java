package com.xianxue.yidian;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.AlarmClock;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "DeviceTools")
public class DeviceToolsPlugin extends Plugin {
    private static final Set<String> ALLOWED_APPS = new HashSet<>(Arrays.asList(
        "com.ichi2.anki", "org.geogebra.android.calculator.suite", "com.termux"
    ));

    @PluginMethod
    public void diagnostics(PluginCall call) {
        NotificationManager notifications = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        PowerManager power = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        SharedPreferences prefs = getContext().getSharedPreferences("xianxue_notification_diagnostics", Context.MODE_PRIVATE);
        JSObject result = new JSObject();
        result.put("brand", Build.BRAND);
        result.put("androidVersion", Build.VERSION.RELEASE);
        result.put("notificationsEnabled", notifications.areNotificationsEnabled());
        NotificationChannel channel = Build.VERSION.SDK_INT >= 26 ? notifications.getNotificationChannel("daily-study") : null;
        result.put("channelEnabled", channel == null || channel.getImportance() != NotificationManager.IMPORTANCE_NONE);
        result.put("batteryExempt", power.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        result.put("powerSave", power.isPowerSaveMode());
        result.put("dailyPostedAt", prefs.getLong("dailyPostedAt", 0));
        result.put("testPostedAt", prefs.getLong("testPostedAt", 0));
        call.resolve(result);
    }

    private boolean launch(Intent intent) {
        try { getActivity().startActivity(intent); return true; }
        catch (ActivityNotFoundException | SecurityException error) { return false; }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        String page = call.getString("page", "app");
        Intent intent;
        if ("notifications".equals(page)) {
            if (Build.VERSION.SDK_INT >= 26) {
                intent = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
                    .putExtra(Settings.EXTRA_CHANNEL_ID, "daily-study");
            } else { intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName())); }
        } else if ("autostart".equals(page)) {
            intent = new Intent().setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
        } else if ("battery".equals(page)) {
            intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        } else if ("app".equals(page)) {
            intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
        } else { call.reject("不支持的设置入口"); return; }
        boolean opened = launch(intent);
        if (!opened) opened = launch(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName())));
        if (!opened) { call.reject("无法直接打开，请从手机设置中找到先学一点"); return; }
        call.resolve();
    }

    @PluginMethod
    public void openClock(PluginCall call) {
        String time = call.getString("time", "08:00");
        if (!time.matches("(?:[01]\\d|2[0-3]):[0-5]\\d")) { call.reject("提醒时间无效"); return; }
        String[] parts = time.split(":");
        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
            .putExtra(AlarmClock.EXTRA_HOUR, Integer.parseInt(parts[0]))
            .putExtra(AlarmClock.EXTRA_MINUTES, Integer.parseInt(parts[1]))
            .putExtra(AlarmClock.EXTRA_MESSAGE, "先学一点：先开始两分钟")
            .putExtra(AlarmClock.EXTRA_SKIP_UI, false)
            .putIntegerArrayListExtra(AlarmClock.EXTRA_DAYS, new ArrayList<>(Arrays.asList(1,2,3,4,5,6,7)));
        if (!launch(intent)) { call.reject("没有找到支持的时钟应用，请手动设置每天重复的闹钟"); return; }
        call.resolve();
    }

    @PluginMethod
    public void openLearningApp(PluginCall call) {
        String id = call.getString("packageId", "");
        if (!ALLOWED_APPS.contains(id)) { call.reject("不支持的软件"); return; }
        Intent intent = getContext().getPackageManager().getLaunchIntentForPackage(id);
        if (intent == null || !launch(intent)) { call.reject("没有找到这个软件。请先用官方入口安装，再回来点打开。"); return; }
        call.resolve();
    }
}
