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
  registerHybrid({makeNativeMethod("initHybrid", JDispatcher::initHybrid), makeNativeMethod("trigger", JDispatcher::trigger)});
}

void JDispatcher::scheduleTrigger() {
  static const auto method = javaClassLocal()->getMethod<void()>("scheduleTrigger");
  method(_javaPart);
}

void JDispatcher::trigger() {
  std::unique_lock lock(_mutex);
  auto job = _jobs.front();
  job();
  _jobs.pop();
}

void JDispatcher::runAsync(std::function<void ()>&& function) {
  std::unique_lock lock(_mutex);
  _jobs.push(std::move(function));
  scheduleTrigger();
}

void JDispatcher::runSync(std::function<void ()>&& function) {
  _mutex.lock();
  runAsync([this, function = std::move(function)]() {
    function();
    _mutex.unlock();
  });
  _mutex.lock();
  _mutex.unlock();
}

} // namespace margelo