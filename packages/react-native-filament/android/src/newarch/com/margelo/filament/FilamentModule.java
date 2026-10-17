package com.margelo.filament;

import com.facebook.react.bridge.ReactApplicationContext;

public class FilamentModule extends NativeFilamentModuleSpec {
    private final FilamentModuleImpl impl;

    public FilamentModule(ReactApplicationContext reactContext) {
        super(reactContext);
        impl = new FilamentModuleImpl(reactContext);
    }

    @Override
    public boolean install() {
        return impl.install();
    }
}
