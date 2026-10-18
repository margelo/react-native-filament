package com.margelo.nitro.filament

import java.io.InputStream
import java.nio.ByteBuffer

fun InputStream.readDirect(): ByteBuffer {
  val bytes = readBytes()
  return ByteBuffer.allocateDirect(bytes.size).apply { put(bytes) }
}
