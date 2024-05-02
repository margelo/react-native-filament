package com.margelo.filament;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * @noinspection JavaJniMissingFunction
 */
public class FilamentRecorder {

    private static final String TAG = "FilamentRecorder";

    /**
     * @noinspection unused, FieldCanBeLocal
     */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    public FilamentRecorder(int width, int height, int fps, long bitRate) {
        mHybridData = initHybrid(width, height, fps, bitRate);
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    void startRecording() {
        throw new RuntimeError("startRecording() is not yet implemented!");
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    String stopRecording() {
        throw new RuntimeError("stopRecording() is not yet implemented!");
    }

    private native HybridData initHybrid(int width, int height, int fps, long bitRate);
}
