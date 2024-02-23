package com.margelo.filament;

import android.view.Choreographer;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** @noinspection JavaJniMissingFunction*/
public class FilamentChoreographer {
    /** @noinspection unused, FieldCanBeLocal */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;
    private final Choreographer choreographer;
    private final Choreographer.FrameCallback frameCallback;
    private boolean isRunning;

    public FilamentChoreographer() {
        mHybridData = initHybrid();
        choreographer = Choreographer.getInstance();
        frameCallback = timestamp -> {
            if (!isRunning) return;
            onFrame(timestamp);
        };
    }

    private synchronized void start() {
        if (!isRunning) {
            isRunning = true;
            choreographer.postFrameCallback(frameCallback);
        }
    }

    private synchronized void stop() {
        if (isRunning) {
            isRunning = false;
            choreographer.removeFrameCallback(frameCallback);
        }
    }

    private native HybridData initHybrid();
    private native void onFrame(long timestamp);
}
