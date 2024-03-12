//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include "Dispatcher.h"
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

class JDispatcher : public jni::HybridClass<JDispatcher>, public Dispatcher {
public:
  ~JDispatcher();
  static void registerNatives();

public:
  void scheduleTrigger() override;

private:
  void triggerParent();

private:
  friend HybridBase;
  jni::global_ref<JDispatcher::javaobject> _javaPart;

private:
  static auto constexpr TAG = "JDispatcher";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/Dispatcher;";

private:
  explicit JDispatcher(const jni::alias_ref<jhybridobject>& javaThis);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis);
};

} // namespace margelo
