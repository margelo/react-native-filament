package com.margelo.nitro.filament

import android.content.Context
import java.io.File
import java.nio.ByteBuffer

class FileAssetLocation(private val file: File) : AssetLocation {
  override suspend fun map(context: Context): ByteBuffer = file.mapReadOnly()
}
