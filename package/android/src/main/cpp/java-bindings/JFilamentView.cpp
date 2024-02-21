//
// Created by Marc Rousavy on 21.02.24.
//

#include "JFilamentView.h"
#include "JNISharedPtr.h"
#include "JSurfaceProvider.h"

namespace margelo {

JFilamentView::JFilamentView(const jni::alias_ref<jhybridobject>& javaThis, jni::alias_ref<JSurfaceProvider::javaobject> surfaceProvider)
    : _javaPart(make_global(javaThis)), _surfaceProvider(jni::make_global(surfaceProvider)) {}

JFilamentView::~JFilamentView() {
  // TODO(marc): Cleanup?
}

void JFilamentView::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JFilamentView::initHybrid),
  });
}

jni::local_ref<JFilamentView::jhybriddata> JFilamentView::initHybrid(jni::alias_ref<jhybridobject> jThis,
                                                                     jni::alias_ref<JSurfaceProvider::javaobject> surfaceProvider) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing JFilamentView...");
  return makeCxxInstance(jThis, surfaceProvider);
}

std::shared_ptr<SurfaceProvider> JFilamentView::getSurfaceProvider() {
  return JNISharedPtr::make_shared_from_jni<JSurfaceProvider>(_surfaceProvider);
}

} // namespace margelo