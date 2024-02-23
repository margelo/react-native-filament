package com.margelo.filament;

import androidx.annotation.Keep;
import androidx.annotation.Nullable;

import android.content.Context;
import android.util.AttributeSet;

import android.view.Choreographer;
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

  public void init() {
    // Support transparent background:
    this.setZOrderOnTop(true);
  }

  public FilamentView(Context context) {
    super(context);
    init();
    mHybridData = initHybrid(new SurfaceProvider(getHolder()));
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    init();
    mHybridData = initHybrid(new SurfaceProvider(getHolder()));
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    init();
    mHybridData = initHybrid(new SurfaceProvider(getHolder()));
  }

  private native HybridData initHybrid(SurfaceProvider surfaceProvider);
}
