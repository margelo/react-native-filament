//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "RNFFilamentView.h"
#include "RNFJSurfaceProvider.h"
#include "RNFSurfaceProvider.h"
#include <fbjni/fbjni.h>
#include <jni.h>

namespace margelo {

using namespace facebook;

class JFilamentView : public jni::HybridClass<JFilamentView>,
                      public FilamentView {
public:
  ~JFilamentView();
  static void registerNatives();

  std::shared_ptr<SurfaceProvider> getSurfaceProvider() override;

private:
  friend HybridBase;
  jni::global_ref<JFilamentView::javaobject> _javaPart;
  std::shared_ptr<SurfaceProvider> _surfaceProvider;

private:
  static auto constexpr TAG = "JFilamentView";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentView;";

private:
  explicit JFilamentView(
      const jni::alias_ref<jhybridobject> &javaThis,
      const jni::alias_ref<JSurfaceProvider::javaobject> &surfaceProvider);
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> javaThis,
      const jni::alias_ref<JSurfaceProvider::javaobject> &surfaceProvider);
};

} // namespace margelo
