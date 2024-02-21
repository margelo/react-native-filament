#include "FilamentInstaller.h"
#include "JFilamentProxy.h"
#include "JFilamentView.h"
#include "JSurfaceProvider.h"
#include <fbjni/fbjni.h>
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    margelo::FilamentInstaller::registerNatives();
    margelo::JFilamentProxy::registerNatives();
    margelo::JSurfaceProvider::registerNatives();
    margelo::JFilamentView::registerNatives();
  });
}
