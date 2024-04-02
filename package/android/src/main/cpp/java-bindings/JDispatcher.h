//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include "threading/Dispatcher.h"
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

class JDispatcher : public jni::HybridClass<JDispatcher>, public Dispatcher {
public:
  ~JDispatcher();
  static void registerNatives();

public:
  void scheduleTrigger();
  void runAsync(std::function<void()>&& function) override;
  void runSync(std::function<void()>&& function) override;

private:
  void trigger();

private:
  friend HybridBase;
  jni::global_ref<JDispatcher::javaobject> _javaPart;

private:
  std::queue<std::function<void()>> _jobs;
  std::recursive_mutex _mutex;

private:
  static auto constexpr TAG = "JDispatcher";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/Dispatcher;";

private:
  explicit JDispatcher(const jni::alias_ref<jhybridobject>& javaThis);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis);
};

} // namespace margelo
