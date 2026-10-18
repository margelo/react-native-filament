package com.margelo.nitro.filament

import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.channels.FileChannel

fun File.mapReadOnly(): ByteBuffer = RandomAccessFile(this, "r").use { file ->
  file.channel.map(FileChannel.MapMode.READ_ONLY, 0, file.length())
}
