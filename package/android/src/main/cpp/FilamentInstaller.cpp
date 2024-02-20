#include <jni.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include "FilamentInstaller.h"
#include "AndroidFilamentProxy.h"

namespace margelo {

void FilamentInstaller::install(jni::alias_ref<jni::JClass> clazz,
                                jni::alias_ref<JFilamentProxy::javaobject> proxy) {
    jsi::Runtime& runtime = proxy->cthis()->getRuntime();
    std::shared_ptr<AndroidFilamentProxy> filamentProxy = std::make_shared<AndroidFilamentProxy>(proxy);
    runtime.global().setProperty(runtime, "__filamentProxy", jsi::Object::createFromHostObject(runtime, filamentProxy));
}

void FilamentInstaller::registerNatives() {
    javaClassStatic()->registerNatives({makeNativeMethod("install", FilamentInstaller::install)});
}

} // namespace margelo