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
  private var holder: SurfaceObserver? = null

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
      withdrawLease()
      this.observer = observer
      onSurfaceCreated()
    }
  }

  override fun onSurfaceCreated() {
    val observer = observer ?: return
    if (lease != null) return
    val created = source.createLease(::onLeaseReleased) ?: return
    lease = created
    holder = observer
    observer.onCreated(created)
  }

  override fun onSurfaceResized() {
    val current = lease ?: return
    current.resize(source.size)
    holder?.onResized(current)
  }

  override fun onSurfaceDestroyed() {
    withdrawLease()
    val current = lease ?: return
    if (current.synchronousTeardown) current.awaitRelease()
  }

  private fun withdrawLease() {
    val current = lease ?: return
    val previous = holder ?: return
    holder = null
    previous.onDestroyed(current)
  }

  private fun onLeaseReleased(released: HybridNativeSurface) {
    container.post {
      if (lease !== released) return@post
      val withdrawn = holder == null
      lease = null
      holder = null
      if (withdrawn) onSurfaceCreated()
    }
  }

  private fun createSource(transparent: Boolean): SurfaceSource {
    val created = if (transparent) TextureViewSource(container.context, this) else SurfaceViewSource(container.context, this)
    container.addView(created.view, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    return created
  }
}
