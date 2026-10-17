package com.margelo.filament;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.FilamentViewManagerDelegate;
import com.facebook.react.viewmanagers.FilamentViewManagerInterface;

import java.util.Map;

@ReactModule(name = FilamentViewManager.NAME)
public class FilamentViewManager extends ViewGroupManager<FilamentView> implements FilamentViewManagerInterface<FilamentView> {
    public static final String NAME = "FilamentView";

    private final FilamentViewManagerDelegate<FilamentView, FilamentViewManager> mDelegate;

    public FilamentViewManager(ReactApplicationContext reactContext) {
        super();
        mDelegate = new FilamentViewManagerDelegate<>(this);
    }

    @Nullable
    @Override
    protected ViewManagerDelegate<FilamentView> getDelegate() {
        return mDelegate;
    }

    @Override
    public @NonNull String getName() {
        return NAME;
    }

    @Override
    public @NonNull FilamentView createViewInstance(@NonNull ThemedReactContext context) {
        return new FilamentView(context);
    }

    @Override
    public void setEnableTransparentRendering(FilamentView view, boolean value) {
        view.setEnableTransparentRendering(value);
    }

    @Override
    public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of(FilamentViewReadyEvent.EVENT_NAME, MapBuilder.of("registrationName", "onViewReady"));
    }
}
