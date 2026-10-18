package com.margelo.nitro.filament

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.margelo.nitro.filament.views.HybridFilamentViewManager

class NitroFilamentPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider { HashMap() }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf(HybridFilamentViewManager())

  companion object {
    init {
      NitroFilamentOnLoad.initializeNative()
    }
  }
}
