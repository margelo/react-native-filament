package com.margelo.nitro.filament

import android.content.Context
import android.util.Size
import android.view.SurfaceHolder
import android.view.SurfaceView

internal class SurfaceViewSource(context: Context, private val listener: SurfaceSourceListener) : SurfaceSource, SurfaceHolder.Callback {
  override val view = SurfaceView(context)
  override var size = Size(0, 0)
    private set

  private var hasSurface = false

  init {
    view.holder.addCallback(this)
  }

  override fun createLease(): HybridNativeSurface? {
    if (!hasSurface) return null
    return HybridNativeSurface(view.holder.surface, size, view.resources.displayMetrics.density.toDouble(), transparent = false, synchronousTeardown = true, onReleased = {})
  }

  override fun surfaceCreated(holder: SurfaceHolder) = Unit

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    size = Size(width, height)
    if (hasSurface) {
      listener.onSurfaceResized()
    } else {
      hasSurface = true
      listener.onSurfaceCreated()
    }
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    hasSurface = false
    listener.onSurfaceDestroyed()
  }
}
