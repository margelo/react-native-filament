//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include <fbjni/fbjni.h>
#include <functional>

namespace facebook {
namespace jni {

  template <typename T> T WithJNIScope(std::function<T()>&& lambda) {
    T result;
    jni::ThreadScope::WithClassLoader([&result, lambda = std::move(lambda)]() { result = lambda(); });
    return std::move(result);
  }

} // namespace jni
} // namespace facebook