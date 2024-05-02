//
// Created by Marc Rousavy on 21.02.24.
//

#include "JFilamentRecorder.h"

namespace margelo {

JFilamentRecorder::JFilamentRecorder(const jni::alias_ref<jhybridobject>& javaThis)
    : _javaPart(make_global(javaThis)) {

}

JFilamentRecorder::~JFilamentRecorder() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Destroying JFilamentRecorder...");
}

void JFilamentRecorder::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JFilamentRecorder::initHybrid),
  });
}

jni::local_ref<JFilamentRecorder::jhybriddata> JFilamentRecorder::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing JFilamentRecorder...");
  return makeCxxInstance(jThis);
}

} // namespace margelo
