package com.margelo.nitro.filament

import android.util.Size
import android.view.Surface
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicBoolean

@Keep
@DoNotStrip
class HybridNativeSurface private constructor(
  private val window: Long,
  size: Size,
  override val contentScale: Double,
  override val transparent: Boolean,
  override val synchronousTeardown: Boolean,
  private val onReleased: (HybridNativeSurface) -> Unit,
) : HybridNativeSurfaceSpec() {
  private val released = AtomicBoolean(false)
  private val releaseFinished = CountDownLatch(1)

  @Volatile
  private var size = size

  override val handle: ULong
    get() = if (released.get()) 0u else window.toULong()

  override val width: Double
    get() = size.width.toDouble()

  override val height: Double
    get() = size.height.toDouble()

  fun resize(size: Size) {
    this.size = size
  }

  fun awaitRelease() {
    releaseFinished.await()
  }

  override fun release() {
    if (released.compareAndSet(false, true)) {
      NativeWindow.release(window)
      onReleased(this)
      releaseFinished.countDown()
    }
  }

  companion object {
    fun acquire(
      surface: Surface,
      size: Size,
      contentScale: Double,
      transparent: Boolean,
      synchronousTeardown: Boolean,
      onReleased: (HybridNativeSurface) -> Unit,
    ): HybridNativeSurface? {
      val window = NativeWindow.acquire(surface)
      if (window == 0L) return null
      return HybridNativeSurface(window, size, contentScale, transparent, synchronousTeardown, onReleased)
    }
  }
}
