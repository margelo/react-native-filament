package com.margelo.filament;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FilamentModule extends ReactContextBaseJavaModule {
    static {
        System.loadLibrary("RNFilament");
    }

    private @Nullable FilamentProxy proxy = null;
    private final ReactApplicationContext context;

    public FilamentModule(ReactApplicationContext reactContext) {
        context = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "FilamentModule";
    }


    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean install() {
        try {
            proxy = new FilamentProxy(context);
            FilamentInstaller.install(proxy);
            return true;
        } catch (Throwable cause) {
            throw new RuntimeException("Failed to initialize react-native-filament! Reason: " + cause.getMessage(), cause);
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        proxy = null;
    }
}
