//
// Created by Marc Rousavy on 12.03.24.
//

#include "JDispatcher.h"
#include <android/log.h>

namespace margelo {

JDispatcher::~JDispatcher() {
  __android_log_print(ANDROID_LOG_INFO, "JDispatcher", "Destructor called");
}

JDispatcher::JDispatcher(const jni::alias_ref<jhybridobject> &javaThis)
    : _javaPart(jni::make_global(javaThis)) {}

jni::local_ref<JDispatcher::jhybriddata>
JDispatcher::initHybrid(jni::alias_ref<jhybridobject> javaThis) {
  return makeCxxInstance(javaThis);
}

void JDispatcher::registerNatives() {
  registerHybrid({makeNativeMethod("initHybrid", JDispatcher::initHybrid),
                  makeNativeMethod("trigger", JDispatcher::trigger)});
}

void JDispatcher::scheduleTrigger() {
  const auto method = javaClassLocal()->getMethod<void()>("scheduleTrigger");
  try {
    method(_javaPart);
    __android_log_print(ANDROID_LOG_INFO, "JDispatcher", "Method called");
  } catch (...) {
    __android_log_print(ANDROID_LOG_INFO, "JDispatcher", "Error!!!!");
  }
}

void JDispatcher::trigger() {
  std::unique_lock lock(_mutex);
  auto job = _jobs.front();
  job();
  _jobs.pop();
}

void JDispatcher::runAsync(std::function<void()> &&function) {
  std::unique_lock lock(_mutex);
  _jobs.push(std::move(function));
  scheduleTrigger();
}

void JDispatcher::runSync(std::function<void()> &&function) {
  // TODO: Don't use a mutex here, use a condition variable instead
  _syncMutex.lock();
  runAsync([this, function = std::move(function)]() {
    function();
    _syncMutex.unlock();
  });
  _syncMutex.lock();
  _syncMutex.unlock();
}

} // namespace margelo