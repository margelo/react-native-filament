package com.margelo.nitro.filament

import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.uimanager.ThemedReactContext

@Keep
@DoNotStrip
class HybridFilamentView(context: ThemedReactContext) : HybridFilamentViewSpec(), SurfaceSourceListener {
  private val container = FrameLayout(context)
  private var source: SurfaceSource = createSource(transparent = false)
  private var observer: SurfaceObserver? = null
  private var lease: HybridNativeSurface? = null

  override val view: View = container

  override var transparent: Boolean? = null
    set(value) {
      val changed = (field ?: false) != (value ?: false)
      field = value
      if (changed) {
        container.removeView(source.view)
        source = createSource(value ?: false)
      }
    }

  override fun setSurfaceObserver(observer: SurfaceObserver?) {
    container.post {
      this.observer = observer
      lease = null
      onSurfaceCreated()
    }
  }

  override fun onSurfaceCreated() {
    val observer = observer ?: return
    val created = source.createLease() ?: return
    lease = created
    observer.onCreated(created)
  }

  override fun onSurfaceResized() {
    val current = lease ?: return
    current.resize(source.size)
    observer?.onResized(current)
  }

  override fun onSurfaceDestroyed() {
    val current = lease ?: return
    lease = null
    observer?.onDestroyed(current)
  }

  private fun createSource(transparent: Boolean): SurfaceSource {
    val created = if (transparent) TextureViewSource(container.context, this) else SurfaceViewSource(container.context, this)
    container.addView(created.view, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    return created
  }
}
