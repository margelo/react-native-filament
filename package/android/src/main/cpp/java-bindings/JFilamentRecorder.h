//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "FilamentRecorder.h"
#include <fbjni/fbjni.h>
#include <jni.h>

namespace margelo {

using namespace facebook;

class JFilamentRecorder : public jni::HybridClass<JFilamentRecorder>, public FilamentRecorder {
public:
  ~JFilamentRecorder();
  static void registerNatives();

  void* getNativeWindow() override;
  std::future<std::string> stopRecording() override;
  std::future<void> startRecording() override;
  bool getIsRecording() override;

private:
  friend HybridBase;
  jni::global_ref<JFilamentRecorder::javaobject> _javaPart;
  std::shared_ptr<SurfaceProvider> _surfaceProvider;

private:
  static auto constexpr TAG = "JFilamentRecorder";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentRecorder;";

private:
  explicit JFilamentRecorder(const jni::alias_ref<jhybridobject>& javaThis, int width, int height, int fps, long bitRate);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis, int width, int height, int fps, long bitRate);
};

} // namespace margelo
