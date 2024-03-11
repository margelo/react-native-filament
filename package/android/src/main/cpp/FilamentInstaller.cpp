#include "FilamentInstaller.h"
#include "AndroidFilamentProxy.h"
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>

namespace margelo {

void FilamentInstaller::install(jni::alias_ref<jni::JClass> clazz, jni::alias_ref<JFilamentProxy::javaobject> proxy) {
  jsi::Runtime& runtime = proxy->cthis()->getRuntime();
  std::shared_ptr<react::CallInvoker> callInvoker = proxy->cthis()->getCallInvoker();

  // global.FilamentProxy
  std::shared_ptr<AndroidFilamentProxy> filamentProxy = std::make_shared<AndroidFilamentProxy>(proxy);
  runtime.global().setProperty(runtime, "FilamentProxy", jsi::Object::createFromHostObject(runtime, filamentProxy));

  // PromiseFactory
  margelo::PromiseFactory::install(runtime, callInvoker);
}

void FilamentInstaller::registerNatives() {
  javaClassStatic()->registerNatives({makeNativeMethod("install", FilamentInstaller::install)});
}

} // namespace margelo
