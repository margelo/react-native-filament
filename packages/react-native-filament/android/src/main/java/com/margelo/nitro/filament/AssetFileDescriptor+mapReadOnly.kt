package com.margelo.nitro.filament

import android.content.res.AssetFileDescriptor
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel

fun AssetFileDescriptor.mapReadOnly(): ByteBuffer = FileInputStream(fileDescriptor).use { stream ->
  stream.channel.map(FileChannel.MapMode.READ_ONLY, startOffset, length)
}
