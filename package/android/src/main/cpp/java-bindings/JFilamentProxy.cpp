//
// Created by Marc Rousavy on 20.02.24.
//

#include "JFilamentProxy.h"
#include "JChoreographer.h"
#include "JFilamentView.h"
#include "JNISharedPtr.h"
#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

JFilamentProxy::JFilamentProxy(const jni::alias_ref<JFilamentProxy::jhybridobject>& javaThis, jsi::Runtime* runtime,
                               const std::shared_ptr<facebook::react::CallInvoker>& callInvoker)
    : _javaPart(make_global(javaThis)), _runtime(runtime), _callInvoker(callInvoker) {}

JFilamentProxy::~JFilamentProxy() {
  // TODO(hanno): Cleanup?
}

std::shared_ptr<FilamentBuffer> JFilamentProxy::getAssetByteBuffer(const std::string& path) {
  static const auto method = javaClassLocal()->getMethod<jni::alias_ref<jni::JByteBuffer>(jni::alias_ref<jstring>)>("getAssetByteBuffer");
  jni::local_ref<jni::JByteBuffer> localRef = method(_javaPart, jni::make_jstring(path));
  jni::global_ref<jni::JByteBuffer> globalRef = jni::make_global(localRef);
  return std::make_shared<FilamentBuffer>(globalRef->getDirectBytes(), globalRef->getDirectSize());
}

std::shared_ptr<FilamentView> JFilamentProxy::findFilamentView(int id) {
  static const auto method = javaClassLocal()->getMethod<jni::alias_ref<JFilamentView::javaobject>(jint)>("findFilamentView");
  jni::local_ref<JFilamentView::javaobject> view = method(_javaPart, id);
  jni::global_ref<JFilamentView::javaobject> globalRef = jni::make_global(view);
  std::shared_ptr<JFilamentView> sharedRef = JNISharedPtr::make_shared_from_jni<JFilamentView>(globalRef);
  return std::static_pointer_cast<FilamentView>(sharedRef);
}

std::shared_ptr<Choreographer> JFilamentProxy::createChoreographer() {
  static const auto method = javaClassLocal()->getMethod<jni::alias_ref<JChoreographer::javaobject>()>("createChoreographer");
  jni::local_ref<JChoreographer::javaobject> choreographer = method(_javaPart);
  jni::global_ref<JChoreographer::javaobject> globalRef = jni::make_global(choreographer);
  std::shared_ptr<JChoreographer> sharedRef = JNISharedPtr::make_shared_from_jni<JChoreographer>(globalRef);
  return std::static_pointer_cast<Choreographer>(sharedRef);
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
