package com.margelo.filament;

import android.content.Context;
import android.content.res.Resources;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.react.uimanager.UIManagerHelper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * @noinspection JavaJniMissingFunction
 */
class FilamentProxy {
    /**
     * @noinspection unused, FieldCanBeLocal
     */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;
    private final ReactApplicationContext reactContext;
    private final Dispatcher uiThreadDispatcher;
    private final Dispatcher backgroundThreadDispatcher;
    private final Dispatcher renderThreadDispatcher;

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

        Executor renderThread = new LooperExecutor("FilamentRenderer");
        renderThreadDispatcher = new Dispatcher(renderThread);
        uiThreadDispatcher = new Dispatcher(ContextCompat.getMainExecutor(context));
        backgroundThreadDispatcher = new Dispatcher(Executors.newCachedThreadPool());
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    FilamentChoreographer createChoreographer() {
        return new FilamentChoreographer();
    }

    private static byte[] readAllBytes(InputStream inputStream) throws IOException {
        final int bufferSize = 4096; // 4KB
        byte[] buffer = new byte[bufferSize];

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer, 0, bufferSize)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            return outputStream.toByteArray();
        }
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    ByteBuffer loadAsset(String assetName) throws IOException {
        try (InputStream inputStream = reactContext.getAssets().open(assetName)) {
            byte[] bytes = readAllBytes(inputStream);
            ByteBuffer buffer = ByteBuffer.allocateDirect(bytes.length);

            buffer.put(bytes, 0, bytes.length);
            buffer.rewind();
            return buffer;
        }
    }

    /**
     * @noinspection unused
     */
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

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    Dispatcher getRenderThreadDispatcher() {
        return renderThreadDispatcher;
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    Dispatcher getUIDispatcher() {
        return uiThreadDispatcher;
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    Dispatcher getBackgroundDispatcher() {
        return backgroundThreadDispatcher;
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    float getDisplayRefreshRate() {
        try {
            Display display = ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay();
            return display.getRefreshRate();
        } catch (Exception e) {
            Log.d("FilamentProxy", "Failed to get display refresh rate: " + e.getMessage());
            return 60.0f;
        }
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    float getDensityPixelRatio() {
        return Resources.getSystem().getDisplayMetrics().density;
    }

    private native HybridData initHybrid(long jsRuntimePointer, CallInvokerHolderImpl callInvokerHolder);
}
