package com.margelo.filament;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

import java.util.concurrent.Executor;

/**
 * @noinspection JavaJniMissingFunction
 */
public class Dispatcher {
    private final Executor executor;
    /**
     * @noinspection unused, FieldCanBeLocal
     */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    public Dispatcher(@NonNull Executor executor) {
        this.executor = executor;
        this.mHybridData = initHybrid();
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    private void scheduleTrigger() {
        try {
            executor.execute(() -> {
                try {
                    trigger();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private native void trigger();

    private native HybridData initHybrid();
}
