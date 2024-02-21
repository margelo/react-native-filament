//
// Created by Marc Rousavy on 21.02.24.
//

#include "JFilamentView.h"

namespace margelo {

JFilamentView::JFilamentView(const jni::alias_ref<jhybridobject>& javaThis): _javaPart(make_global(javaThis)) {}

JFilamentView::~JFilamentView() {
    // TODO(marc): Cleanup?
}

void JFilamentView::registerNatives() {
    registerHybrid({
           makeNativeMethod("initHybrid", JSurfaceProvider::initHybrid),
    });
}

jni::local_ref<JFilamentView::jhybriddata> JFilamentView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing JFilamentView...");
    return makeCxxInstance(jThis);
}

std::shared_ptr<SurfaceProvider> getSurfaceProvider() {
    auto method = getClass()->getMethod<jni::alias_ref<JSurfaceProvider>>("getSurfaceProvider");
    jni::alias_ref<JSurfaceProvider> surfaceProvider = method(self());
    return surfaceProvider;
}


} // margelo