package com.margelo.filament;

import androidx.annotation.Nullable;

import android.content.Context;
import android.util.AttributeSet;

import android.view.SurfaceView;
import android.view.View;

public class FilamentView extends SurfaceView {
  private final SurfaceProvider surfaceProvider;

  public FilamentView(Context context) {
    super(context);
    surfaceProvider = new SurfaceProvider(getHolder());
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    surfaceProvider = new SurfaceProvider(getHolder());
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    surfaceProvider = new SurfaceProvider(getHolder());
  }

  public SurfaceProvider getSurfaceProvider() {
    return surfaceProvider;
  }
}
