package com.margelo.filament;

import androidx.annotation.Keep;
import androidx.annotation.Nullable;

import android.content.Context;
import android.util.AttributeSet;

import android.view.SurfaceView;
import android.view.View;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** @noinspection JavaJniMissingFunction*/
public class FilamentView extends SurfaceView {
  /** @noinspection unused, FieldCanBeLocal */
  @DoNotStrip
  @Keep
  private final HybridData mHybridData;
  private final SurfaceProvider surfaceProvider;

  public FilamentView(Context context) {
    super(context);
    mHybridData = initHybrid();
    surfaceProvider = new SurfaceProvider(getHolder());
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    mHybridData = initHybrid();
    surfaceProvider = new SurfaceProvider(getHolder());
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    mHybridData = initHybrid();
    surfaceProvider = new SurfaceProvider(getHolder());
  }

  private SurfaceProvider getSurfaceProvider() {
    return surfaceProvider;
  }

  private native HybridData initHybrid();
}
