package com.margelo.filament;

import android.view.View;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.react.uimanager.UIManagerHelper;

import java.nio.ByteBuffer;

/** @noinspection JavaJniMissingFunction*/
class FilamentProxy {
    /** @noinspection unused, FieldCanBeLocal */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;
    private final ReactApplicationContext reactContext;

    FilamentProxy(@NonNull ReactApplicationContext context) {
        JavaScriptContextHolder jsRuntimeHolder = context.getJavaScriptContextHolder();
        if (jsRuntimeHolder == null) {
            throw new RuntimeException("Failed to initialize react-native-filament: JSI Runtime Holder is null!");
        }
        long runtimePointer = jsRuntimeHolder.get();
        CallInvokerHolder callInvokerHolder = context.getCatalystInstance().getJSCallInvokerHolder();
        if (!(callInvokerHolder instanceof CallInvokerHolderImpl)) {
            throw new RuntimeException("Failed to initialize react-native-filament: JS Call Invoker is null!");
        }
        mHybridData = initHybrid(runtimePointer, (CallInvokerHolderImpl) callInvokerHolder);
        reactContext = context;
    }

    /** @noinspection unused*/
    @DoNotStrip
    @Keep
    FilamentChoreographer createChoreographer() {
        return new FilamentChoreographer();
    }

    /** @noinspection unused*/
    @DoNotStrip
    @Keep
    ByteBuffer loadModel(String path) {
        // TODO(hanno): Implement Java part here
        return ByteBuffer.allocate(1);
    }

    /** @noinspection unused*/
    @DoNotStrip
    @Keep
    FilamentView findFilamentView(int id) {
        UIManager manager = UIManagerHelper.getUIManager(reactContext, id);
        if (manager == null) {
            throw new RuntimeException("Filament View with id " + id + " cannot be found!");
        }
        View view = manager.resolveView(id);
        if (!(view instanceof FilamentView)) {
            throw new RuntimeException("Filament View with id " + id + " cannot be found!");
        }
        return (FilamentView) view;
    }

    private native HybridData initHybrid(long jsRuntimePointer, CallInvokerHolderImpl callInvokerHolder);
}
