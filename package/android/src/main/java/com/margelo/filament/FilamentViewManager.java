package com.margelo.filament;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import java.util.Map;

import kotlin.Suppress;

@ReactModule(name = FilamentViewManager.NAME)
public class FilamentViewManager extends ViewGroupManager<FilamentView> {
  static {
    System.loadLibrary("RNFilament");
  }

  public static final String NAME = "FilamentView";

  @Override
  public @NonNull String getName() {
    return NAME;
  }

  @Override
  public @NonNull FilamentView createViewInstance(@NonNull ThemedReactContext context) {
    return new FilamentView(context);
  }

  @Nullable
  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(FilamentViewReadyEvent.EVENT_NAME, MapBuilder.of("registrationName", "onViewReady"));
  }
}
