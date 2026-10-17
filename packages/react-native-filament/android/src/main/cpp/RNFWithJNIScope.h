//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include <fbjni/fbjni.h>
#include <functional>

namespace facebook {
namespace jni {

  template <typename T> T WithJNIScope(std::function<T()>&& lambda) {
    // std::optional delays default constructor
    std::optional<T> result;
    jni::ThreadScope::WithClassLoader([&result, lambda = std::move(lambda)]() {
      // update the optional value
      result.emplace(lambda());
    });
    return std::move(result.value());
  }

} // namespace jni
} // namespace facebook