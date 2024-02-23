//
// Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include "Choreographer.h"
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

class JChoreographer : public jni::HybridClass<JChoreographer>, public Choreographer {
public:
  static void registerNatives();

  void start() override;
  void stop() override;
  void onFrameLong(jlong timestamp);

private:
  friend HybridBase;
  jni::global_ref<JChoreographer::javaobject> _javaPart;
  static auto constexpr TAG = "JChoreographer";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentChoreographer;";

private:
  explicit JChoreographer(const jni::alias_ref<jhybridobject>& javaThis);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis);
};

} // namespace margelo
