//
// Created by Marc Rousavy on 12.03.24.
//

#include "JDispatcher.h"

namespace margelo {

JDispatcher::~JDispatcher() { }

JDispatcher::JDispatcher(const jni::alias_ref<jhybridobject>& javaThis): _javaPart(jni::make_global(javaThis)) { }

jni::local_ref<JDispatcher::jhybriddata> JDispatcher::initHybrid(jni::alias_ref<jhybridobject> javaThis) {
  return makeCxxInstance(javaThis);
}

void JDispatcher::registerNatives() {
  registerHybrid({
       makeNativeMethod("runFunction", JDispatcher::runFunction)
   });
}

void JDispatcher::dispatch(std::function<void()>&& function) {
  static const auto method = javaClassStatic()->getStaticMethod<void(jlong)>("dispatch");
  method(javaClassStatic(), reinterpret_cast<jlong>(&function));
}

void JDispatcher::runFunction(jlong functionPointer) {
  (*reinterpret_cast<std::function<void()>*>(functionPointer))();
}


} // margelo