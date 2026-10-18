package com.margelo.nitro.filament

import android.media.MediaCodec
import android.media.MediaFormat
import android.media.MediaMuxer

/**
 * Writes every encoded sample to `muxer`, stamped `sampleIndex / fps` seconds. Runs on the codec's
 * callback thread.
 */
internal class MuxingCodecCallback(
  private val muxer: MediaMuxer,
  private val fps: Double,
  private val onEndOfStream: () -> Unit,
  private val onFailure: (Throwable) -> Unit,
) : MediaCodec.Callback() {
  private var track = -1
  private var samples = 0L

  override fun onInputBufferAvailable(codec: MediaCodec, index: Int) = Unit

  override fun onOutputFormatChanged(codec: MediaCodec, format: MediaFormat) {
    track = muxer.addTrack(format)
    muxer.start()
  }

  override fun onOutputBufferAvailable(codec: MediaCodec, index: Int, info: MediaCodec.BufferInfo) {
    val isConfig = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
    if (!isConfig && info.size > 0 && track >= 0) {
      val buffer = codec.getOutputBuffer(index) ?: return onFailure(IllegalStateException("The encoder returned no output buffer."))
      info.presentationTimeUs = (samples * 1_000_000 / fps).toLong()
      samples++
      muxer.writeSampleData(track, buffer, info)
    }
    codec.releaseOutputBuffer(index, false)
    if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
      onEndOfStream()
    }
  }

  override fun onError(codec: MediaCodec, error: MediaCodec.CodecException) = onFailure(error)
}
