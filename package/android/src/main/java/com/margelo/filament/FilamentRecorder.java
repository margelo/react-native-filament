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

    public FilamentRecorder() {
        mHybridData = initHybrid();
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

    private native HybridData initHybrid();
}
