package com.margelo.filament;

import android.content.Context;
import android.media.MediaRecorder;
import android.os.Build;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.ReactApplication;

import java.io.File;
import java.io.IOException;

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
    private final MediaRecorder recorder;
    private final File file;

    public FilamentRecorder(Context context, int width, int height, int fps, double bitRate) throws IOException {
        mHybridData = initHybrid(width, height, fps, bitRate);
        file = File.createTempFile("filament", ".mp4");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            recorder = new MediaRecorder(context);
        } else {
            recorder = new MediaRecorder();
        }
        recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
        recorder.setOutputFile(file.getAbsolutePath());
        recorder.prepare();
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        recorder.release();
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    void startRecording() {
        recorder.start();
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    void stopRecording() {
        recorder.stop();
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    Object getNativeWindow() {
        return recorder.getSurface();
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    String getOutputFile() {
        return file.getAbsolutePath();
    }

    private native HybridData initHybrid(int width, int height, int fps, double bitRate);
}
