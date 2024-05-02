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

    private native HybridData initHybrid();
}
