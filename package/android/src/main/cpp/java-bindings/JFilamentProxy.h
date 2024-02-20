//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>

namespace margelo {

using namespace facebook;

/**
 * Bindings to the Java class "FilamentProxy.java".
 */
class JFilamentProxy : public jni::HybridClass<JFilamentProxy> {
public:
  ~JFilamentProxy();
  static void registerNatives();

  // TODO(hanno): implement
  int loadModel(const std::string& path);

private:
  friend HybridBase;
  jni::global_ref<JFilamentProxy::javaobject> _javaPart;
  jsi::Runtime* _runtime;
  std::shared_ptr<facebook::react::CallInvoker> _callInvoker;

private:
  static auto constexpr TAG = "FilamentProxy";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentProxy;";

private:
  explicit JFilamentProxy(const jni::alias_ref<JFilamentProxy::jhybridobject>& javaThis, jsi::Runtime* jsRuntime,
                          const std::shared_ptr<facebook::react::CallInvoker>& jsCallInvoker);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis, jlong jsRuntimePointer,
                                                jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder);
};

} // namespace margelo
