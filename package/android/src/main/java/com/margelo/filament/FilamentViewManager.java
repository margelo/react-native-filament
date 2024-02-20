package com.margelo.filament;

import android.graphics.Color;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@ReactModule(name = FilamentViewManager.NAME)
public class FilamentViewManager extends FilamentViewManagerSpec<FilamentView> {
  public static final String NAME = "FilamentView";
  private final ReactApplicationContext context;
  private FilamentProxy proxy = null;

  FilamentViewManager(ReactApplicationContext context) {
    this.context = context;
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
  @ReactProp(name = "color")
  public void setColor(FilamentView view, @Nullable String color) {
    view.setBackgroundColor(Color.parseColor(color));
  }

  @Override
  public void initialize() {
    super.initialize();

    if (proxy != null) {
      try {
        System.loadLibrary("RNFilament");
        proxy = new FilamentProxy(context);
        FilamentInstaller.install(proxy);
      } catch (Throwable cause) {
        throw new RuntimeException("Failed to initialize react-native-filament! Reason: " + cause.getMessage(), cause);
      }
    }
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    proxy = null;
  }
}
