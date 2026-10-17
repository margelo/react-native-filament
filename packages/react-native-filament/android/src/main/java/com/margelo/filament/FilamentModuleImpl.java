package com.margelo.filament;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;

public class FilamentModuleImpl {
    static {
        System.loadLibrary("react-native-filament");
    }

    private @Nullable FilamentProxy proxy = null;
    private final ReactApplicationContext context;

    public FilamentModuleImpl(ReactApplicationContext reactContext) {
        context = reactContext;
    }

    public boolean install() {
        try {
            proxy = new FilamentProxy(context);
            FilamentInstaller.install(proxy);
            return true;
        } catch (Throwable cause) {
            throw new RuntimeException("Failed to initialize react-native-filament! Reason: " + cause.getMessage(), cause);
        }
    }

    public void reset() {
        proxy = null;
    }
}
