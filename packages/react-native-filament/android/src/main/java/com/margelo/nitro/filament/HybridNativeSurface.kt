package com.margelo.nitro.filament

import android.util.Size
import android.view.Surface
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import java.util.concurrent.atomic.AtomicBoolean

@Keep
@DoNotStrip
class HybridNativeSurface(
  surface: Surface,
  size: Size,
  override val contentScale: Double,
  override val transparent: Boolean,
  override val synchronousTeardown: Boolean,
  private val onReleased: () -> Unit,
) : HybridNativeSurfaceSpec() {
  private val window = NativeWindow.acquire(surface)
  private val released = AtomicBoolean(false)

  @Volatile
  private var size = size

  override val handle: ULong
    get() = window.toULong()

  override val width: Double
    get() = size.width.toDouble()

  override val height: Double
    get() = size.height.toDouble()

  fun resize(size: Size) {
    this.size = size
  }

  override fun release() {
    if (released.compareAndSet(false, true)) {
      NativeWindow.release(window)
      onReleased()
    }
  }
}
