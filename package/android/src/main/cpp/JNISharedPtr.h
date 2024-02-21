//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <fbjni/fbjni.h>
#include <memory>

namespace margelo {

using namespace facebook;

struct GlobalRefDeleter {
  void operator()(jni::global_ref<jobject>* ref);
};

class JNISharedPtr {
public:
  template <typename T, typename std::enable_if<std::is_base_of<jni::HybridClass<T>, T>::value>::type* = nullptr>
  static std::shared_ptr<T> make_shared_from_jni(jni::global_ref<typename T::javaobject> ref);
};

} // namespace margelo
