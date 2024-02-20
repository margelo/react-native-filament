package com.margelo.filament;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;

/** @noinspection JavaJniMissingFunction*/
class FilamentProxy {
    /** @noinspection unused, FieldCanBeLocal */
    @DoNotStrip
    @Keep
    private final HybridData hybridData;

    FilamentProxy(@NonNull ReactApplicationContext context) {
        JavaScriptContextHolder jsRuntimeHolder = context.getJavaScriptContextHolder();
        if (jsRuntimeHolder == null) {
            throw new RuntimeException("Failed to initialize react-native-filament: JSI Runtime Holder is null!");
        }
        Long runtimePointer = jsRuntimeHolder.get();
        CallInvokerHolder callInvokerHolder = context.getCatalystInstance().getJSCallInvokerHolder();
        if (!(callInvokerHolder instanceof CallInvokerHolderImpl)) {
            throw new RuntimeException("Failed to initialize react-native-filament: JS Call Invoker is null!");
        }
        hybridData = initHybrid(runtimePointer, (CallInvokerHolderImpl) callInvokerHolder);
    }

    /** @noinspection unused*/
    @DoNotStrip
    @Keep
    int loadModel(String path) {
        // TODO(hanno): Implement Java part here
        return 13;
    }

    private native HybridData initHybrid(Long jsRuntimePointer, CallInvokerHolderImpl callInvokerHolder);
}
