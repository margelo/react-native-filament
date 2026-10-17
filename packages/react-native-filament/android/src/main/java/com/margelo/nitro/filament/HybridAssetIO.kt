package com.margelo.nitro.filament

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

@Keep
@DoNotStrip
class HybridAssetIO : HybridAssetIOSpec() {
  override val temporaryDirectory: String
    get() = (NitroModules.applicationContext ?: throw IllegalStateException("React Native has not started yet.")).cacheDir.absolutePath

  override fun read(uri: String): Promise<ArrayBuffer> = Promise.async(scope) {
    val context = NitroModules.applicationContext ?: throw IllegalStateException("React Native has not started yet.")
    ArrayBuffer.wrap(AssetLocation.parse(uri).map(context))
  }

  private companion object {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  }
}
