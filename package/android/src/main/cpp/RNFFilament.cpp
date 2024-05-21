#include "RNFFilamentInstaller.h"
#include "RNFJChoreographer.h"
#include "RNFJDispatcher.h"
#include "RNFJFilamentProxy.h"
#include "RNFJFilamentRecorder.h"
#include "RNFJFilamentView.h"
#include "RNFJSurfaceProvider.h"
#include <fbjni/fbjni.h>
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    margelo::FilamentInstaller::registerNatives();
    margelo::JFilamentProxy::registerNatives();
    margelo::JSurfaceProvider::registerNatives();
    margelo::JFilamentView::registerNatives();
    margelo::JFilamentRecorder::registerNatives();
    margelo::JChoreographer::registerNatives();
    margelo::JDispatcher::registerNatives();
  });
}
