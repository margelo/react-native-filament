package com.margelo.filament;

import android.view.View;

import androidx.annotation.Nullable;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.FilamentViewManagerDelegate;
import com.facebook.react.viewmanagers.FilamentViewManagerInterface;

public abstract class FilamentViewManagerSpec<T extends View> extends SimpleViewManager<T> implements FilamentViewManagerInterface<T> {
  private final ViewManagerDelegate<T> mDelegate;

  public FilamentViewManagerSpec() {
    mDelegate = new FilamentViewManagerDelegate(this);
  }

  @Nullable
  @Override
  protected ViewManagerDelegate<T> getDelegate() {
    return mDelegate;
  }
}
