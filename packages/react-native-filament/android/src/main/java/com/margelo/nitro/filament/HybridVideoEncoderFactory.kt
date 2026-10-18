package com.margelo.nitro.filament

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

@Keep
@DoNotStrip
class HybridVideoEncoderFactory : HybridVideoEncoderFactorySpec() {
  override fun createEncoder(options: VideoEncoderOptions): Promise<HybridVideoEncoderSpec> = Promise.async(scope) {
    HybridVideoEncoder(options)
  }

  private companion object {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  }
}
