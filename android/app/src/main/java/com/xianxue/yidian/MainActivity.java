package com.xianxue.yidian;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceToolsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
