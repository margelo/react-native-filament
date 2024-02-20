//
// Created by Marc Rousavy on 20.02.24.
//

#include "JFilamentProxy.h"
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

JFilamentProxy::JFilamentProxy(const jni::alias_ref<JFilamentProxy::jhybridobject>& javaThis, jsi::Runtime* runtime,
                               const std::shared_ptr<facebook::react::CallInvoker>& callInvoker)
    : _javaPart(make_global(javaThis)), _runtime(runtime), _callInvoker(callInvoker) {}

JFilamentProxy::~JFilamentProxy() {
  // TODO(hanno): Cleanup?
}

int JFilamentProxy::loadModel(const std::string& path) {
  static const auto method = javaClassLocal()->getMethod<jint(jni::alias_ref<jstring>)>("loadModel");
  return method(_javaPart, jni::make_jstring(path));
}

jsi::Runtime& JFilamentProxy::getRuntime() {
    if (_runtime == nullptr) {
        [[unlikely]];
        throw std::runtime_error("JSI Runtime was null!");
    }
    return *_runtime;
}

void JFilamentProxy::registerNatives() {
  registerHybrid({makeNativeMethod("initHybrid", JFilamentProxy::initHybrid)});
}

jni::local_ref<JFilamentProxy::jhybriddata>
JFilamentProxy::initHybrid(jni::alias_ref<jhybridobject> jThis, jlong jsRuntimePointer,
                           jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing JFilamentProxy...");

  // cast from JNI hybrid objects to C++ instances
  auto jsRuntime = reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();

  return makeCxxInstance(jThis, jsRuntime, jsCallInvoker);
}

} // namespace margelo
