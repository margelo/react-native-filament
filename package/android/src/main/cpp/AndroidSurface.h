//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include "Surface.h"
#include <android/native_window.h>
#include <fbjni/fbjni.h>
#include <jni.h>

namespace margelo {

using namespace facebook;

/**
 * Implementation for the abstract class Surface, which uses the "ANativeWindow" (android.media.Surface) type underneath.
 */
class AndroidSurface : public Surface {
public:
  explicit AndroidSurface(jni::alias_ref<jobject> javaSurface);
  ~AndroidSurface();

  void* getSurface() override;
  int getWidth() override;
  int getHeight() override;

  jni::global_ref<jobject> getJavaSurface();

private:
  jni::global_ref<jobject> _javaSurface;
  ANativeWindow* _surface;
};

} // namespace margelo
