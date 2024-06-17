package com.margelo.filament;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;
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
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

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
    private static final String NAME = "FilamentProxy";
    private static final OkHttpClient client = new OkHttpClient();

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

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    FilamentRecorder createRecorder(int width, int height, int fps, double bitRate) throws IOException {
        return new FilamentRecorder(reactContext, renderThreadDispatcher, width, height, fps, bitRate);
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

    private ByteBuffer streamToDirectByteBuffer(InputStream stream) throws IOException {
        byte[] bytes = readAllBytes(stream);
        ByteBuffer buffer = ByteBuffer.allocateDirect(bytes.length);

        buffer.put(bytes, 0, bytes.length);
        buffer.rewind();
        return buffer;
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    ByteBuffer loadAsset(String uriString) throws Exception {
        Log.i(NAME, "Loading byte data from URL: " + uriString + "...");

        if (uriString.contains("file://")) {
            String filePath = uriString.replace("file://", "");
            // Read from file system:
            File file = new File(filePath);
            if (!file.exists()) {
                throw new Exception("File does not exist: " + filePath);
            }
            try (FileInputStream stream = new FileInputStream(file)) {
                return streamToDirectByteBuffer(stream);
            } catch (Exception e) {
                Log.e(NAME, "Failed to read file: " + filePath, e);
                throw e;
            }
        }

        Uri uri = null;
        String assetName = null;
        if (uriString.contains("http://") || uriString.contains("https://")) {
            Log.i(NAME, "Parsing URL...");
            uri = Uri.parse(uriString);
            Log.i(NAME, "Parsed URL: " + uri.toString());
        } else {
            assetName = uriString;
            Log.i(NAME, "Assumed assetName: " + assetName);
        }

        if (uri != null) {
            // It's a URL/http resource
            Request request = new Request.Builder().url(uri.toString()).build();
            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    InputStream stream = response.body().byteStream();
                    return streamToDirectByteBuffer(stream);
                } else {
                    throw new RuntimeException("Response was not successful!");
                }
            } catch (Exception ex) {
                Log.e(NAME, "Failed to fetch URL " + uriString + "!", ex);
                throw ex;
            }
        } else if (assetName != null) {
            // It's bundled into the Android resources/assets
            try (InputStream stream = reactContext.getAssets().open(assetName)) {
                return streamToDirectByteBuffer(stream);
            }
        } else {
            // It's a bird? it's a plane? not it's an error
            throw new Exception("Input is neither a valid URL, nor an asset path - " +
                    "cannot load asset! (Input: " + uriString + ")");
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
