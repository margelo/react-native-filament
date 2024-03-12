//
// Created by Marc Rousavy on 12.03.24.
//

#include "JDispatcher.h"

namespace margelo {

JDispatcher::~JDispatcher() {}

JDispatcher::JDispatcher(const jni::alias_ref<jhybridobject>& javaThis) : _javaPart(jni::make_global(javaThis)) {}

jni::local_ref<JDispatcher::jhybriddata> JDispatcher::initHybrid(jni::alias_ref<jhybridobject> javaThis) {
  return makeCxxInstance(javaThis);
}

void JDispatcher::registerNatives() {
  registerHybrid({makeNativeMethod("initHybrid", JDispatcher::initHybrid), makeNativeMethod("trigger", JDispatcher::triggerParent)});
}

void JDispatcher::triggerParent() {
  trigger();
}

void JDispatcher::scheduleTrigger() {
  static const auto method = javaClassLocal()->getMethod<void()>("scheduleTrigger");
  method(_javaPart);
}

} // namespace margelo