package com.margelo.filament;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FilamentModule extends ReactContextBaseJavaModule {
    private final FilamentModuleImpl filamentModuleImpl;
    public static final String NAME = "FilamentModule";

    public FilamentModule(ReactApplicationContext reactContext) {
        filamentModuleImpl = new FilamentModuleImpl(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "FilamentModule";
    }


    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean install() {
        return filamentModuleImpl.install();
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        filamentModuleImpl.reset();
    }
}
