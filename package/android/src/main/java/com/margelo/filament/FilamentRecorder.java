package com.margelo.filament;

import android.content.Context;
import android.media.MediaRecorder;
import android.os.Build;
import android.util.Log;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * @noinspection JavaJniMissingFunction
 */
public class FilamentRecorder implements MediaRecorder.OnInfoListener, MediaRecorder.OnErrorListener {

    private static final String TAG = "FilamentRecorder";

    /**
     * @noinspection unused, FieldCanBeLocal
     */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;
    private final MediaRecorder recorder;
    private final File file;
    private final Dispatcher rendererDispatcher;
    private boolean isRecording;

    public FilamentRecorder(Context context, Dispatcher rendererThreadDispatcher, int width, int height, int fps, double bitRate) throws IOException {
        mHybridData = initHybrid(rendererThreadDispatcher, width, height, fps, bitRate);
        file = File.createTempFile("filament", ".mp4");
        rendererDispatcher = rendererThreadDispatcher;

        int codec = getVideoCodec();
        Log.i(TAG, "Creating Recorder with codec " + codec + ", recording to " + file.getAbsolutePath());

        recorder = createRecorder(context);
        recorder.setOnInfoListener(this);
        recorder.setOnErrorListener(this);
        // Create Surface/ANativeWindow
        recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
        // MP4 container
        recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
        // Width x Height
        recorder.setVideoSize(width, height);
        // Bit-Rate
        recorder.setVideoEncodingBitRate((int) bitRate);
        // FPS
        recorder.setVideoFrameRate(fps);
        // Codec
        recorder.setVideoEncoder(codec);
        // Output file
        recorder.setOutputFile(file.getAbsolutePath());
        recorder.prepare();
    }

    @Override
    public void onError(MediaRecorder mediaRecorder, int what, int extra) {
        String string = mediaErrorToString(what);
        Log.e(TAG, "MediaRecorder onError(): " + string + ", extra: " + extra);
    }

    private static String mediaErrorToString(int mediaError) {
        return switch (mediaError) {
            case MediaRecorder.MEDIA_RECORDER_ERROR_UNKNOWN -> "unknown";
            case MediaRecorder.MEDIA_ERROR_SERVER_DIED -> "server-died";
            default -> "unknown-(" + mediaError + ")";
        };
    }

    @Override
    public void onInfo(MediaRecorder mediaRecorder, int what, int extra) {
        String string = mediaInfoToString(what);
        Log.i(TAG, "MediaRecorder onInfo(): " + string + ", extra: " + extra);
    }

    private static String mediaInfoToString(int mediaInfo) {
        return switch (mediaInfo) {
            case MediaRecorder.MEDIA_RECORDER_INFO_UNKNOWN -> "unknown";
            case MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED -> "max-duration-reached";
            case MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_APPROACHING ->
                    "max-file-size-approaching";
            case MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED -> "max-file-size-reached";
            case MediaRecorder.MEDIA_RECORDER_INFO_NEXT_OUTPUT_FILE_STARTED ->
                    "next-output-file-started";
            default -> "unknown-(" + mediaInfo + ")";
        };
    }

    private static MediaRecorder createRecorder(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return new MediaRecorder(context);
        } else {
            return new MediaRecorder();
        }
    }

    private static int getVideoCodec() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isHEVCSupported()) {
            return MediaRecorder.VideoEncoder.HEVC;
        } else {
            return MediaRecorder.VideoEncoder.DEFAULT;
        }
    }

    private static boolean isHEVCSupported() {
        // TODO: Remove this once we confirmed that H.264 works
        return false;

//        MediaCodecList codecList = new MediaCodecList(MediaCodecList.ALL_CODECS);
//        MediaCodecInfo[] infos = codecList.getCodecInfos();
//        for (MediaCodecInfo codecInfo : infos) {
//            if (codecInfo.isEncoder()) {
//                String[] types = codecInfo.getSupportedTypes();
//                for (String type : types) {
//                    if (type.equalsIgnoreCase("video/hevc")) {
//                        return true;
//                    }
//                }
//            }
//        }
//        return false;
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    void startRecording() {
        recorder.start();
        isRecording = true;

        scheduleRender();
    }

    private void scheduleRender() {
        if (!isRecording) return;

        rendererDispatcher.getExecutor().execute(() -> {
            Log.i(TAG, "Recorder is ready for more data.");
            onReadyForMoreData();
            scheduleRender();
        });
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    void stopRecording() {
        isRecording = false;
        recorder.stop();
        recorder.release();
    }

    /**
     * @noinspection unused
     */
    @DoNotStrip
    @Keep
    boolean getIsRecording() {
        return isRecording;
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

    private native void onReadyForMoreData();
    private native HybridData initHybrid(Dispatcher rendererDispatcher, int width, int height, int fps, double bitRate);
}
