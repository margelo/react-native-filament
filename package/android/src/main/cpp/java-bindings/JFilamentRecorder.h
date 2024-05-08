//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "FilamentRecorder.h"
#include <android/native_window.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include "java-bindings/JDispatcher.h"

namespace margelo {

using namespace facebook;

class JFilamentRecorder : public jni::HybridClass<JFilamentRecorder>, public FilamentRecorder {
public:
  ~JFilamentRecorder();
  static void registerNatives();

  void* getNativeWindow() override;
  bool getIsRecording() override;
  std::string getOutputFile() override;

  std::future<std::string> stopRecording() override;
  std::future<void> startRecording() override;

  void renderFrame(double timestamp) override;

 private:
  // JNI
  void onReadyForMoreDataJava();

private:
  friend HybridBase;
  jni::global_ref<JFilamentRecorder::javaobject> _javaPart;
  ANativeWindow* _nativeWindow;

private:
  static auto constexpr TAG = "JFilamentRecorder";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentRecorder;";

public:
  explicit JFilamentRecorder(const jni::alias_ref<jhybridobject>& javaThis, std::shared_ptr<Dispatcher> rendererDispatcher, int width, int height, int fps, double bitRate);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis, jni::alias_ref<JDispatcher::javaobject> rendererDispatcher, int width, int height, int fps, double bitRate);
};

} // namespace margelo
