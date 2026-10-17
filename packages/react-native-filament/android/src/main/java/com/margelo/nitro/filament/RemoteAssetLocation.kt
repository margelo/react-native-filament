package com.margelo.nitro.filament

import android.content.Context
import java.nio.ByteBuffer

class RemoteAssetLocation(private val url: String) : AssetLocation {
  override suspend fun map(context: Context): ByteBuffer = RemoteAssetCache.fileFor(url, context.cacheDir).mapReadOnly()
}
