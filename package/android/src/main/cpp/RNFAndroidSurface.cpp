//
// Created by Marc Rousavy on 20.02.24.
//

#include "RNFAndroidSurface.h"
#include <android/native_window_jni.h>

namespace margelo {

using namespace facebook;

AndroidSurface::AndroidSurface(jni::alias_ref<jobject> javaSurface) {
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), javaSurface.get());
  _surface = window;
  _javaSurface = jni::make_global(javaSurface);
}

AndroidSurface::~AndroidSurface() {
  ANativeWindow_release(_surface);
}

void* AndroidSurface::getSurface() {
  return static_cast<void*>(_surface);
}

int AndroidSurface::getWidth() {
  return ANativeWindow_getWidth(_surface);
}

int AndroidSurface::getHeight() {
  return ANativeWindow_getHeight(_surface);
}

jni::global_ref<jobject> AndroidSurface::getJavaSurface() {
  return _javaSurface;
}

} // namespace margelo
