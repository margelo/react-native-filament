package com.margelo.filament;

import android.graphics.PixelFormat;
import android.view.Choreographer;
import android.view.SurfaceHolder;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** @noinspection JavaJniMissingFunction*/
public class SurfaceProvider {
    /** @noinspection unused, FieldCanBeLocal */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    SurfaceProvider(SurfaceHolder holder) {
        mHybridData = initHybrid();
        // Support transparent background
        holder.setFormat(PixelFormat.TRANSLUCENT);
        holder.addCallback(new SurfaceHolder.Callback() {
            @Override
            public void surfaceCreated(@NonNull SurfaceHolder surfaceHolder) {
                onSurfaceCreated(surfaceHolder.getSurface());
            }
            @Override
            public void surfaceChanged(@NonNull SurfaceHolder surfaceHolder, int format, int width, int height) {
                onSurfaceChanged(surfaceHolder.getSurface(), width, height);
            }
            @Override
            public void surfaceDestroyed(@NonNull SurfaceHolder surfaceHolder) {
                onSurfaceDestroyed(surfaceHolder.getSurface());
            }
        });
    }

    private native HybridData initHybrid();
    private native void onSurfaceCreated(Object surface);
    private native void onSurfaceChanged(Object surface, int width, int height);
    private native void onSurfaceDestroyed(Object surface);
}
