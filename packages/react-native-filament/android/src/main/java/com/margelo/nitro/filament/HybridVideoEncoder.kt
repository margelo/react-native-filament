package com.margelo.nitro.filament

import android.media.MediaCodec
import android.media.MediaFormat
import android.media.MediaMuxer
import android.os.Handler
import android.os.HandlerThread
import android.view.Surface
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.Promise
import java.io.File

@Keep
@DoNotStrip
class HybridVideoEncoder(options: VideoEncoderOptions) : HybridVideoEncoderSpec() {
  private val output = File(options.outputPath)
  private val thread = HandlerThread("RNF VideoEncoder").apply { start() }
  private val handler = Handler(thread.looper)
  private val muxer = MediaMuxer(options.outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
  private val codec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
  private val callback = MuxingCodecCallback(muxer, options.fps, ::onEndOfStream, ::onFailure)
  private val inputSurface: Surface
  private val window: Long
  private var onFrameAccepted: () -> Unit = {}
  private var onError: (Throwable) -> Unit = {}
  private var finishing: Promise<String>? = null
  private var released = false

  init {
    codec.setCallback(callback, handler)
    codec.configure(options.toMediaFormat(), null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    inputSurface = codec.createInputSurface()
    codec.start()
    window = NativeWindow.acquire(inputSurface)
  }

  override fun acquireFrame(): ULong = window.toULong()

  override fun submitFrame(target: ULong, frameIndex: Double) {
    onFrameAccepted()
  }

  override fun setListeners(onFrameAccepted: () -> Unit, onError: (error: Throwable) -> Unit) {
    this.onFrameAccepted = onFrameAccepted
    handler.post { this.onError = onError }
  }

  override fun finish(): Promise<String> {
    val promise = Promise<String>()
    handler.post {
      finishing = promise
      codec.signalEndOfInputStream()
    }
    return promise
  }

  override fun cancel() {
    handler.post {
      finishing?.reject(IllegalStateException("FilamentRecorderError: the recording was cancelled."))
      finishing = null
      release()
      output.delete()
    }
  }

  private fun onEndOfStream() {
    val promise = finishing ?: return
    finishing = null
    handler.post {
      val stopped = runCatching { muxer.stop() }
      release()
      stopped.fold({ promise.resolve("file://${output.absolutePath}") }, { promise.reject(it) })
    }
  }

  private fun onFailure(error: Throwable) {
    onError(error)
    finishing?.reject(error)
    finishing = null
  }

  private fun release() {
    if (released) return
    released = true
    codec.stop()
    codec.release()
    muxer.release()
    NativeWindow.release(window)
    inputSurface.release()
    thread.quitSafely()
  }
}
