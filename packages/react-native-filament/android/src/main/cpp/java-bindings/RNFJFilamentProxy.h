//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include "RNFChoreographer.h"
#include "RNFFilamentBuffer.h"
#include "RNFFilamentRecorder.h"
#include "RNFFilamentView.h"
#include "threading/RNFDispatcher.h"
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

  std::shared_ptr<FilamentBuffer> loadAsset(const std::string& path);
  std::shared_ptr<FilamentView> findFilamentView(int id);
  std::shared_ptr<Choreographer> createChoreographer();
  std::shared_ptr<FilamentRecorder> createRecorder(int width, int height, int fps, double bitRate);
  std::shared_ptr<Dispatcher> getRenderThreadDispatcher();
  std::shared_ptr<Dispatcher> getUIDispatcher();
  std::shared_ptr<Dispatcher> getBackgroundDispatcher();
  float getDisplayRefreshRate();
  float getDensityPixelRatio();

  jsi::Runtime& getMainJSRuntime();
  std::shared_ptr<react::CallInvoker> getCallInvoker();

private:
  friend HybridBase;
  jni::global_ref<JFilamentProxy::javaobject> _javaPart;
  jsi::Runtime* _runtime;
  std::shared_ptr<facebook::react::CallInvoker> _callInvoker;
  std::shared_ptr<Dispatcher> _renderThreadDispatcher;
  std::shared_ptr<Dispatcher> _uiDispatcher;
  std::shared_ptr<Dispatcher> _backgroundDispatcher;

private:
  static auto constexpr TAG = "FilamentProxy";
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentProxy;";

private:
  explicit JFilamentProxy(const jni::alias_ref<JFilamentProxy::jhybridobject>& javaThis, jsi::Runtime* jsRuntime,
                          std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis, jlong jsRuntimePointer,
                                                jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder);
};

} // namespace margelo
