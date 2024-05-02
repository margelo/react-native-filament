//
// Created by Marc Rousavy on 20.02.24.
//

#include "AndroidFilamentProxy.h"
#include "WithJNIScope.h"

namespace margelo {

using namespace facebook;

AndroidFilamentProxy::AndroidFilamentProxy(jni::alias_ref<JFilamentProxy::javaobject> proxy) : _proxy(jni::make_global(proxy)) {}

AndroidFilamentProxy::~AndroidFilamentProxy() {
  // Hermes GC might destroy HostObjects on an arbitrary Thread which might not
  // be connected to the JNI environment. To make sure fbjni can properly
  // destroy the Java method, we connect to a JNI environment first.
  jni::ThreadScope::WithClassLoader([&] { _proxy.reset(); });
}

std::shared_ptr<FilamentBuffer> AndroidFilamentProxy::loadAsset(const std::string& path) {
  return _proxy->cthis()->loadAsset(path);
}

std::shared_ptr<FilamentView> AndroidFilamentProxy::findFilamentView(int id) {
  return _proxy->cthis()->findFilamentView(id);
}

std::shared_ptr<Choreographer> AndroidFilamentProxy::createChoreographer() {
  return _proxy->cthis()->createChoreographer();
}

std::shared_ptr<FilamentRecorder> AndroidFilamentProxy::createRecorder(int width, int height, int fps, long bitRate) {
  return _proxy->cthis()->createRecorder(width, height, fps, bitRate);
}

std::shared_ptr<react::CallInvoker> AndroidFilamentProxy::getCallInvoker() {
  return _proxy->cthis()->getCallInvoker();
}

std::shared_ptr<Dispatcher> AndroidFilamentProxy::getRenderThreadDispatcher() {
  return _proxy->cthis()->getRenderThreadDispatcher();
}

std::shared_ptr<Dispatcher> AndroidFilamentProxy::getUIDispatcher() {
  return _proxy->cthis()->getUIDispatcher();
}

std::shared_ptr<Dispatcher> AndroidFilamentProxy::getBackgroundDispatcher() {
  return _proxy->cthis()->getBackgroundDispatcher();
}

jsi::Runtime& AndroidFilamentProxy::getRuntime() {
  return _proxy->cthis()->getRuntime();
}

float AndroidFilamentProxy::getDisplayRefreshRate() {
  return _proxy->cthis()->getDisplayRefreshRate();
}

} // namespace margelo
