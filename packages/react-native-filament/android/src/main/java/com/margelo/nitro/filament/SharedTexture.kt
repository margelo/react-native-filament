package com.margelo.nitro.filament

import android.graphics.SurfaceTexture
import android.view.Surface

internal class SharedTexture(private val surfaceTexture: SurfaceTexture, val surface: Surface) {
  private var leases = 0
  private var destroyed = false

  @Synchronized
  fun retain() {
    leases++
  }

  @Synchronized
  fun release() {
    leases--
    releaseIfUnused()
  }

  @Synchronized
  fun markDestroyed() {
    destroyed = true
    releaseIfUnused()
  }

  private fun releaseIfUnused() {
    if (destroyed && leases == 0) {
      surface.release()
      surfaceTexture.release()
    }
  }
}
