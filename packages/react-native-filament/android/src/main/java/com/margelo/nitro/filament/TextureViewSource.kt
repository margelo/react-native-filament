package com.margelo.nitro.filament

import android.content.Context
import android.graphics.SurfaceTexture
import android.util.Size
import android.view.Surface
import android.view.TextureView

internal class TextureViewSource(context: Context, private val listener: SurfaceSourceListener) : SurfaceSource, TextureView.SurfaceTextureListener {
  override val view = TextureView(context)
  override var size = Size(0, 0)
    private set

  private var current: SharedTexture? = null

  init {
    view.isOpaque = false
    view.surfaceTextureListener = this
  }

  override fun createLease(): HybridNativeSurface? {
    val texture = current ?: return null
    texture.retain()
    return HybridNativeSurface(texture.surface, size, transparent = true, synchronousTeardown = false, onReleased = texture::release)
  }

  override fun onSurfaceTextureAvailable(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
    size = Size(width, height)
    current = SharedTexture(surfaceTexture, Surface(surfaceTexture))
    listener.onSurfaceCreated()
  }

  override fun onSurfaceTextureSizeChanged(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
    size = Size(width, height)
    listener.onSurfaceResized()
  }

  override fun onSurfaceTextureDestroyed(surfaceTexture: SurfaceTexture): Boolean {
    val texture = current
    current = null
    listener.onSurfaceDestroyed()
    texture?.markDestroyed()
    return false
  }

  override fun onSurfaceTextureUpdated(surfaceTexture: SurfaceTexture) = Unit
}
