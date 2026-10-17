package com.margelo.nitro.filament

internal interface SurfaceSourceListener {
  fun onSurfaceCreated()

  fun onSurfaceResized()

  fun onSurfaceDestroyed()
}
