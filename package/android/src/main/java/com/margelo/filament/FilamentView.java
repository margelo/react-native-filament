package com.margelo.filament;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.util.AttributeSet;

import android.view.Surface;
import android.view.TextureView;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** @noinspection JavaJniMissingFunction*/
public class FilamentView extends TextureView implements TextureView.SurfaceTextureListener {
  /** @noinspection unused, FieldCanBeLocal */
  @DoNotStrip
  @Keep
  private final HybridData mHybridData;
  private final SurfaceProvider surfaceProvider = new SurfaceProvider();
  private Surface surface = null;

  public FilamentView(Context context) {
    super(context);
    mHybridData = initHybrid(surfaceProvider);
    setupView();
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    mHybridData = initHybrid(surfaceProvider);
    setupView();
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    mHybridData = initHybrid(surfaceProvider);
    setupView();
  }

  private void setupView() {
    // Disable overflow
    this.setClipToOutline(true);
  }

  @Override
  public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surfaceTexture, int width, int height) {
    surface = new Surface(surfaceTexture);
    surfaceProvider.onSurfaceCreated(surface);
  }

  @Override
  public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surfaceTexture, int width, int height) {
    assert surface != null;
    surfaceProvider.onSurfaceChanged(surface, width, height);
  }

  @Override
  public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surfaceTexture) {
    surfaceProvider.onSurfaceDestroyed(surface);
    surface = null;
    return true;
  }

  @Override
  public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surfaceTexture) { }

  private native HybridData initHybrid(SurfaceProvider surfaceProvider);
}
