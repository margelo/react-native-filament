//
// Created by Marc Rousavy on 20.02.24.
//

#include "JFilamentProxy.h"
#include "AndroidManagedBuffer.h"
#include "JChoreographer.h"
#include "JDispatcher.h"
#include "JFilamentRecorder.h"
#include "JFilamentView.h"
#include "JNISharedPtr.h"
#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

JFilamentProxy::JFilamentProxy(const jni::alias_ref<JFilamentProxy::jhybridobject>& javaThis, jsi::Runtime* runtime,
                               std::shared_ptr<facebook::react::CallInvoker> callInvoker)
    : _javaPart(make_global(javaThis)), _runtime(runtime), _callInvoker(callInvoker) {}

JFilamentProxy::~JFilamentProxy() = default;

std::shared_ptr<FilamentBuffer> JFilamentProxy::loadAsset(const std::string& path) {
  static const auto method = javaClassLocal()->getMethod<jni::alias_ref<jni::JByteBuffer>(jni::alias_ref<jstring>)>("loadAsset");
  jni::local_ref<jni::JByteBuffer> buffer = method(_javaPart, jni::make_jstring(path));
  auto managedBuffer = std::make_shared<AndroidManagedBuffer>(buffer);
  return std::make_shared<FilamentBuffer>(managedBuffer);
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

std::shared_ptr<FilamentRecorder> JFilamentProxy::createRecorder(int width, int height, int fps, long bitRate) {
  static const auto method =
      javaClassLocal()->getMethod<jni::alias_ref<JFilamentRecorder::javaobject>(int, int, int, long)>("createRecorder");
  jni::local_ref<JFilamentRecorder::javaobject> recorder = method(_javaPart, width, height, fps, bitRate);
  jni::global_ref<JFilamentRecorder::javaobject> globalRef = jni::make_global(recorder);
  std::shared_ptr<JFilamentRecorder> sharedRef = JNISharedPtr::make_shared_from_jni<JFilamentRecorder>(globalRef);
  return std::static_pointer_cast<FilamentRecorder>(sharedRef);
}

std::shared_ptr<Dispatcher> JFilamentProxy::getRenderThreadDispatcher() {
  if (_renderThreadDispatcher == nullptr) {
    static const auto method = javaClassLocal()->getMethod<jni::alias_ref<JDispatcher::javaobject>()>("getRenderThreadDispatcher");
    jni::local_ref<JDispatcher::javaobject> dispatcher = method(_javaPart);
    jni::global_ref<JDispatcher::javaobject> globalRef = jni::make_global(dispatcher);
    _renderThreadDispatcher = JNISharedPtr::make_shared_from_jni<JDispatcher>(globalRef);
  }
  return _renderThreadDispatcher;
}

std::shared_ptr<Dispatcher> JFilamentProxy::getUIDispatcher() {
  if (_uiDispatcher == nullptr) {
    static const auto method = javaClassLocal()->getMethod<jni::alias_ref<JDispatcher::javaobject>()>("getUIDispatcher");
    jni::local_ref<JDispatcher::javaobject> dispatcher = method(_javaPart);
    jni::global_ref<JDispatcher::javaobject> globalRef = jni::make_global(dispatcher);
    _uiDispatcher = JNISharedPtr::make_shared_from_jni<JDispatcher>(globalRef);
  }
  return _uiDispatcher;
}

std::shared_ptr<Dispatcher> JFilamentProxy::getBackgroundDispatcher() {
  if (_backgroundDispatcher == nullptr) {
    static const auto method = javaClassLocal()->getMethod<jni::alias_ref<JDispatcher::javaobject>()>("getBackgroundDispatcher");
    jni::local_ref<JDispatcher::javaobject> dispatcher = method(_javaPart);
    jni::global_ref<JDispatcher::javaobject> globalRef = jni::make_global(dispatcher);
    _backgroundDispatcher = JNISharedPtr::make_shared_from_jni<JDispatcher>(globalRef);
  }
  return _backgroundDispatcher;
}

float JFilamentProxy::getDisplayRefreshRate() {
  static const auto method = javaClassLocal()->getMethod<jfloat()>("getDisplayRefreshRate");
  return method(_javaPart);
}

jsi::Runtime& JFilamentProxy::getRuntime() {
  if (_runtime == nullptr) {
    [[unlikely]];
    throw std::runtime_error("JSI Runtime was null!");
  }
  return *_runtime;
}

std::shared_ptr<react::CallInvoker> JFilamentProxy::getCallInvoker() {
  return _callInvoker;
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
