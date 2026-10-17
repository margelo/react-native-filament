package com.margelo.nitro.filament

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.AssetFileDescriptor
import android.content.res.Resources
import java.io.FileNotFoundException
import java.nio.ByteBuffer

class PackagedAssetLocation(private val name: String) : AssetLocation {
  override suspend fun map(context: Context): ByteBuffer {
    val rawId = rawResourceId(context)
    return if (rawId != 0) mapRawResource(context.resources, rawId) else mapAsset(context)
  }

  @SuppressLint("DiscouragedApi")
  private fun rawResourceId(context: Context): Int = context.resources.getIdentifier(name, "raw", context.packageName)

  private fun mapRawResource(resources: Resources, id: Int): ByteBuffer = try {
    resources.openRawResourceFd(id).use(AssetFileDescriptor::mapReadOnly)
  } catch (compressed: Resources.NotFoundException) {
    resources.openRawResource(id).use { it.readDirect() }
  }

  private fun mapAsset(context: Context): ByteBuffer = try {
    context.assets.openFd(name).use(AssetFileDescriptor::mapReadOnly)
  } catch (compressedOrMissing: FileNotFoundException) {
    readCompressedAsset(context)
  }

  private fun readCompressedAsset(context: Context): ByteBuffer = try {
    context.assets.open(name).use { it.readDirect() }
  } catch (missing: FileNotFoundException) {
    throw FileNotFoundException("No asset named $name is bundled with the app.")
  }
}
