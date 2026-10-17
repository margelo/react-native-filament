package com.margelo.nitro.filament

import android.view.Surface

internal object NativeWindow {
  external fun acquire(surface: Surface): Long

  external fun release(window: Long)
}
