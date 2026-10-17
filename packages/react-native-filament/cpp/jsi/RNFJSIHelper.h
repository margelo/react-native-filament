//
// Created by Hanno Gödecke on 15.05.24.
//

#pragma once

#include "RNFWorkletRuntimeRegistry.h"
#include <jsi/jsi.h>
#include <memory>

namespace margelo {

using namespace facebook;

class JSIHelper {
public:
  /**
   * Takes a jsi::Function and wraps it in a shared_ptr so its shareable.
   * Every jsi::Function you intend to share or hold should be wrapped using this function.
   */
  static std::shared_ptr<jsi::Function> createSharedJsiFunction(jsi::Runtime& runtime, jsi::Function&& function) {
    std::shared_ptr<jsi::Function> sharedFunction(new jsi::Function(std::move(function)), [&runtime](jsi::Function* ptr) {
      if (RNFWorkletRuntimeRegistry::isRuntimeAlive(&runtime)) {
        // Only delete the jsi::Function when the runtime it created is still alive.
        // Otherwise leak memory. We do this on purpose, as sometimes we would keep
        // references to JSI objects past the lifetime of its runtime (e.g.,
        // shared values references from the RN VM holds reference to JSI objects
        // on the UI runtime). When the runtime is terminated, the orphaned JSI
        // objects would crash the app when their destructors are called, because
        // they call into a memory that's managed by the terminated runtime. We
        // accept the tradeoff of leaking memory here, as it has a limited impact.
        // This scenario can only occur when the React instance is torn down which
        // happens in development mode during app reloads, or in production when
        // the app is being shut down gracefully by the system. An alternative
        // solution would require us to keep track of all JSI values that are in
        // use which would require additional data structure and compute spent on
        // bookkeeping that only for the sake of destroying the values in time
        // before the runtime is terminated. Note that the underlying memory that
        // jsi::Value refers to is managed by the VM and gets freed along with the
        // runtime.
        delete ptr;
      }
    });

    return sharedFunction;
  }
};
} // namespace margelo
