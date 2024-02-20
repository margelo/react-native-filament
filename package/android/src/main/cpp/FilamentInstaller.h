//
// Created by Marc Rousavy on 20.02.24.
//

#include <fbjni/fbjni.h>
#include <jni.h>
#include "JFilamentProxy.h"

namespace margelo {

using namespace facebook;

class FilamentInstaller : public jni::JavaClass<FilamentInstaller> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/margelo/filament/FilamentInstaller;";
  static void registerNatives();
  static void install(jni::alias_ref<jni::JClass> clazz, jni::alias_ref<JFilamentProxy::javaobject> proxy);
};

}; // namespace margelo
