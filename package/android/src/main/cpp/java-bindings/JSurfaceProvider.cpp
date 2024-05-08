//
// Created by Marc Rousavy on 21.02.24.
//

#include "JSurfaceProvider.h"
#include <android/log.h>

namespace margelo {

JSurfaceProvider::JSurfaceProvider(const jni::alias_ref<jhybridobject>& javaThis) : SurfaceProvider(), _javaPart(make_global(javaThis)) {}

JSurfaceProvider::~JSurfaceProvider() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Destroying JSurfaceProvider...");
}

void JSurfaceProvider::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JSurfaceProvider::initHybrid),
      makeNativeMethod("onSurfaceCreated", JSurfaceProvider::onSurfaceCreated),
      makeNativeMethod("onSurfaceChanged", JSurfaceProvider::onSurfaceChanged),
      makeNativeMethod("onSurfaceDestroyed", JSurfaceProvider::onSurfaceDestroyed),
  });
}

jni::local_ref<JSurfaceProvider::jhybriddata> JSurfaceProvider::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing JSurfaceProvider...");
  return makeCxxInstance(jThis);
}

void JSurfaceProvider::onSurfaceCreated(jni::alias_ref<jobject> javaSurface) {
  if (_surface == nullptr || _surface->getJavaSurface() != javaSurface) {
    _surface = std::make_shared<AndroidSurface>(javaSurface);
  }
  SurfaceProvider::onSurfaceCreated(_surface);
}

void JSurfaceProvider::onSurfaceChanged(jni::alias_ref<jobject> javaSurface, int width, int height) {
  if (_surface == nullptr || _surface->getJavaSurface() != javaSurface) {
    _surface = std::make_shared<AndroidSurface>(javaSurface);
  }
  SurfaceProvider::onSurfaceChanged(_surface, width, height);
}

void JSurfaceProvider::onSurfaceDestroyed(jni::alias_ref<jobject> surface) {
  SurfaceProvider::onSurfaceDestroyed(_surface);
  if (_surface != nullptr && _surface->getJavaSurface() == surface) {
    _surface = nullptr;
  }
}

std::shared_ptr<Surface> JSurfaceProvider::getSurfaceOrNull() {
  return _surface;
}

} // namespace margelo
