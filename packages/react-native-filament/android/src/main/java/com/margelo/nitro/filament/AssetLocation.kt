package com.margelo.nitro.filament

import android.content.Context
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer

sealed interface AssetLocation {
  suspend fun map(context: Context): ByteBuffer

  companion object {
    private const val ANDROID_ASSET_PREFIX = "file:///android_asset/"

    fun parse(uri: String): AssetLocation = when {
      uri.startsWith(ANDROID_ASSET_PREFIX) -> PackagedAssetLocation(uri.removePrefix(ANDROID_ASSET_PREFIX))
      uri.startsWith("file://") -> FileAssetLocation(File(Uri.parse(uri).path ?: throw IllegalArgumentException("Invalid file URI: $uri")))
      uri.startsWith("http://") || uri.startsWith("https://") -> RemoteAssetLocation(uri)
      uri.isNotEmpty() -> PackagedAssetLocation(uri)
      else -> throw IllegalArgumentException("An asset URI cannot be empty.")
    }
  }
}
