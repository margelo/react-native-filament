package com.margelo.filament;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.util.AttributeSet;

import android.util.Log;
import android.view.Surface;
import android.view.TextureView;
import android.widget.FrameLayout;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/** @noinspection JavaJniMissingFunction*/
public class FilamentView extends FrameLayout implements TextureView.SurfaceTextureListener {

  private static final String TAG = "FilamentView";

  /** @noinspection unused, FieldCanBeLocal */
  @DoNotStrip
  @Keep
  private final HybridData mHybridData;
  private final TextureView textureView;
  private final SurfaceProvider surfaceProvider = new SurfaceProvider();
  private Surface surface = null;
  private boolean isMounted = false;

  public FilamentView(Context context) {
    super(context);
    textureView = new TextureView(context);
    mHybridData = initHybrid(surfaceProvider);
    setupView();
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    textureView = new TextureView(context);
    mHybridData = initHybrid(surfaceProvider);
    setupView();
  }

  public FilamentView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    textureView = new TextureView(context);
    mHybridData = initHybrid(surfaceProvider);
    setupView();
  }

  private void setupView() {
    // Disable overflow
    textureView.setClipToOutline(true);
    textureView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    textureView.setSurfaceTextureListener(this);
    textureView.setOpaque(false);
    addView(textureView);
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (!isMounted) {
      isMounted = true;
      onViewReady();
    }
  }

  private void onViewReady() {
    int surfaceId = UIManagerHelper.getSurfaceId(this);
    FilamentViewReadyEvent event = new FilamentViewReadyEvent(surfaceId, getId());
    this.sendEvent(event);
  }

  private void sendEvent(Event<?> event) {
    ReactContext reactContext = (ReactContext) getContext();
    EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, getId());
    if (dispatcher != null) {
      dispatcher.dispatchEvent(event);
    }
  }

  @Override
  public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surfaceTexture, int width, int height) {
    surface = new Surface(surfaceTexture);
    surfaceProvider.onSurfaceCreated(surface);
  }

  @Override
  public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surfaceTexture, int width, int height) {
    if (surface == null) {
      throw new RuntimeException("Surface cannot be null! Was the Surface even created?");
    }
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