//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "AndroidSurface.h"
#include "SurfaceProvider.h"
#include <fbjni/fbjni.h>
#include <jni.h>

namespace margelo {

using namespace facebook;

class JSurfaceProvider : public jni::HybridClass<JSurfaceProvider>, public SurfaceProvider {
public:
  ~JSurfaceProvider();
  static void registerNatives();

  void onSurfaceCreated(jni::alias_ref<jobject> surface);
  void onSurfaceChanged(jni::alias_ref<jobject> surface, int width, int height);
  void onSurfaceDestroyed(jni::alias_ref<jobject> surface);

  std::shared_ptr<Surface> getSurfaceOrNull() override;

private:
  friend HybridBase;
  jni::global_ref<JSurfaceProvider::javaobject> _javaPart;
  std::shared_ptr<AndroidSurface> _surface;

private:
  static auto constexpr TAG = "JSurfaceProvider";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/SurfaceProvider;";

private:
  explicit JSurfaceProvider(const jni::alias_ref<jhybridobject>& javaThis);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis);
};

} // namespace margelo
