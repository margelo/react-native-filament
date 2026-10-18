package com.margelo.nitro.filament

import android.util.Size
import android.view.View

internal interface SurfaceSource {
  val view: View
  val size: Size

  fun createLease(onReleased: (HybridNativeSurface) -> Unit): HybridNativeSurface?
}
