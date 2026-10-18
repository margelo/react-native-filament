package com.margelo.nitro.filament

import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.os.Build

/** H.264 from a Surface, without B-frames so samples leave the encoder in presentation order. */
internal fun VideoEncoderOptions.toMediaFormat(): MediaFormat =
  MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width.toInt(), height.toInt()).apply {
    setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
    setInteger(MediaFormat.KEY_BIT_RATE, bitRate.toInt())
    setFloat(MediaFormat.KEY_FRAME_RATE, fps.toFloat())
    setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      setInteger(MediaFormat.KEY_MAX_B_FRAMES, 0)
    }
  }
