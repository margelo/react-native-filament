package com.margelo.filament;

import android.graphics.Color;

import androidx.annotation.Nullable;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@ReactModule(name = FilamentViewManager.NAME)
public class FilamentViewManager extends FilamentViewManagerSpec<FilamentView> {

  public static final String NAME = "FilamentView";

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public FilamentView createViewInstance(ThemedReactContext context) {
    return new FilamentView(context);
  }

  @Override
  @ReactProp(name = "color")
  public void setColor(FilamentView view, @Nullable String color) {
    view.setBackgroundColor(Color.parseColor(color));
  }
}
