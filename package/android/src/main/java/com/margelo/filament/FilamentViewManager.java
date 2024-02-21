package com.margelo.filament;

import androidx.annotation.NonNull;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;

@ReactModule(name = FilamentViewManager.NAME)
public class FilamentViewManager extends FilamentViewManagerSpec<FilamentView> {
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
}
